"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Video, CheckCircle, Search, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { dashboardService } from "@/services/cameraService";
import api from "@/lib/api";
import CameraMap from "@/components/dashboard/CameraMap";
import { DetectionTrendChart, TopObjectsChart } from "@/components/dashboard/DetectionChart";

interface Trend {
  value: number;
  change?: number;
}

function TrendIndicator({ change }: { change?: number }) {
  if (change === undefined) return null;
  const abs = Math.abs(change);
  const isUp = change > 0;
  const isDown = change < 0;
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const color = isUp ? "text-green-500" : isDown ? "text-red-500" : "text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {abs}%
    </span>
  );
}

export default function DashboardPage() {
  const t = useTranslations();
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardService.getSummary(),
      api.get("/v1/dashboard/trends"),
    ])
      .then(([sumRes, trendRes]) => {
        setSummary(sumRes.data.data);
        setTrends(trendRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: t("dashboard.totalCameras"),
      value: summary?.totalCameras ?? 0,
      icon: Video, color: "text-blue-500",
      sub: `${summary?.activeCameras ?? 0} đang hoạt động`,
    },
    {
      label: t("dashboard.activeCameras"),
      value: summary?.activeCameras ?? 0,
      icon: CheckCircle, color: "text-green-500",
    },
    {
      label: t("dashboard.todayDetections"),
      value: trends?.today ?? summary?.todayDetections ?? 0,
      icon: Search, color: "text-cyan-500",
      change: trends?.todayChange,
      sub: trends ? `Hôm qua: ${trends.yesterday?.toLocaleString() ?? 0}` : undefined,
    },
    {
      label: t("dashboard.pendingApprovals"),
      value: summary?.cameraStatus?.PENDING_APPROVAL ?? 0,
      icon: AlertCircle, color: "text-yellow-500",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <Icon className={`h-5 w-5 ${card.color}`} aria-hidden="true" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-3xl font-bold">
                  {loading ? "..." : Number(card.value).toLocaleString()}
                </p>
                {!loading && <TrendIndicator change={(card as any).change} />}
              </div>
              {card.sub && <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>}
            </div>
          );
        })}
      </div>

      {trends?.weekChange !== undefined && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Nhận diện 7 ngày qua</p>
              <p className="mt-1 text-2xl font-bold">{Number(trends.thisWeek ?? 0).toLocaleString()}</p>
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
          <h3 className="mb-4 text-sm font-medium">{t("dashboard.cameraMap")}</h3>
          <div className="h-80"><CameraMap /></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-medium">{t("dashboard.cameraStatus")}</h3>
          {summary?.cameraStatus ? (
            <div className="space-y-3">
              {Object.entries(summary.cameraStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t(`camera.status.${status}` as any)}</span>
                  <span className="text-sm font-medium">{String(count)}</span>
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
          <h3 className="mb-4 text-sm font-medium">
            {t("dashboard.detectionTrend")} ({t("dashboard.last7Days")})
          </h3>
          <div className="h-64"><DetectionTrendChart /></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-medium">{t("dashboard.topObjectTypes")}</h3>
          <div className="h-64"><TopObjectsChart /></div>
        </div>
      </div>
    </div>
  );
}
