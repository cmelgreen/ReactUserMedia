(this.webpackJsonpnew=this.webpackJsonpnew||[]).push([[0],{10:function(e,n,t){e.exports=t(16)},16:function(e,n,t){"use strict";t.r(n);var o=t(0),i=t.n(o),r=t(4),c=t.n(r),s=t(9),a=t(2),u=t.n(a),l=t(5),d=t(6),f=t(7),h=t(8);var p={iceServers:[{urls:"stun:stun.l.google.com:19302"}]},v=function(){function e(){var n=this;Object(f.a)(this,e),this.socket=new WebSocket("ws://"+window.location.hostname+":8050/ws"),this.peerConnection=new RTCPeerConnection(p),this.listener=null,this.peerConnection.oniceconnectionstatechange=function(){return console.log("state change",n.peerConnection.iceConnectionState)},this.peerConnection.onnegotiationneeded=function(e){return n.peerConnection.createOffer().then((function(e){return n.peerConnection.setLocalDescription(e)})).then((function(){console.log("onnegotationneeded")}))}}return Object(h.a)(e,[{key:"negotiate",value:function(){var e=this;this.peerConnection.createOffer().then((function(n){return e.peerConnection.setLocalDescription(n)})),this.startUserMedia(this),this.sendIceCandidates(),this.startListener()}},{key:"startUserMedia",value:function(e){(function(){var n=Object(d.a)(u.a.mark((function n(){var t,o,i,r;return u.a.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:return console.log("startUserMedia F"),n.next=3,navigator.mediaDevices.getUserMedia({video:!0});case 3:t=n.sent,o=Object(l.a)(t.getVideoTracks());try{for(o.s();!(i=o.n()).done;)r=i.value,e.peerConnection.addTrack(r,t),console.log(e,r)}catch(c){o.e(c)}finally{o.f()}case 6:case"end":return n.stop()}}),n)})));return function(){return n.apply(this,arguments)}})()()}},{key:"startListener",value:function(){console.log("startListener"),this.listener=this.newListener()}},{key:"newListener",value:function(){console.log("newListener");var e=this;this.socket.onmessage=function(n){var t=JSON.parse(n.data);t.sdp?e.receiveOffer(t):t.candidate&&e.receiveICECandidate(t)}}},{key:"receiveOffer",value:function(e){console.log("receiveOffer"),this.peerConnection.setRemoteDescription(new RTCSessionDescription(e)),this.sendAnswer()}},{key:"sendAnswer",value:function(){console.log("sendAnswer");var e=this;e.peerConnection.createAnswer().then((function(n){return console.log(n),e.send(n),e.peerConnection.setLocalDescription(n)}))}},{key:"addUserMedia",value:function(){console.log("addUserMedia"),this.startUserMedia()}},{key:"receiveICECandidate",value:function(e){console.log("receiveICEcandidate: ",e),this.peerConnection.addIceCandidate(e)}},{key:"sendIceCandidates",value:function(){var e=this;return console.log("sendIceCandidate"),this.peerConnection.onicecandidate=function(n){e.isOpen()&&null!=n.candidate&&e.send(n.candidate)}}},{key:"send",value:function(e){console.log("send: ",e),this.socket.send(JSON.stringify(e))}},{key:"isOpen",value:function(){return this.socket.readyState==WebSocket.OPEN}},{key:"isOffer",value:function(){return"offer"==this.peerConnection.remoteDescription.type}},{key:"isAnswer",value:function(){return"answer"==this.peerConnection.remoteDescription.type}}]),e}();function g(){var e=Object(o.useState)(null),n=Object(s.a)(e,2),t=n[0],i=n[1];return Object(o.useEffect)((function(){i(void(new v).negotiate())}),[]),t}function C(){var e=Object(o.useRef)(),n=g();return n&&e.current&&(e.current.srcObject=n,e.current.play()),i.a.createElement(i.a.Fragment,null,i.a.createElement("video",{ref:e,width:"640",height:"480",autoPlay:!0}))}var k=i.a.createElement(C,null);function w(){return k}var y=document.getElementById("root");c.a.render(i.a.createElement(w,null),y)}},[[10,1,2]]]);
//# sourceMappingURL=main.69a202b2.chunk.js.map