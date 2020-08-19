package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"

	"github.com/pion/webrtc"
	"github.com/gorilla/websocket"
	"github.com/julienschmidt/httprouter"
)

var tpl *template.Template

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

func init() {
	tpl = template.Must(template.ParseGlob("../frontend/build/*.html"))
}

func main() {
	router := httprouter.New()

	router.GET("/", index)
	router.GET("/ws", wsServer)
	router.ServeFiles("/static/*filepath", http.Dir("../frontend/build/static"))

	log.Fatal(http.ListenAndServe(":8050", router))
}

func index(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	tpl.ExecuteTemplate(w, "index.html", nil)
}

func wsServer(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println(err)
	}

	peerConnection := runWebRTC(ws)
	wsReader(ws, peerConnection)

}

func wsReader(conn *websocket.Conn, peerConnection *webrtc.PeerConnection) {
	fmt.Println("listening")
	for {
		_, p, err := conn.ReadMessage()
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

		peerConnection.SetRemoteDescription(b)
		peerConnection.AddICECandidate(c)

	}

}
