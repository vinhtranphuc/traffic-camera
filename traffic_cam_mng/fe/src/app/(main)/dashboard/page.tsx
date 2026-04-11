"use client";

import { useEffect, useState } from "react";
import { dashboardService } from "@/services/cameraService";

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getSummary()
      .then((res) => setSummary(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total Cameras", value: summary?.totalCameras ?? 0, color: "blue" },
    { label: "Active Cameras", value: summary?.activeCameras ?? 0, color: "green" },
    { label: "Today Detections", value: summary?.todayDetections ?? 0, color: "cyan" },
    { label: "Pending Approvals", value: summary?.cameraStatus?.PENDING_APPROVAL ?? 0, color: "yellow" },
  ];

  return (
    <div className="p-6">
      <h2 className="mb-6 text-xl font-semibold text-white">Dashboard</h2>

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {loading ? "..." : card.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-4 text-sm font-medium text-gray-300">Camera Map</h3>
          <div className="flex h-72 items-center justify-center rounded-lg bg-gray-800/50 text-gray-600">
            Leaflet map integration pending
          </div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h3 className="mb-4 text-sm font-medium text-gray-300">Camera Status</h3>
          {summary?.cameraStatus ? (
            <div className="space-y-3">
              {Object.entries(summary.cameraStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{status.replace("_", " ")}</span>
                  <span className="text-sm font-medium text-white">{String(count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No cameras yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
