"use client";

import { useEffect, useState } from "react";
import { Radio, AlertCircle, Loader2 } from "lucide-react";
import { cameraService } from "@/services/cameraService";
import HlsPlayer from "./HlsPlayer";

interface Props {
  cameraId: string;
  cameraName: string;
  sourceType: string;
}

interface StreamInfo {
  type: string;
  url: string | null;
  proxied?: boolean;
  message?: string;
}

export default function CameraStream({ cameraId, cameraName, sourceType }: Props) {
  const [info, setInfo] = useState<StreamInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    cameraService.getStreamInfo(cameraId)
      .then((r) => { if (mounted) setInfo(r.data.data); })
      .catch((e) => { if (mounted) setInfo({ type: "error", url: null, message: e.message }); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [cameraId]);

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-2 text-xs">Đang tải...</p>
      </div>
    );
  }

  if (!info || !info.url) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center text-muted-foreground">
        <AlertCircle className="h-10 w-10 opacity-40" />
        <p className="mt-2 text-sm font-medium">{cameraName}</p>
        <p className="text-xs">{sourceType}</p>
        <p className="mt-2 text-xs text-red-400">{info?.message || "Stream không khả dụng"}</p>
      </div>
    );
  }

  if (info.type === "hls") {
    return <HlsPlayer src={info.url} />;
  }

  if (info.type === "mjpeg") {
    return (
      <img
        src={info.url}
        alt={cameraName}
        className="h-full w-full object-contain bg-black"
      />
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
      <Radio className="h-12 w-12 opacity-30" />
      <p className="mt-2 text-sm">{cameraName}</p>
      <p className="text-xs">{info.message || `Unsupported: ${info.type}`}</p>
    </div>
  );
}
