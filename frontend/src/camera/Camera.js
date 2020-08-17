import React, { useRef } from 'react';
import { UserMedia } from './UserMedia';

export function Camera() {
    const video = useRef();
    const stream = UserMedia();

    if (stream && video.current) {
        video.current.srcObject = stream;
        video.current.play();
    }

    return (
        <video ref={video} width="640" height="480" autoplay/>
    );
}