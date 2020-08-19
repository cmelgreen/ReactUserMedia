package main

import (
	"encoding/json"
	"fmt"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/pion/webrtc"
	//"github.com/pion/webrtc/pkg/media"
	//"github.com/pion/webrtc/pkg/media/ivfwriter"
	//"github.com/pion/webrtc/pkg/media/oggwriter"
)

func runWebRTC(conn *websocket.Conn) *webrtc.PeerConnection {
	fmt.Println("starting")
	m := webrtc.MediaEngine{}

	m.RegisterCodec(webrtc.NewRTPOpusCodec(webrtc.DefaultPayloadTypeOpus, 48000))
	m.RegisterCodec(webrtc.NewRTPVP8Codec(webrtc.DefaultPayloadTypeVP8, 90000))

	api := webrtc.NewAPI(webrtc.WithMediaEngine(m))

	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		},
	}

	// Create a new RTCPeerConnection
	peerConnection, err := api.NewPeerConnection(config)
	if err != nil {
		panic(err)
	}

	if _, err = peerConnection.AddTransceiverFromKind(webrtc.RTPCodecTypeAudio); err != nil {
		panic(err)
	} else if _, err = peerConnection.AddTransceiverFromKind(webrtc.RTPCodecTypeVideo); err != nil {
		panic(err)
	}

	var candidatesMux sync.Mutex
	pendingCandidates := make([]*webrtc.ICECandidate, 0)

	offer, err := peerConnection.CreateOffer(nil)
	if err != nil {
		panic(err)
	}

	if err = peerConnection.SetLocalDescription(offer); err != nil {
		panic(err)
	}

	payload, err := json.Marshal(offer)
	if err != nil {
		panic(err)
	}

	fmt.Println(string(payload))

	conn.WriteMessage(websocket.TextMessage, payload)


	peerConnection.OnICECandidate(func(c *webrtc.ICECandidate) {
		fmt.Println("candidate sent: ", c)
		if c == nil {
			return
		}

		candidatesMux.Lock()
		defer candidatesMux.Unlock()

		signalCandidate(conn, c)

		desc := peerConnection.RemoteDescription()
		if desc == nil {
			pendingCandidates = append(pendingCandidates, c)
		} else if err := signalCandidate(conn, c); err != nil {
			fmt.Println(err)
		}
	})

	return peerConnection



	// oggFile, err := oggwriter.New("output.ogg", 48000, 2)
	// if err != nil {
	// 	panic(err)
	// }
	// ivfFile, err := ivfwriter.New("output.ivf")
	// if err != nil {
	// 	panic(err)
	// }

}

//ICECandidateMessage wwraps webrtc.ICECandidateInit for Javascript parsing
type ICECandidateMessage struct {
	webrtc.ICECandidateInit `json:"ice"`
}

func signalCandidate(conn *websocket.Conn, c *webrtc.ICECandidate) error {
	payload, err := json.Marshal(c.ToJSON())
	if err != nil {
		return err
	}

	err = conn.WriteMessage(websocket.TextMessage, payload)
	if err != nil {
		return err
	}

	return nil
}

	// payload, err := json.Marshal(ICECandidateMessage{c.ToJSON()})
	// if err != nil {
	// 	return err
	// }

// 	// fmt.Println(string(payload))
// 	// err = conn.WriteMessage(websocket.TextMessage, payload))

// 	// if err != nil {
// 	// 	return err
// 	// }

// 	// return nil
// }
