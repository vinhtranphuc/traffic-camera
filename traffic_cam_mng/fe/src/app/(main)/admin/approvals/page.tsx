"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { approvalService } from "@/services/cameraService";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Modal from "@/components/shared/Modal";

export default function ApprovalsPage() {
  const t = useTranslations();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveTarget, setApproveTarget] = useState<any>(null);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = () => {
    setLoading(true);
    approvalService.list({ status: "PENDING", size: 50 })
      .then((res) => setApprovals(res.data.data?.items || []))
      .catch(() => toast.error(t("common.error")))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      await approvalService.approve(approveTarget.id);
      toast.success(t("approval.approved"));
      setApproveTarget(null);
      load();
    } catch { toast.error(t("common.error")); }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await approvalService.reject(rejectTarget.id, rejectReason);
      toast.success(t("approval.rejected"));
      setRejectTarget(null);
      setRejectReason("");
      load();
    } catch { toast.error(t("common.error")); }
  };

  return (
    <div className="p-6">
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4">
              <div className="h-4 w-1/3 rounded bg-accent" />
              <div className="mt-2 h-3 w-1/2 rounded bg-accent" />
            </div>
          ))}
        </div>
      ) : approvals.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground opacity-30" aria-hidden="true" />
          <p className="mt-3 text-muted-foreground">{t("approval.noApprovals")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((a: any) => (
            <div key={a.id} className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium">{a.cameraName || "Camera"}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("approval.requestedBy")}: <span className="font-medium">{a.requestedByName}</span> &middot; {new Date(a.createdAt).toLocaleString("vi-VN")}
                  </p>
                  {a.snapshotConfig && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                        Cấu hình kết nối
                      </summary>
                      <pre className="mt-1 overflow-auto rounded bg-accent/50 p-2 text-xs">
                        {JSON.stringify(a.snapshotConfig, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setApproveTarget(a)}
                    className="flex items-center gap-1 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
                    aria-label={`Duyệt camera ${a.cameraName}`}
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {t("approval.approve")}
                  </button>
                  <button
                    onClick={() => setRejectTarget(a)}
                    className="flex items-center gap-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
                    aria-label={`Từ chối camera ${a.cameraName}`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    {t("approval.reject")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!approveTarget}
        title="Duyệt camera"
        message={`Duyệt camera "${approveTarget?.cameraName}"? Sau khi duyệt, camera sẽ được kích hoạt ngay.`}
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
          <div>
            <label htmlFor="reject-reason" className="mb-1 block text-sm text-muted-foreground">
              {t("approval.reason")}
            </label>
            <textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              rows={4}
              placeholder="VD: URL không hợp lệ, thông tin không chính xác..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setRejectTarget(null); setRejectReason(""); }}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleReject}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
            >
              {t("approval.reject")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
