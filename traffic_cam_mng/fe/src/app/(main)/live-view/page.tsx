"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cameraService } from "@/services/cameraService";
import CameraStream from "@/components/camera/CameraStream";
import DetectionToggleBadge from "@/components/camera/DetectionToggleBadge";

export default function LiveViewPage() {
  const t = useTranslations();
  const [cameras, setCameras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cameraService.list({ size: 100 })
      .then((res) => setCameras((res.data.data?.items || []).filter((c: any) => c.status === "ACTIVE")))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : cameras.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">{t("liveView.noActive")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {cameras.map((cam: any) => (
            <div key={cam.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative h-64 bg-black">
                <CameraStream cameraId={cam.id} cameraName={cam.name} sourceType={cam.sourceType} />
                <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  {t("liveView.live")}
                </span>
                <DetectionToggleBadge
                  cameraId={cam.id}
                  detectionEnabled={!!cam.detectionEnabled}
                  detectionSettings={cam.detectionSettings}
                  onChange={(next) =>
                    setCameras((prev) =>
                      prev.map((c) => (c.id === cam.id ? { ...c, ...next } : c))
                    )
                  }
                />
              </div>
              <div className="flex items-center justify-between border-t border-border px-4 py-2">
                <span className="text-sm font-medium">{cam.name}</span>
                <span className="text-xs text-muted-foreground">{cam.sourceType}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
