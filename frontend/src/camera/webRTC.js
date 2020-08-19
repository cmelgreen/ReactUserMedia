export function startConnection(stream) {
    let pc = new RTCPeerConnection({
        iceServers: [
            {
                urls: 'stun:stun.l.google.com:19302'
                
            }
        ]
    })

    var socket = new WebSocket("ws://" + window.location.hostname + ":8050/ws");

    pc.addStream(stream)
    pc.createOffer().then(d => pc.setLocalDescription(d))

    pc.onicecandidate = event => {
        if ( isOpen(socket) && event.candidate != null) {
            send(socket, event.candidate)
        }
    };

    receive(socket, pc)
}

function isOpen(socket) {
    return (socket.readyState == WebSocket.OPEN)
}

function send(socket, data) {
    try {
        socket.send(JSON.stringify(data))
        console.log("sending: ", data)
    } catch(e) {
        console.log(e)
    }
}

function receive(socket, pc) {
    return socket.onmessage = function (evt) {

        try {
            var message = JSON.parse(evt.data);
            console.log("receiving: ", message)
            if (message.sdp) {
                pc.setRemoteDescription(new RTCSessionDescription(message), function () {
                    if (pc.remoteDescription.type == "offer") {
                        pc.createAnswer().then(function(answer) {
                            send(socket, answer);
                            return pc.setLocalDescription(answer);
                        })
                        .catch(e => console.log(e));
                    }
                }, e => console.log("e"))
            } else {
                pc.addIceCandidate(message)
                    .then(console.log("candidate added"))
                    .catch( e => console.log(e))
            }
        } catch(e) {
            console.log("error: ", e)
            console.log("message: ", )
        }
    
    }
}

