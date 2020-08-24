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
        this.peerConnection.onnegotiationneeded = e => this.peerConnection.createOffer()
            .then(offer => this.peerConnection.setLocalDescription(offer))
            .then(() => {
                console.log("onnegotationneeded")
                //this.send(this.peerConnection.localDescription)
            })
    }

    negotiate() {
        this.peerConnection.createOffer()
            .then(d => this.peerConnection.setLocalDescription(d))
        this.startUserMedia(this)
        this.sendIceCandidates()
        this.startListener()

            //.then(this.addMediaTrack())
    }

    startUserMedia(conn) {
        const f = async function startStream() {
            console.log("startUserMedia F")
            var video = await navigator.mediaDevices.getUserMedia({ video: true })
            for (const track of video.getVideoTracks()) {
                conn.peerConnection.addTrack(track, video)
                console.log(conn, track)
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
                conn.receiveOffer(message)
            } else if (message.candidate) {
                conn.receiveICECandidate(message)
            }
        }
    }

    receiveOffer(message) {
        console.log("receiveOffer")
        this.peerConnection.setRemoteDescription(new RTCSessionDescription(message))
        this.sendAnswer()
    }

    sendAnswer() {
        console.log("sendAnswer")
        let conn = this
        conn.peerConnection.createAnswer()
            .then(answer => {
                console.log(answer)
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

