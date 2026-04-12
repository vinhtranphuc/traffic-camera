"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface Props {
  src: string;
  poster?: string;
}

export default function HlsPlayer({ src, poster }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else if (Hls.isSupported()) {
      hls = new Hls({ maxBufferLength: 10 });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) setError(`Stream error: ${data.type}`);
      });
    } else {
      setError("HLS không được hỗ trợ trên trình duyệt này");
    }

    return () => {
      hls?.destroy();
    };
  }, [src]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-black text-sm text-red-400">
        {error}
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      poster={poster}
      controls
      muted
      autoPlay
      playsInline
      className="h-full w-full bg-black"
    />
  );
}
