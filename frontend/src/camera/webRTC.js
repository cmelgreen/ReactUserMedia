export function startConnection(stream) {
    let pc = new RTCPeerConnection({
        iceServers: [
            {
                urls: 'stun:stun.l.google.com:19302'
                
            }
        ]
    })

    pc.addStream(stream)
    pc.createOffer().then(d => pc.setLocalDescription(d))

    pc.onicecandidate = event => {
        if (event.candidate != null) {
            send(pc.localDescription)
        }
    };
}

function send(data) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/ws", true); 
    xhttp.setRequestHeader("Content-Type", "application/json");
    xhttp.send(data);
}