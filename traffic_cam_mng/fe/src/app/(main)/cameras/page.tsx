"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Plus, Play, Square, Trash2, Edit, Settings, Video } from "lucide-react";
import toast from "react-hot-toast";
import { cameraService } from "@/services/cameraService";
import CameraForm from "@/components/camera/CameraForm";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Modal from "@/components/shared/Modal";
import StatusBadge from "@/components/shared/StatusBadge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import SearchInput from "@/components/ui/SearchInput";
import { SkeletonCard } from "@/components/ui/Skeleton";

const STATUSES = ["ACTIVE", "PENDING_APPROVAL", "REJECTED", "OFFLINE", "STOPPED", "ERROR"];

export default function CamerasPage() {
  const t = useTranslations();
  const [cameras, setCameras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteStats, setDeleteStats] = useState<number | null>(null);
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

  const filtered = useMemo(() => cameras.filter((c: any) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (sourceFilter && c.sourceType !== sourceFilter) return false;
    return true;
  }), [cameras, search, statusFilter, sourceFilter]);

  const hasFilters = search || statusFilter || sourceFilter;

  const promptDelete = async (cam: any) => {
    setDeleteTarget(cam);
    setDeleteStats(null);
    try {
      const res = await cameraService.getStats(cam.id);
      setDeleteStats(res.data.data?.detectionCount ?? 0);
    } catch { setDeleteStats(0); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await cameraService.delete(deleteTarget.id);
      toast.success(`Đã xóa "${deleteTarget.name}"`);
      setDeleteTarget(null);
      setDeleteStats(null);
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

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Đang hiển thị <strong className="text-foreground">{filtered.length}</strong> trên tổng <strong className="text-foreground">{cameras.length}</strong> camera
        </p>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>
          {t("camera.addCamera")}
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput className="min-w-[200px] flex-1 max-w-xs" onSearch={setSearch} placeholder="Tìm theo tên camera..." />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          aria-label="Lọc theo trạng thái"
        >
          <option value="">Tất cả trạng thái</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t(`camera.status.${s}` as any)}</option>)}
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
        {hasFilters && (
          <Button variant="ghost" onClick={() => { setSearch(""); setStatusFilter(""); setSourceFilter(""); }}>
            Xóa bộ lọc
          </Button>
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
        message={
          deleteTarget
            ? `Xóa camera "${deleteTarget.name}"?${
                deleteStats === null ? " Đang tải thông tin..." :
                deleteStats > 0 ? ` Sẽ xóa luôn ${deleteStats.toLocaleString()} bản ghi nhận diện.` :
                ""
              } Không thể hoàn tác.`
            : ""
        }
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteStats(null); }}
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        cameras.length === 0 ? (
          <EmptyState
            icon={Video}
            title={t("camera.noCameras")}
            description="Bắt đầu bằng cách thêm camera đầu tiên. Camera sẽ cần được Admin phê duyệt trước khi hoạt động."
            action={
              <Button onClick={() => { setEditing(null); setFormOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>
                {t("camera.addCamera")}
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Video}
            title="Không tìm thấy camera nào"
            description="Thử điều chỉnh bộ lọc hoặc xóa từ khóa tìm kiếm."
            action={
              <Button variant="outline" onClick={() => { setSearch(""); setStatusFilter(""); setSourceFilter(""); }}>
                Xóa bộ lọc
              </Button>
            }
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cam: any) => (
            <div
              key={cam.id}
              className="group rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">{cam.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {cam.sourceType} &middot; {cam.ownerName || "-"}
                  </p>
                </div>
                <StatusBadge status={cam.status} />
              </div>

              {cam.status === "REJECTED" && cam.rejectReason && (
                <p className="mt-2 rounded bg-red-500/10 p-2 text-xs text-red-500">
                  {t("approval.rejectReason")}: {cam.rejectReason}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-1.5">
                <Link
                  href={`/cameras/${cam.id}`}
                  className="inline-flex h-8 items-center gap-1 rounded bg-accent px-3 text-xs transition hover:opacity-80 active:scale-95"
                  aria-label={`Chi tiết camera ${cam.name}`}
                >
                  <Settings className="h-3 w-3" aria-hidden="true" /> Chi tiết
                </Link>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(cam)} leftIcon={<Edit className="h-3 w-3" />}>
                  {t("common.edit")}
                </Button>
                {cam.status === "ACTIVE" && (
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => cameraService.stop(cam.id).then(() => { toast.success(`Đã dừng ${cam.name}`); load(); })}
                    leftIcon={<Square className="h-3 w-3" />}
                    className="bg-yellow-500/15 text-yellow-600 hover:bg-yellow-500/25 dark:text-yellow-400"
                  >
                    {t("camera.stop")}
                  </Button>
                )}
                {cam.status === "STOPPED" && (
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => cameraService.start(cam.id).then(() => { toast.success(`Đã khởi động ${cam.name}`); load(); })}
                    leftIcon={<Play className="h-3 w-3" />}
                    className="bg-green-500/15 text-green-600 hover:bg-green-500/25 dark:text-green-400"
                  >
                    {t("camera.start")}
                  </Button>
                )}
                <Button
                  variant="ghost" size="sm"
                  onClick={() => promptDelete(cam)}
                  leftIcon={<Trash2 className="h-3 w-3" />}
                  className="ml-auto bg-red-500/15 text-red-600 hover:bg-red-500/25 dark:text-red-400"
                >
                  {t("common.delete")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
