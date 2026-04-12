"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Video, CheckCircle, Search, AlertCircle } from "lucide-react";
import { dashboardService } from "@/services/cameraService";
import CameraMap from "@/components/dashboard/CameraMap";
import { DetectionTrendChart, TopObjectsChart } from "@/components/dashboard/DetectionChart";

export default function DashboardPage() {
  const t = useTranslations();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getSummary()
      .then((res) => setSummary(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: t("dashboard.totalCameras"), value: summary?.totalCameras ?? 0, icon: Video, color: "text-blue-500" },
    { label: t("dashboard.activeCameras"), value: summary?.activeCameras ?? 0, icon: CheckCircle, color: "text-green-500" },
    { label: t("dashboard.todayDetections"), value: summary?.todayDetections ?? 0, icon: Search, color: "text-cyan-500" },
    { label: t("dashboard.pendingApprovals"), value: summary?.cameraStatus?.PENDING_APPROVAL ?? 0, icon: AlertCircle, color: "text-yellow-500" },
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
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="mt-2 text-3xl font-bold">
                {loading ? "..." : Number(card.value).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-medium">{t("dashboard.cameraMap")}</h3>
          <div className="h-80">
            <CameraMap />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-medium">{t("dashboard.cameraStatus")}</h3>
          {summary?.cameraStatus ? (
            <div className="space-y-3">
              {Object.entries(summary.cameraStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t(`camera.status.${status}` as any)}
                  </span>
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
          <div className="h-64">
            <DetectionTrendChart />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-medium">{t("dashboard.topObjectTypes")}</h3>
          <div className="h-64">
            <TopObjectsChart />
          </div>
        </div>
      </div>
    </div>
  );
}
