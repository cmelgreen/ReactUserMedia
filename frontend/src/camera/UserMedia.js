import { useState, useEffect } from 'react';
import { startConnection } from './webRTC';

export function UserMedia() {
    const [stream, setStream] = useState(null);

    useEffect (() => {
        async function startStream() {
            const video = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(video); 
            startConnection(video);
        }

        startStream();
    }, []);

    return stream;
}