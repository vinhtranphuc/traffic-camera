"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Maximize, VolumeX, Volume2, RotateCw, AlertCircle } from "lucide-react";

interface Props {
  src: string;
  poster?: string;
  autoRetry?: boolean;
}

export default function HlsPlayer({ src, poster, autoRetry = true }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError(null);

    // Cleanup previous
    hlsRef.current?.destroy();
    hlsRef.current = null;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native
      video.src = src;
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 10,
        manifestLoadingMaxRetry: autoRetry ? 3 : 0,
        levelLoadingMaxRetry: autoRetry ? 3 : 0,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          setError(`Lỗi stream: ${data.type}`);
        }
      });
      hlsRef.current = hls;
    } else {
      setError("Trình duyệt không hỗ trợ HLS");
    }

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src, retryKey, autoRetry]);

  const toggleFullscreen = () => {
    const el = videoRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (v) {
      v.muted = !v.muted;
      setMuted(v.muted);
    }
  };

  const retry = () => setRetryKey((k) => k + 1);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-black/80 p-4 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="mt-2 text-sm text-red-400">{error}</p>
        <button
          onClick={retry}
          className="mt-3 flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
        >
          <RotateCw className="h-3 w-3" />
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full group">
      <video
        ref={videoRef}
        poster={poster}
        controls={false}
        muted={muted}
        autoPlay
        playsInline
        className="h-full w-full bg-black"
      />
      {/* Controls overlay */}
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={toggleMute}
          className="rounded bg-black/60 p-2 text-white hover:bg-black/80"
          aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button
          onClick={retry}
          className="rounded bg-black/60 p-2 text-white hover:bg-black/80"
          aria-label="Tải lại stream"
        >
          <RotateCw className="h-4 w-4" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="rounded bg-black/60 p-2 text-white hover:bg-black/80"
          aria-label="Toàn màn hình"
        >
          <Maximize className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
