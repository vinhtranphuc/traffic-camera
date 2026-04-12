"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { cameraService } from "@/services/cameraService";
import RoiEditor from "@/components/camera/RoiEditor";

export default function CameraDetailPage() {
  const t = useTranslations();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [camera, setCamera] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [roi, setRoi] = useState<any[]>([]);
  const [detection, setDetection] = useState({
    detectVehicles: true,
    vehicleTypes: ["car", "motorcycle"],
    detectPersons: false,
    detectPlates: false,
  });

  const load = () => {
    setLoading(true);
    cameraService.get(id)
      .then((res) => {
        const data = res.data.data;
        setCamera(data);
        setRoi(data.roiConfig || []);
        setDetection({ ...detection, ...(data.detectionSettings || {}) });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const saveRoi = async () => {
    await cameraService.update(id, { roiConfig: roi });
    toast.success(t("common.success"));
  };

  const saveDetection = async () => {
    await cameraService.update(id, { detectionSettings: detection });
    toast.success(t("common.success"));
  };

  if (loading || !camera) return <div className="p-6">{t("common.loading")}</div>;

  return (
    <div className="p-6">
      <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{camera.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {camera.sourceType} &middot; <span className="text-primary">{t(`camera.status.${camera.status}` as any)}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Detection Settings */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">{t("camera.detectionSettings")}</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm">{t("camera.detectVehicles")}</span>
              <input type="checkbox" checked={detection.detectVehicles} onChange={(e) => setDetection({ ...detection, detectVehicles: e.target.checked })} className="h-4 w-4" />
            </label>
            {detection.detectVehicles && (
              <div className="ml-4 space-y-2 rounded bg-accent/30 p-3">
                <p className="text-xs text-muted-foreground">Loại phương tiện:</p>
                {["car", "truck", "bus", "motorcycle"].map((v) => (
                  <label key={v} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={detection.vehicleTypes.includes(v)}
                      onChange={(e) => setDetection({
                        ...detection,
                        vehicleTypes: e.target.checked
                          ? [...detection.vehicleTypes, v]
                          : detection.vehicleTypes.filter((t: string) => t !== v)
                      })}
                      className="h-4 w-4"
                    />
                    {t(`detection.types.${v}` as any)}
                  </label>
                ))}
              </div>
            )}
            <label className="flex items-center justify-between">
              <span className="text-sm">{t("camera.detectPersons")}</span>
              <input type="checkbox" checked={detection.detectPersons} onChange={(e) => setDetection({ ...detection, detectPersons: e.target.checked })} className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm">{t("camera.detectPlates")}</span>
              <input type="checkbox" checked={detection.detectPlates} onChange={(e) => setDetection({ ...detection, detectPlates: e.target.checked })} className="h-4 w-4" />
            </label>
          </div>
          <button onClick={saveDetection} className="mt-4 w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground">
            {t("common.save")}
          </button>
        </div>

        {/* Location & Info */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">{t("camera.location")}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("camera.latitude")}:</span>
              <span>{camera.latitude || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("camera.longitude")}:</span>
              <span>{camera.longitude || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("camera.sourceType")}:</span>
              <span>{camera.sourceType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("common.createdAt")}:</span>
              <span>{new Date(camera.createdAt).toLocaleString("vi-VN")}</span>
            </div>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-primary">{t("camera.connectionConfig")}</summary>
            <pre className="mt-2 overflow-auto rounded bg-accent/50 p-3 text-xs">
              {JSON.stringify(camera.connectionConfig, null, 2)}
            </pre>
          </details>
        </div>

        {/* ROI Editor */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold">{t("camera.roi")}</h3>
          <RoiEditor
            initialZones={roi}
            onChange={setRoi}
            width={720}
            height={405}
          />
          <button onClick={saveRoi} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            {t("common.save")} ROI
          </button>
        </div>
      </div>
    </div>
  );
}
