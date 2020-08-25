export function webRTCClient() { 
    var conn = new connHandler()

    conn.startUserMedia()
    conn.sendIceCandidates()
    conn.startListener()
}

// Default ICEServers - Google provides public testing server
const defaultIceServers = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        }
    ]
}

const userMediaSettings = { video: true }

class connHandler {
    constructor() {
        // Establish websocket signalling channel and new webRTCPeerConnection
        this.socket = new WebSocket("ws://" + window.location.hostname + ":8080/ws")
        this.peerConnection = new RTCPeerConnection(defaultIceServers)
        this.source = null
        this.listener = null

        // Server (offer) and client (answer) can't switch once established
        // Client signals server when renegotiation is necessary
        this.peerConnection.onnegotiationneeded = e => {
            this.send("renegotiate")
        }
    }

    send(payload) {
        this.socket.send(JSON.stringify(payload))
    }

    startUserMedia() {
        // Acces getUserMedia API and stream video track
        // Add audio with "audio: true" and getAudioTracks()
        let conn = this
        const f = async function startStream() {
            let source = await navigator.mediaDevices.getUserMedia(userMediaSettings)
            for (const track of source.getVideoTracks()) {
                conn.peerConnection.addTrack(track, source)
            }
        }
        f()
    }

    sendIceCandidates() {
        // Whenever there is a new ICECandidate send to server
        this.peerConnection.onicecandidate = event => {
            if (event.candidate != null) {
             this.send(event.candidate)
            }
        }
    }

    startListener() {
        // Client receives ICECandidates or Descriptions
        this.socket.onmessage = event => {
            var message = JSON.parse(event.data)
            if (message.sdp) {
                // Once local and remote descriptions are synced connection will be formed
                this.peerConnection.setRemoteDescription(new RTCSessionDescription(message))
                this.peerConnection.createAnswer()
                    .then(answer => {
                        this.peerConnection.setLocalDescription(answer)
                        this.send(answer)
                    })
            } else if (message.candidate) {
                this.peerConnection.addIceCandidate(message)
            }
        }
    }
}

