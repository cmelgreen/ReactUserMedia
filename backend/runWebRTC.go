package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"

	"github.com/pion/rtcp"
	"github.com/pion/webrtc"
	"github.com/pion/webrtc/pkg/media"
	"github.com/pion/webrtc/pkg/media/ivfwriter"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  512,
	WriteBufferSize: 512,
}

type connHandler struct {
	socket *websocket.Conn
	peerConnection *webrtc.PeerConnection
}

func newConnHandler(w http.ResponseWriter, r *http.Request) (connHandler, error) {
	conn := connHandler{}

	// Upgrade http to websocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return conn, err
	}

	// Create new webrtc peer connection obj
	// Note: connection to client won't be formed until negotiate() is called
	pc, err := newPeerConnection()
	if err != nil {
		return conn, err
	}

	conn.socket = ws
	conn.peerConnection = pc

	return conn, nil
}

func webRTCHandle(w http.ResponseWriter, r *http.Request) {
	conn, err := newConnHandler(w, r)
	if err != nil {
		fmt.Fprint(w, "unable to connect")
	}

	conn.negotiate()
	conn.listen()
}

func newAPIWithMedia() *webrtc.API {
	m := webrtc.MediaEngine{}
	// m.RegisterCodec(webrtc.NewRTPOpusCodec(webrtc.DefaultPayloadTypeOpus, 48000))
	m.RegisterCodec(webrtc.NewRTPVP8Codec(webrtc.DefaultPayloadTypeVP8, 90000))

	return webrtc.NewAPI(webrtc.WithMediaEngine(m))
}

func newPeerConnection() (*webrtc.PeerConnection, error) {
	api := newAPIWithMedia()

	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		},
	}

	peerConnection, err := api.NewPeerConnection(config)
	if err != nil {
		return nil, err
	}

	return peerConnection, nil
}

func (conn *connHandler) negotiate() {
 	if _, err := conn.peerConnection.AddTransceiverFromKind(webrtc.RTPCodecTypeVideo); err != nil {
		panic(err)
	}

	var candidatesMux sync.Mutex
	pendingCandidates := make([]*webrtc.ICECandidate, 0)

	ivfFile, err := ivfwriter.New("output.ivf")
	if err != nil {
		panic(err)
	}

	conn.peerConnection.OnTrack(func(track *webrtc.Track, receiver *webrtc.RTPReceiver) {
		// Send a PLI on an interval so that the publisher is pushing a keyframe every rtcpPLIInterval
		fmt.Println("*****ONTRACK*****")
		go func() {
			ticker := time.NewTicker(time.Second * 3)
			for range ticker.C {
				errSend := conn.peerConnection.WriteRTCP([]rtcp.Packet{&rtcp.PictureLossIndication{MediaSSRC: track.SSRC()}})
				if errSend != nil {
					fmt.Println(errSend)
				}
			}
		}()

		codec := track.Codec()

		if codec.Name == webrtc.VP8 {
			fmt.Println("Got VP8 track, saving to disk as output.ivf")
			saveToDisk(ivfFile, track)
		}
	})

	conn.peerConnection.OnICECandidate(func(c *webrtc.ICECandidate) {
		fmt.Println("candidate sent: ", c)
		if c == nil {
			return
		}

		candidatesMux.Lock()
		defer candidatesMux.Unlock()

		payload, err := json.Marshal(c.ToJSON())
		if err != nil {
			fmt.Println("unable to marshal json")
		}
		conn.sendMessage(websocket.TextMessage, payload)

		desc := conn.peerConnection.RemoteDescription()
		if desc == nil {
			pendingCandidates = append(pendingCandidates, c)
		} else {
			conn.sendMessage(websocket.TextMessage, payload)
		}
	})

	conn.sendOffer()
}

func (conn *connHandler) sendOffer() {
	offer, err := conn.peerConnection.CreateOffer(nil)
	if err != nil {
		panic(err)
	}

	if err = conn.peerConnection.SetLocalDescription(offer); err != nil {
		panic(err)
	}

	fmt.Println(offer)
	payload, err := json.Marshal(offer)
	if err != nil {
		panic(err)
	}

	conn.socket.WriteMessage(websocket.TextMessage, payload)
}

func (conn *connHandler) sendMessage(messageType int, payload []byte) {
	err := conn.socket.WriteMessage(messageType, payload)
	if err != nil {
		fmt.Println("message not sent")
	}
}

func (conn *connHandler) listen() {
	fmt.Println("listening")
	for {
		_, p, err := conn.socket.ReadMessage()
		if err != nil {
			fmt.Println("wsReader read", err)
			fmt.Println("Closing connections")
			return
		}

		var answer webrtc.SessionDescription
		err = json.Unmarshal(p, &answer)
		if err != nil {
			fmt.Println("wsReader unmarshal SessionDescription: ", err)
		}

		fmt.Println("answer received", answer.Type)
		if answer.Type == webrtc.SDPTypeOffer {
			conn.peerConnection.SetRemoteDescription(answer)
			
		}

		var c webrtc.ICECandidateInit
		err = json.Unmarshal(p, &c)
		if err != nil {
			fmt.Println("wsReader unmarshal ICECandidateInit")
		}
		fmt.Println("candidate received: ", c)

		//conn.peerConnection.SetRemoteDescription(answer)
		conn.peerConnection.AddICECandidate(c)
	}
}

func saveToDisk(i media.Writer, track *webrtc.Track) {
	defer func() {
		if err := i.Close(); err != nil {
			panic(err)
		}
	}()

	for {
		rtpPacket, err := track.ReadRTP()
		if err != nil {
			panic(err)
		}
		if err := i.WriteRTP(rtpPacket); err != nil {
			panic(err)
		}
	}
}
