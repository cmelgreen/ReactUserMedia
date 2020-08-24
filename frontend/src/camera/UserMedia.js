import { useState, useEffect } from 'react';
//import { startConnection } from './webRTC';
import { newWebRTCClient } from './webRTCRefactor';

export function UserMedia() {
    const [stream, setStream] = useState(null);

    useEffect (() => {
        // async function startStream() {
        //     const video = await navigator.mediaDevices.getUserMedia({ video: true });
        //     startConnection(video);
        //     setStream(video); 
        // }

        setStream(newWebRTCClient())

        //startStream();
    }, []);

    return stream;
}