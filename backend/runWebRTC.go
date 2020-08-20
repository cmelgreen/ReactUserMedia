package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/julienschmidt/httprouter"
	"github.com/gorilla/websocket"
	"github.com/pion/webrtc"
	//"github.com/pion/webrtc/pkg/media"
	//"github.com/pion/webrtc/pkg/media/ivfwriter"
	//"github.com/pion/webrtc/pkg/media/oggwriter"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type connHandler struct {
	socket *websocket.Conn
	peerConnection *webrtc.PeerConnection
}

func newConnHandler(w http.ResponseWriter, r *http.Request) (connHandler, error) {
	conn := connHandler{}

	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return conn, err
	}

	pc, err := newPeerConnection()
	if err != nil {
		return conn, err
	}

	conn.socket = ws
	conn.peerConnection = pc

	return conn, nil
}

func webRTCHandle(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	conn, err := newConnHandler(w, r)
	if err != nil {
		fmt.Fprint(w, "unable to connect")
	}

	conn.negotiate()
	conn.listen()
}

func newAPIWithMedia() *webrtc.API {
	m := webrtc.MediaEngine{}
	m.RegisterCodec(webrtc.NewRTPOpusCodec(webrtc.DefaultPayloadTypeOpus, 48000))
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
	if _, err := conn.peerConnection.AddTransceiverFromKind(webrtc.RTPCodecTypeAudio); err != nil {
		panic(err)
	} else if _, err = conn.peerConnection.AddTransceiverFromKind(webrtc.RTPCodecTypeVideo); err != nil {
		panic(err)
	}

	var candidatesMux sync.Mutex
	pendingCandidates := make([]*webrtc.ICECandidate, 0)

	offer, err := conn.peerConnection.CreateOffer(nil)
	if err != nil {
		panic(err)
	}

	if err = conn.peerConnection.SetLocalDescription(offer); err != nil {
		panic(err)
	}

	payload, err := json.Marshal(offer)
	if err != nil {
		panic(err)
	}

	conn.socket.WriteMessage(websocket.TextMessage, payload)

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
		}

		var b webrtc.SessionDescription
		err = json.Unmarshal(p, &b)
		if err != nil {
			fmt.Println("wsReader unmarshal SessionDescription: ", err)
		}

		var c webrtc.ICECandidateInit
		err = json.Unmarshal(p, &c)
		if err != nil {
			fmt.Println("wsReader unmarshal ICECandidateInit")
		}
		fmt.Println("candidate received: ", c)

		conn.peerConnection.SetRemoteDescription(b)
		conn.peerConnection.AddICECandidate(c)
	}
}
