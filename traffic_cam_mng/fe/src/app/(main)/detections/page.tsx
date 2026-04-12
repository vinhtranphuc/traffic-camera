"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Search } from "lucide-react";
import { detectionService } from "@/services/cameraService";
import api from "@/lib/api";
import Pagination from "@/components/shared/Pagination";

const OBJECT_TYPES = ["", "car", "truck", "bus", "motorcycle", "person", "bicycle"];

export default function DetectionsPage() {
  const t = useTranslations();
  const [detections, setDetections] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(25);

  const [filters, setFilters] = useState({
    plateText: "",
    objectType: "",
    from: "",
    to: "",
  });

  const load = () => {
    setLoading(true);
    const params: any = { size, page };
    if (filters.plateText) params.plateText = filters.plateText;
    if (filters.objectType) params.objectType = filters.objectType;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;

    detectionService.search(params)
      .then((res) => {
        setDetections(res.data.data?.items || []);
        setTotal(res.data.data?.totalItems || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, size]);

  const handleSearch = () => { setPage(0); load(); };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filters.plateText) params.set("plateText", filters.plateText);
    if (filters.objectType) params.set("objectType", filters.objectType);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);

    const res = await api.get(`/v1/detections/export?${params}`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `detections-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm";

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <input
            value={filters.plateText}
            onChange={(e) => setFilters({ ...filters, plateText: e.target.value })}
            placeholder={t("detection.plateSearch")}
            className={inputCls}
          />
          <select
            value={filters.objectType}
            onChange={(e) => setFilters({ ...filters, objectType: e.target.value })}
            className={inputCls}
          >
            <option value="">{t("detection.filterByType")}</option>
            {OBJECT_TYPES.filter(Boolean).map((v) => (
              <option key={v} value={v}>{t(`detection.types.${v}` as any)}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className={inputCls}
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            className={inputCls}
          />
          <div className="flex gap-2">
            <button onClick={handleSearch} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
              <Search className="h-4 w-4" />
              {t("common.search")}
            </button>
            <button onClick={handleExport} className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-accent">
              <Download className="h-4 w-4" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-accent/50">
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3">{t("detection.time")}</th>
                <th className="px-4 py-3">{t("detection.camera")}</th>
                <th className="px-4 py-3">{t("detection.objectType")}</th>
                <th className="px-4 py-3">{t("detection.confidence")}</th>
                <th className="px-4 py-3">{t("detection.plate")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t("common.loading")}</td></tr>
              ) : detections.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t("common.noData")}</td></tr>
              ) : (
                detections.map((d: any) => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(d.timestamp).toLocaleString("vi-VN")}</td>
                    <td className="px-4 py-3">{d.cameraName || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-500">
                        {t(`detection.types.${d.objectType}` as any, { defaultMessage: d.objectType } as any)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{(Number(d.confidence) * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3">
                      {d.plateText
                        ? <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs font-mono text-cyan-500">{d.plateText}</span>
                        : <span className="text-muted-foreground">-</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          size={size}
          total={total}
          onPageChange={setPage}
          onSizeChange={(s) => { setSize(s); setPage(0); }}
        />
      </div>
    </div>
  );
}
