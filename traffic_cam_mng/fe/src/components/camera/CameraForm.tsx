"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { cameraFormSchema, CameraFormData } from "@/schemas/camera";
import { cameraService, systemConfigService } from "@/services/cameraService";

interface Props {
  initial?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CameraForm({ initial, onSuccess, onCancel }: Props) {
  const t = useTranslations();
  const [enabledSources, setEnabledSources] = useState<string[]>(["RTSP", "HTTP_MJPEG", "HLS"]);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CameraFormData>({
    resolver: zodResolver(cameraFormSchema) as any,
    defaultValues: initial || {
      name: "",
      sourceType: "RTSP",
      connectionConfig: { port: "554" },
      latitude: "",
      longitude: "",
      detectionSettings: {
        detectVehicles: true,
        vehicleTypes: ["car", "motorcycle"],
        detectPersons: false,
        detectPlates: false,
      },
    },
  });

  const sourceType = form.watch("sourceType");

  useEffect(() => {
    systemConfigService.getEnabledSources()
      .then((res) => setEnabledSources(res.data.data || []))
      .catch(() => {});
  }, []);

  const onSubmit = async (data: CameraFormData) => {
    setSubmitting(true);
    try {
      const payload: any = {
        name: data.name,
        sourceType: data.sourceType,
        connectionConfig: data.connectionConfig,
        detectionSettings: data.detectionSettings,
      };
      if (data.latitude) payload.latitude = parseFloat(data.latitude);
      if (data.longitude) payload.longitude = parseFloat(data.longitude);

      if (initial?.id) {
        await cameraService.update(initial.id, payload);
        toast.success("Đã cập nhật camera");
      } else {
        await cameraService.create(payload);
        toast.success("Đã tạo camera (chờ phê duyệt)");
      }
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  const labelCls = "mb-1 block text-sm text-muted-foreground";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{t("camera.cameraName")} *</label>
          <input {...form.register("name")} className={inputCls} placeholder="VD: Camera đường Điện Biên Phủ" />
          {form.formState.errors.name && <p className="mt-1 text-xs text-red-500">{form.formState.errors.name.message}</p>}
        </div>

        <div>
          <label className={labelCls}>{t("camera.sourceType")} *</label>
          <select {...form.register("sourceType")} className={inputCls}>
            {enabledSources.includes("RTSP") && <option value="RTSP">RTSP</option>}
            {enabledSources.includes("HTTP_MJPEG") && <option value="HTTP_MJPEG">HTTP / MJPEG</option>}
            {enabledSources.includes("HLS") && <option value="HLS">HLS</option>}
            {enabledSources.includes("WEBRTC") && <option value="WEBRTC">WebRTC</option>}
            {enabledSources.includes("USB") && <option value="USB">USB / Local</option>}
          </select>
        </div>
      </div>

      {/* Source-type-specific fields */}
      <div className="rounded-lg border border-border bg-accent/30 p-4">
        <p className="mb-3 text-sm font-medium">{t("camera.connectionConfig")}</p>

        {sourceType === "RTSP" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t("camera.host")} *</label>
              <input {...form.register("connectionConfig.host")} className={inputCls} placeholder="192.168.1.100" />
            </div>
            <div>
              <label className={labelCls}>{t("camera.port")}</label>
              <input {...form.register("connectionConfig.port")} className={inputCls} placeholder="554" defaultValue="554" />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>{t("camera.path")}</label>
              <input {...form.register("connectionConfig.path")} className={inputCls} placeholder="/stream" />
            </div>
            <div>
              <label className={labelCls}>{t("camera.username")}</label>
              <input {...form.register("connectionConfig.username")} className={inputCls} placeholder="admin" />
            </div>
            <div>
              <label className={labelCls}>{t("camera.password")}</label>
              <input type="password" {...form.register("connectionConfig.password")} className={inputCls} />
            </div>
          </div>
        )}

        {sourceType === "HTTP_MJPEG" && (
          <div className="space-y-3">
            <div>
              <label className={labelCls}>{t("camera.url")} *</label>
              <input {...form.register("connectionConfig.url")} className={inputCls} placeholder="http://cam.example.com/mjpg/video.mjpg" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>{t("camera.username")}</label>
                <input {...form.register("connectionConfig.username")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t("camera.password")}</label>
                <input type="password" {...form.register("connectionConfig.password")} className={inputCls} />
              </div>
            </div>
          </div>
        )}

        {sourceType === "HLS" && (
          <div>
            <label className={labelCls}>HLS M3U8 URL *</label>
            <input {...form.register("connectionConfig.url")} className={inputCls} placeholder="https://stream.example.com/live.m3u8" />
          </div>
        )}

        {sourceType === "WEBRTC" && (
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Signaling URL *</label>
              <input {...form.register("connectionConfig.signalingUrl")} className={inputCls} placeholder="wss://signaling.example.com" />
            </div>
            <div>
              <label className={labelCls}>ICE Servers (JSON)</label>
              <textarea {...form.register("connectionConfig.iceServers")} className={inputCls} rows={2} placeholder='[{"urls":"stun:stun.l.google.com:19302"}]' />
            </div>
          </div>
        )}

        {sourceType === "USB" && (
          <div>
            <label className={labelCls}>Device Path *</label>
            <input {...form.register("connectionConfig.device")} className={inputCls} placeholder="/dev/video0 hoặc 0" />
          </div>
        )}
      </div>

      {/* Location */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{t("camera.latitude")}</label>
          <input {...form.register("latitude")} className={inputCls} placeholder="16.0545" />
        </div>
        <div>
          <label className={labelCls}>{t("camera.longitude")}</label>
          <input {...form.register("longitude")} className={inputCls} placeholder="108.2022" />
        </div>
      </div>

      {/* Detection settings */}
      <div className="rounded-lg border border-border bg-accent/30 p-4">
        <p className="mb-3 text-sm font-medium">{t("camera.detectionSettings")}</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("detectionSettings.detectVehicles")} className="h-4 w-4" />
            {t("camera.detectVehicles")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("detectionSettings.detectPersons")} className="h-4 w-4" />
            {t("camera.detectPersons")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("detectionSettings.detectPlates")} className="h-4 w-4" />
            {t("camera.detectPlates")}
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button type="button" onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">
          {t("common.cancel")}
        </button>
        <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {submitting ? t("common.loading") : t("common.save")}
        </button>
      </div>
    </form>
  );
}
