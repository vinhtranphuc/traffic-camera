"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "@/components/notification/NotificationBell";

export default function Topbar() {
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
    <header className="flex items-center justify-between border-b border-border bg-card/80 px-6 py-3 backdrop-blur">
      <h2 className="text-lg font-semibold">{pageTitle}</h2>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationBell />
      </div>
    </header>
  );
}
