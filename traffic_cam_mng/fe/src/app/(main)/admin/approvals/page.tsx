"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X, Clock, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { approvalService } from "@/services/cameraService";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Modal from "@/components/shared/Modal";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatRelativeTime } from "@/lib/utils";

export default function ApprovalsPage() {
  const t = useTranslations();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveTarget, setApproveTarget] = useState<any>(null);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = () => {
    setLoading(true);
    approvalService.list({ status: "PENDING", size: 100 })
      .then((res) => setApprovals(res.data.data?.items || []))
      .catch(() => toast.error(t("common.error")))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      await approvalService.approve(approveTarget.id);
      toast.success(`Đã duyệt camera "${approveTarget.cameraName}"`);
      setApproveTarget(null);
      load();
    } catch { toast.error(t("common.error")); }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await approvalService.reject(rejectTarget.id, rejectReason);
      toast.success(`Đã từ chối camera "${rejectTarget.cameraName}"`);
      setRejectTarget(null);
      setRejectReason("");
      load();
    } catch { toast.error(t("common.error")); }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">{t("approval.title")}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {loading ? "Đang tải..." : `${approvals.length} yêu cầu đang chờ phê duyệt`}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : approvals.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={t("approval.noApprovals")}
          description="Tất cả yêu cầu đã được xử lý. Khi có camera mới được tạo, chúng sẽ xuất hiện ở đây."
        />
      ) : (
        <div className="space-y-3">
          {approvals.map((a: any) => (
            <div key={a.id} className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5 transition hover:border-yellow-500/50">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" aria-hidden="true" />
                    <h3 className="text-sm font-semibold">{a.cameraName || "Camera"}</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("approval.requestedBy")}: <span className="font-medium text-foreground">{a.requestedByName}</span>
                    {" "}&middot;{" "}
                    {formatRelativeTime(a.createdAt)}
                  </p>
                  {a.snapshotConfig && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                        Cấu hình kết nối
                      </summary>
                      <pre className="mt-2 overflow-auto rounded bg-accent/50 p-3 text-xs font-mono">
                        {JSON.stringify(a.snapshotConfig, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="success" onClick={() => setApproveTarget(a)} leftIcon={<Check className="h-4 w-4" />}>
                    {t("approval.approve")}
                  </Button>
                  <Button variant="danger" onClick={() => setRejectTarget(a)} leftIcon={<X className="h-4 w-4" />}>
                    {t("approval.reject")}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!approveTarget}
        title="Phê duyệt camera"
        message={`Phê duyệt camera "${approveTarget?.cameraName}"? Sau khi duyệt, camera sẽ được kích hoạt ngay và người dùng sẽ nhận được thông báo.`}
        confirmText={t("approval.approve")}
        variant="primary"
        onConfirm={handleApprove}
        onCancel={() => setApproveTarget(null)}
      />

      <Modal
        open={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectReason(""); }}
        title={`Từ chối camera ${rejectTarget?.cameraName || ""}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cho người dùng biết lý do từ chối để họ có thể chỉnh sửa và gửi lại yêu cầu.
          </p>
          <div>
            <label htmlFor="reject-reason" className="mb-1 block text-sm font-medium">
              Lý do từ chối <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              rows={4}
              placeholder="VD: URL RTSP không hợp lệ, thông tin xác thực không chính xác..."
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={handleReject} disabled={!rejectReason.trim()}>
              Từ chối
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
