"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useTranslations } from "next-intl";
import { dashboardService } from "@/services/cameraService";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function DetectionTrendChart() {
  const t = useTranslations();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    dashboardService.getDetectionTrend(7).then((res) => {
      const byDate = res.data.data?.byDate || [];
      setData(byDate.map((d: any) => ({ date: d.date, count: Number(d.count) })));
    }).catch(() => {});
  }, []);

  return (
    <div className="h-full w-full">
      {data.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          {t("common.noData")}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
            <XAxis dataKey="date" stroke="rgb(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="rgb(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgb(var(--card))",
                border: "1px solid rgb(var(--border))",
                borderRadius: "0.5rem",
              }}
            />
            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function TopObjectsChart() {
  const t = useTranslations();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    dashboardService.getDetectionTrend(7).then((res) => {
      const byType = res.data.data?.byType || {};
      setData(Object.entries(byType).map(([name, value]) => ({ name, value: Number(value) })));
    }).catch(() => {});
  }, []);

  return (
    <div className="h-full w-full">
      {data.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          {t("common.noData")}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={(d: any) => d.name}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgb(var(--card))",
                border: "1px solid rgb(var(--border))",
                borderRadius: "0.5rem",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
