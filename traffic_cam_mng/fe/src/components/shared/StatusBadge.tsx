"use client";

import { useTranslations } from "next-intl";
import { CheckCircle, Clock, XCircle, PowerOff, AlertTriangle, Square } from "lucide-react";

export type CameraStatus =
  | "ACTIVE"
  | "PENDING_APPROVAL"
  | "REJECTED"
  | "OFFLINE"
  | "STOPPED"
  | "ERROR";

interface StatusMeta {
  color: string;
  bgClass: string;
  textClass: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
}

export const STATUS_META: Record<CameraStatus, StatusMeta> = {
  ACTIVE: {
    color: "#10b981",
    bgClass: "bg-green-500/15",
    textClass: "text-green-500",
    icon: CheckCircle,
  },
  PENDING_APPROVAL: {
    color: "#f59e0b",
    bgClass: "bg-yellow-500/15",
    textClass: "text-yellow-500",
    icon: Clock,
  },
  REJECTED: {
    color: "#ef4444",
    bgClass: "bg-red-500/15",
    textClass: "text-red-500",
    icon: XCircle,
  },
  OFFLINE: {
    color: "#6b7280",
    bgClass: "bg-gray-500/15",
    textClass: "text-gray-500",
    icon: PowerOff,
  },
  STOPPED: {
    color: "#6b7280",
    bgClass: "bg-gray-500/15",
    textClass: "text-gray-500",
    icon: Square,
  },
  ERROR: {
    color: "#ef4444",
    bgClass: "bg-red-500/15",
    textClass: "text-red-500",
    icon: AlertTriangle,
  },
};

interface Props {
  status: string;
  showIcon?: boolean;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, showIcon = true, size = "sm" }: Props) {
  const t = useTranslations();
  const meta = STATUS_META[status as CameraStatus] || STATUS_META.OFFLINE;
  const Icon = meta.icon;
  const sizeCls = size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs";

  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full font-medium ${meta.bgClass} ${meta.textClass} ${sizeCls}`}>
      {showIcon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {t(`camera.status.${status}` as any, { defaultMessage: status } as any)}
    </span>
  );
}
