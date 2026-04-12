"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Shield, CheckCircle2, XCircle } from "lucide-react";
import api from "@/lib/api";

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Đăng nhập",
  CAMERA_APPROVED: "Duyệt camera",
  CAMERA_REJECTED: "Từ chối camera",
  CAMERA_CREATED: "Tạo camera",
  CAMERA_DELETED: "Xóa camera",
  USER_LOCKED: "Khóa user",
  USER_UNLOCKED: "Mở khóa user",
  CONFIG_UPDATED: "Cập nhật config",
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-blue-500/15 text-blue-500",
  CAMERA_APPROVED: "bg-green-500/15 text-green-500",
  CAMERA_REJECTED: "bg-red-500/15 text-red-500",
  CAMERA_CREATED: "bg-cyan-500/15 text-cyan-500",
  CAMERA_DELETED: "bg-red-500/15 text-red-500",
  USER_LOCKED: "bg-yellow-500/15 text-yellow-500",
  USER_UNLOCKED: "bg-green-500/15 text-green-500",
  CONFIG_UPDATED: "bg-purple-500/15 text-purple-500",
};

export default function AuditLogsPage() {
  const t = useTranslations();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");

  const load = () => {
    setLoading(true);
    const params: any = { page, size };
    if (actionFilter) params.action = actionFilter;
    api.get("/v1/audit-logs", { params })
      .then((res) => {
        setLogs(res.data.data?.items || []);
        setTotal(res.data.data?.totalItems || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, size, actionFilter]);

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Nhật ký hệ thống (Audit Log)</h2>
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          aria-label="Lọc theo loại hành động"
        >
          <option value="">Tất cả hành động</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-accent/50">
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Người dùng</th>
                <th className="px-4 py-3">Hành động</th>
                <th className="px-4 py-3">Đối tượng</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t("common.loading")}</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t("common.noData")}</td></tr>
              ) : logs.map((log: any) => (
                <tr key={log.id} className="border-b border-border/50 hover:bg-accent/30">
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                    {new Date(log.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">{log.username || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[log.action] || "bg-muted"}`}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {log.entityType}
                    {log.entityId && <span className="text-muted-foreground"> / {log.entityId.substring(0, 8)}...</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{log.ipAddress || "-"}</td>
                  <td className="px-4 py-3">
                    {log.success
                      ? <CheckCircle2 className="h-4 w-4 text-green-500" aria-label="Thành công" />
                      : <XCircle className="h-4 w-4 text-red-500" aria-label="Thất bại" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Hiển thị {page * size + 1}–{Math.min((page + 1) * size, total)} / tổng {total.toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <select
                value={size}
                onChange={(e) => { setSize(Number(e.target.value)); setPage(0); }}
                className="rounded border border-border bg-card px-2 py-1 text-xs"
                aria-label="Số dòng mỗi trang"
              >
                {[25, 50, 100, 200].map((n) => <option key={n} value={n}>{n}/trang</option>)}
              </select>
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded border border-border px-3 py-1 disabled:opacity-50"
              >
                ←
              </button>
              <span>Trang {page + 1} / {Math.max(1, Math.ceil(total / size))}</span>
              <button
                disabled={(page + 1) * size >= total}
                onClick={() => setPage((p) => p + 1)}
                className="rounded border border-border px-3 py-1 disabled:opacity-50"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
