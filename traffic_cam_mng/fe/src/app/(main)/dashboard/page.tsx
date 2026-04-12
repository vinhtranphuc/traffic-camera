"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Video, CheckCircle, Search, AlertCircle, TrendingUp, TrendingDown, Minus,
  Plus, UserCheck, Clock,
} from "lucide-react";
import { dashboardService } from "@/services/cameraService";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import CameraMap from "@/components/dashboard/CameraMap";
import { DetectionTrendChart, TopObjectsChart } from "@/components/dashboard/DetectionChart";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

function TrendIndicator({ change }: { change?: number }) {
  if (change === undefined || change === null) return null;
  const abs = Math.abs(change);
  const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  const color = change > 0 ? "text-green-500" : change < 0 ? "text-red-500" : "text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {abs}%
    </span>
  );
}

export default function DashboardPage() {
  const t = useTranslations();
  const role = useAuthStore((s) => s.user?.role);
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sumRes, trendRes] = await Promise.all([
        dashboardService.getSummary(),
        api.get("/v1/dashboard/trends"),
      ]);
      setSummary(sumRes.data.data);
      setTrends(trendRes.data.data);
      setLastUpdated(new Date());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const pendingCount = summary?.cameraStatus?.PENDING_APPROVAL ?? 0;
  const offlineCount = summary?.cameraStatus?.OFFLINE ?? 0;
  const isAdmin = role && ["ADMIN", "SUPER_ADMIN", "SYSTEM_ADMIN"].includes(role);

  const cards = [
    {
      label: t("dashboard.totalCameras"),
      value: summary?.totalCameras ?? 0,
      icon: Video, iconColor: "text-blue-500", iconBg: "bg-blue-500/15",
      sub: `${summary?.activeCameras ?? 0} đang hoạt động`,
    },
    {
      label: t("dashboard.activeCameras"),
      value: summary?.activeCameras ?? 0,
      icon: CheckCircle, iconColor: "text-green-500", iconBg: "bg-green-500/15",
    },
    {
      label: t("dashboard.todayDetections"),
      value: trends?.today ?? summary?.todayDetections ?? 0,
      icon: Search, iconColor: "text-cyan-500", iconBg: "bg-cyan-500/15",
      change: trends?.todayChange,
      sub: trends && trends.yesterday !== undefined ? `Hôm qua: ${Number(trends.yesterday).toLocaleString()}` : undefined,
    },
    {
      label: t("dashboard.pendingApprovals"),
      value: pendingCount,
      icon: AlertCircle, iconColor: "text-yellow-500", iconBg: "bg-yellow-500/15",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {lastUpdated ? `Cập nhật lúc ${lastUpdated.toLocaleTimeString("vi-VN")}` : "Đang tải..."}
        </p>
        <Button variant="outline" size="sm" onClick={loadAll} loading={loading}>
          Làm mới
        </Button>
      </div>

      {(pendingCount > 0 || offlineCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {pendingCount > 0 && isAdmin && (
            <Link
              href="/admin/approvals"
              className="flex flex-1 min-w-[280px] items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 transition hover:bg-yellow-500/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-500" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{pendingCount} camera chờ phê duyệt</p>
                <p className="text-xs text-muted-foreground">Click để xem và xử lý</p>
              </div>
            </Link>
          )}
          {offlineCount > 0 && (
            <Link
              href="/cameras"
              className="flex flex-1 min-w-[280px] items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4 transition hover:bg-red-500/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{offlineCount} camera ngoại tuyến</p>
                <p className="text-xs text-muted-foreground">Cần kiểm tra kết nối</p>
              </div>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-border bg-card p-5 transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${card.iconBg}`}>
                  <Icon className={`h-4 w-4 ${card.iconColor}`} aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                {loading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <p className="text-3xl font-bold tabular-nums">{Number(card.value).toLocaleString()}</p>
                    <TrendIndicator change={(card as any).change} />
                  </>
                )}
              </div>
              {card.sub && <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>}
            </div>
          );
        })}
      </div>

      {trends?.weekChange !== undefined && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Nhận diện 7 ngày qua</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{Number(trends.thisWeek ?? 0).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">So với tuần trước ({Number(trends.lastWeek ?? 0).toLocaleString()})</p>
              <div className="mt-1"><TrendIndicator change={trends.weekChange} /></div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t("dashboard.cameraMap")}</h3>
            <Link href="/cameras" className="text-xs text-primary hover:underline">Xem tất cả →</Link>
          </div>
          <div className="h-80"><CameraMap /></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">{t("dashboard.cameraStatus")}</h3>
          {summary?.cameraStatus ? (
            <div className="space-y-3">
              {Object.entries(summary.cameraStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t(`camera.status.${status}` as any)}</span>
                  <span className="text-sm font-medium tabular-nums">{String(count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("common.noData")}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">
            {t("dashboard.detectionTrend")} ({t("dashboard.last7Days")})
          </h3>
          <div className="h-64"><DetectionTrendChart /></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">{t("dashboard.topObjectTypes")}</h3>
          <div className="h-64"><TopObjectsChart /></div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold">Hành động nhanh</h3>
        <div className="flex flex-wrap gap-2">
          <Link href="/cameras"><Button variant="outline" leftIcon={<Plus className="h-4 w-4" />}>Thêm camera</Button></Link>
          <Link href="/live-view"><Button variant="outline" leftIcon={<Video className="h-4 w-4" />}>Xem trực tiếp</Button></Link>
          <Link href="/detections"><Button variant="outline" leftIcon={<Search className="h-4 w-4" />}>Lịch sử nhận diện</Button></Link>
          {isAdmin && (
            <Link href="/admin/approvals"><Button variant="outline" leftIcon={<UserCheck className="h-4 w-4" />}>Phê duyệt</Button></Link>
          )}
        </div>
      </div>
    </div>
  );
}
