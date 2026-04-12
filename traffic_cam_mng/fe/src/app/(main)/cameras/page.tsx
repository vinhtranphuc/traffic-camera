"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Plus, Play, Square, Trash2, Edit, Settings } from "lucide-react";
import toast from "react-hot-toast";
import { cameraService } from "@/services/cameraService";
import CameraForm from "@/components/camera/CameraForm";

export default function CamerasPage() {
  const t = useTranslations();
  const [cameras, setCameras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const load = () => {
    setLoading(true);
    cameraService.list({ size: 50 })
      .then((res) => setCameras(res.data.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t("camera.deleteConfirm"))) return;
    await cameraService.delete(id);
    toast.success(t("common.success"));
    load();
  };

  const handleEdit = (cam: any) => {
    setEditing({
      id: cam.id,
      name: cam.name,
      sourceType: cam.sourceType,
      connectionConfig: cam.connectionConfig || {},
      latitude: cam.latitude ? String(cam.latitude) : "",
      longitude: cam.longitude ? String(cam.longitude) : "",
      detectionSettings: cam.detectionSettings || { detectVehicles: true, vehicleTypes: ["car"], detectPersons: false, detectPlates: false },
    });
    setFormOpen(true);
  };

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-green-500/15 text-green-500",
    PENDING_APPROVAL: "bg-yellow-500/15 text-yellow-500",
    REJECTED: "bg-red-500/15 text-red-500",
    OFFLINE: "bg-muted-foreground/15 text-muted-foreground",
    STOPPED: "bg-muted-foreground/15 text-muted-foreground",
    ERROR: "bg-red-500/15 text-red-500",
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {cameras.length} {t("camera.title").toLowerCase()}
        </p>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          {t("camera.addCamera")}
        </button>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-card p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold">
              {editing ? t("camera.editCamera") : t("camera.addCamera")}
            </h3>
            <CameraForm
              initial={editing}
              onSuccess={() => { setFormOpen(false); load(); }}
              onCancel={() => setFormOpen(false)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-muted-foreground">{t("common.loading")}</div>
      ) : cameras.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-lg text-muted-foreground">{t("camera.noCameras")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("camera.addHint")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cameras.map((cam: any) => (
            <div key={cam.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">{cam.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {cam.sourceType} &middot; {cam.ownerName || "-"}
                  </p>
                </div>
                <span className={`ml-2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[cam.status] || "bg-muted"}`}>
                  {t(`camera.status.${cam.status}` as any)}
                </span>
              </div>

              {cam.status === "REJECTED" && cam.rejectReason && (
                <p className="mt-2 rounded bg-red-500/10 p-2 text-xs text-red-500">
                  {t("approval.rejectReason")}: {cam.rejectReason}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/cameras/${cam.id}`} className="flex items-center gap-1 rounded bg-accent px-3 py-1.5 text-xs hover:opacity-80">
                  <Settings className="h-3 w-3" /> Chi tiết
                </Link>
                <button onClick={() => handleEdit(cam)} className="flex items-center gap-1 rounded bg-accent px-3 py-1.5 text-xs hover:opacity-80">
                  <Edit className="h-3 w-3" /> {t("common.edit")}
                </button>
                {cam.status === "ACTIVE" && (
                  <button onClick={() => cameraService.stop(cam.id).then(load)} className="flex items-center gap-1 rounded bg-yellow-500/20 px-3 py-1.5 text-xs text-yellow-500">
                    <Square className="h-3 w-3" /> {t("camera.stop")}
                  </button>
                )}
                {cam.status === "STOPPED" && (
                  <button onClick={() => cameraService.start(cam.id).then(load)} className="flex items-center gap-1 rounded bg-green-500/20 px-3 py-1.5 text-xs text-green-500">
                    <Play className="h-3 w-3" /> {t("camera.start")}
                  </button>
                )}
                <button onClick={() => handleDelete(cam.id)} className="flex items-center gap-1 rounded bg-red-500/20 px-3 py-1.5 text-xs text-red-500">
                  <Trash2 className="h-3 w-3" /> {t("common.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
