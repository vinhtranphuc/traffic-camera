"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "@/components/notification/NotificationBell";

interface Props {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: Props) {
  const t = useTranslations();
  const pathname = usePathname();

  const pageTitle = (() => {
    if (pathname.startsWith("/dashboard")) return t("dashboard.title");
    if (pathname.startsWith("/cameras")) return t("camera.title");
    if (pathname.startsWith("/live-view")) return t("liveView.title");
    if (pathname.startsWith("/detections")) return t("detection.title");
    if (pathname.startsWith("/notifications")) return t("notification.title");
    if (pathname.startsWith("/admin/approvals")) return t("approval.title");
    if (pathname.startsWith("/admin/customers")) return t("user.title");
    if (pathname.startsWith("/system/config")) return t("system.title");
    if (pathname.startsWith("/settings")) return t("settings.title");
    return "";
  })();

  return (
    <header className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground lg:hidden"
          aria-label="Mở menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-semibold">{pageTitle}</h2>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationBell />
      </div>
    </header>
  );
}
