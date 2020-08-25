import { useState, useEffect } from 'react';
import { webRTCClient } from './webRTCClient';

export function UserMedia() {
    const [stream, setStream] = useState(null);

    useEffect (() => {

        // async function startStream() {
        //     const video = await navigator.mediaDevices.getUserMedia({ video: true });
        //     setStream(video); 
        // }

        webRTCClient()

        // function startStream() {
        //     pc.ontrack = event => {
        //     console.log("ontrack: ", event.streams[0])
        //     const video = event.streams[0]
        //     setStream(video)
        // }
        //startStream()

    }, []);

    return stream;
}