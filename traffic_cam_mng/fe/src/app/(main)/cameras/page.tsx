"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Plus, Play, Square, Trash2, Edit, Settings, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { cameraService } from "@/services/cameraService";
import CameraForm from "@/components/camera/CameraForm";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Modal from "@/components/shared/Modal";

const STATUSES = ["", "ACTIVE", "PENDING_APPROVAL", "REJECTED", "OFFLINE", "STOPPED", "ERROR"];

export default function CamerasPage() {
  const t = useTranslations();
  const [cameras, setCameras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const load = () => {
    setLoading(true);
    cameraService.list({ size: 100 })
      .then((res) => setCameras(res.data.data?.items || []))
      .catch(() => toast.error(t("common.error")))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return cameras.filter((c: any) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (sourceFilter && c.sourceType !== sourceFilter) return false;
      return true;
    });
  }, [cameras, search, statusFilter, sourceFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await cameraService.delete(deleteTarget.id);
      toast.success(`Đã xóa "${deleteTarget.name}"`);
      setDeleteTarget(null);
      load();
    } catch { toast.error(t("common.error")); }
  };

  const handleEdit = (cam: any) => {
    setEditing({
      id: cam.id, name: cam.name, sourceType: cam.sourceType,
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {filtered.length}/{cameras.length} {t("camera.title").toLowerCase()}
        </p>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("camera.addCamera")}
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${t("common.search")} ${t("camera.cameraName").toLowerCase()}...`}
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm"
            aria-label="Tìm kiếm camera"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          aria-label="Lọc theo trạng thái"
        >
          <option value="">Tất cả trạng thái</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{t(`camera.status.${s}` as any)}</option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          aria-label="Lọc theo loại nguồn"
        >
          <option value="">Tất cả loại</option>
          <option value="RTSP">RTSP</option>
          <option value="HLS">HLS</option>
          <option value="HTTP_MJPEG">HTTP/MJPEG</option>
          <option value="WEBRTC">WebRTC</option>
          <option value="USB">USB</option>
        </select>
        {(search || statusFilter || sourceFilter) && (
          <button
            onClick={() => { setSearch(""); setStatusFilter(""); setSourceFilter(""); }}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? t("camera.editCamera") : t("camera.addCamera")}
        size="lg"
      >
        <CameraForm
          initial={editing}
          onSuccess={() => { setFormOpen(false); load(); }}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa camera"
        message={`Bạn có chắc muốn xóa camera "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5">
              <div className="h-4 w-2/3 rounded bg-accent" />
              <div className="mt-2 h-3 w-1/2 rounded bg-accent" />
              <div className="mt-6 h-8 w-full rounded bg-accent" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Filter className="mx-auto h-12 w-12 text-muted-foreground opacity-30" aria-hidden="true" />
          {cameras.length === 0 ? (
            <>
              <p className="mt-3 text-lg text-muted-foreground">{t("camera.noCameras")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("camera.addHint")}</p>
              <button
                onClick={() => { setEditing(null); setFormOpen(true); }}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                {t("camera.addCamera")}
              </button>
            </>
          ) : (
            <>
              <p className="mt-3 text-muted-foreground">Không có camera nào khớp với bộ lọc</p>
              <button
                onClick={() => { setSearch(""); setStatusFilter(""); setSourceFilter(""); }}
                className="mt-4 text-sm text-primary hover:underline"
              >
                Xóa bộ lọc
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cam: any) => (
            <div key={cam.id} className="rounded-xl border border-border bg-card p-5 transition hover:shadow-md">
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
                <Link
                  href={`/cameras/${cam.id}`}
                  className="flex items-center gap-1 rounded bg-accent px-3 py-1.5 text-xs hover:opacity-80"
                  aria-label={`Chi tiết camera ${cam.name}`}
                >
                  <Settings className="h-3 w-3" aria-hidden="true" /> Chi tiết
                </Link>
                <button
                  onClick={() => handleEdit(cam)}
                  className="flex items-center gap-1 rounded bg-accent px-3 py-1.5 text-xs hover:opacity-80"
                  aria-label={`Sửa camera ${cam.name}`}
                >
                  <Edit className="h-3 w-3" aria-hidden="true" /> {t("common.edit")}
                </button>
                {cam.status === "ACTIVE" && (
                  <button
                    onClick={() => cameraService.stop(cam.id).then(() => { toast.success(`Đã dừng ${cam.name}`); load(); })}
                    className="flex items-center gap-1 rounded bg-yellow-500/20 px-3 py-1.5 text-xs text-yellow-500"
                    aria-label={`Dừng camera ${cam.name}`}
                  >
                    <Square className="h-3 w-3" aria-hidden="true" /> {t("camera.stop")}
                  </button>
                )}
                {cam.status === "STOPPED" && (
                  <button
                    onClick={() => cameraService.start(cam.id).then(() => { toast.success(`Đã khởi động ${cam.name}`); load(); })}
                    className="flex items-center gap-1 rounded bg-green-500/20 px-3 py-1.5 text-xs text-green-500"
                    aria-label={`Khởi động camera ${cam.name}`}
                  >
                    <Play className="h-3 w-3" aria-hidden="true" /> {t("camera.start")}
                  </button>
                )}
                <button
                  onClick={() => setDeleteTarget(cam)}
                  className="flex items-center gap-1 rounded bg-red-500/20 px-3 py-1.5 text-xs text-red-500"
                  aria-label={`Xóa camera ${cam.name}`}
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" /> {t("common.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
