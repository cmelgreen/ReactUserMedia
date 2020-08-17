import { useState, useEffect } from 'react';

export function UserMedia() {
    const [stream, setStream] = useState(null);

    useEffect ( () => setStream(navigator.mediaDevices.getUserMedia({ video: true })) );

    return stream;
}