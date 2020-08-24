export function newWebRTCClient() { 
    var conn = new connHandler()

    conn.negotiate()
}

const defaultIceServers = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302'
        }
    ]
}

class connHandler {
    constructor() {
        this.socket = new WebSocket("ws://" + window.location.hostname + ":8050/ws")
        this.peerConnection = new RTCPeerConnection(defaultIceServers)
        this.listener = null
        this.peerConnection.oniceconnectionstatechange = () => console.log("state change", this.peerConnection.iceConnectionState)
        this.socket.addEventListener('open', () => {
            console.log("socket open")
            this.peerConnection.onnegotiationneeded = e => {
                console.log("negotiation needed")
                this.send("renegotiate")
            }
        })
    }
    
    negotiate() {
        //this.sendOffer()
        this.startUserMedia(this)
        this.sendIceCandidates()
        this.startListener()
        //this.sendOffer()

            //.then(this.addMediaTrack())
    }

    sendOffer() {
        console.log("sendOffer")
        this.peerConnection.createOffer()
            .then(d => {
                this.peerConnection.setLocalDescription(d)
                this.send(d)
            })

    }

    startUserMedia(conn) {
        const f = async function startStream() {
            console.log("startUserMedia")
            var video = await navigator.mediaDevices.getUserMedia({ video: true })
            for (const track of video.getVideoTracks()) {
                conn.peerConnection.addTrack(track, video)
                console.log(track)
            }
        }
        f()
    }

    startListener() {
        console.log("startListener")
        this.listener = this.newListener()
    }

    newListener() {
        console.log("newListener")
        let conn = this
        this.socket.onmessage = event => {
            var message = JSON.parse(event.data)
            if (message.sdp) {
                this.receiveDesc(message)
            } else if (message.candidate) {
                conn.receiveICECandidate(message)
            }
        }
    }

    receiveDesc(message) {
        console.log("receiveDesc", message.type)
        console.log(message.sdp)
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(message))
        if (message.type == "offer") {
            this.sendAnswer()
        }
    }

    sendAnswer() {
        console.log("sendAnswer")
        let conn = this
        conn.peerConnection.createAnswer()
            .then(answer => {
                conn.send(answer)
                return conn.peerConnection.setLocalDescription(answer)
            })
    }

    addUserMedia() {
        console.log("addUserMedia")
        this.startUserMedia()
    }

    receiveICECandidate(message) {
        console.log("receiveICEcandidate: ", message)
        this.peerConnection.addIceCandidate(message)
    }

    sendIceCandidates() {
        console.log("sendIceCandidate")
        return this.peerConnection.onicecandidate = event => {
            if ( this.isOpen() && event.candidate != null) {
             this.send(event.candidate)
            }}
    }

    send(payload) {
        console.log("send: ", payload)
        this.socket.send(JSON.stringify(payload))
    }

    isOpen() {
        return ( this.socket.readyState == WebSocket.OPEN )
    }
    
    isOffer() {
        return ( this.peerConnection.remoteDescription.type == "offer" )
    }
    
    isAnswer() {
        return ( this.peerConnection.remoteDescription.type == "answer" )
    }
}

