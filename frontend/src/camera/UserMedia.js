import { useState, useEffect } from 'react';

export function UserMedia() {
  const [stream, setStream] = useState(null);

  useEffect (() => {
    async function startStream() {
      const video = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(video); 
    }

    startStream();

  }, []);

  return stream;
}