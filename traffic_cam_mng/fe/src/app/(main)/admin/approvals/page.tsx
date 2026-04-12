"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { approvalService } from "@/services/cameraService";

export default function ApprovalsPage() {
  const t = useTranslations();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    approvalService.list({ status: "PENDING", size: 50 })
      .then((res) => setApprovals(res.data.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    await approvalService.approve(id);
    toast.success(t("approval.approved"));
    load();
  };

  const handleReject = async (id: string) => {
    const reason = prompt(t("approval.rejectPrompt"));
    if (reason === null) return;
    await approvalService.reject(id, reason);
    toast.success(t("approval.rejected"));
    load();
  };

  return (
    <div className="p-6">
      {loading ? (
        <p className="text-center text-muted-foreground">{t("common.loading")}</p>
      ) : approvals.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">{t("approval.noApprovals")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((a: any) => (
            <div key={a.id} className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium">{a.cameraName || "Camera"}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("approval.requestedBy")}: {a.requestedByName} &middot; {new Date(a.createdAt).toLocaleString("vi-VN")}
                  </p>
                  {a.snapshotConfig && (
                    <div className="mt-2 rounded bg-accent/50 p-2 text-xs">
                      <code>{JSON.stringify(a.snapshotConfig, null, 2).substring(0, 200)}...</code>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex gap-2">
                  <button onClick={() => handleApprove(a.id)} className="flex items-center gap-1 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600">
                    <Check className="h-4 w-4" />
                    {t("approval.approve")}
                  </button>
                  <button onClick={() => handleReject(a.id)} className="flex items-center gap-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">
                    <X className="h-4 w-4" />
                    {t("approval.reject")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
