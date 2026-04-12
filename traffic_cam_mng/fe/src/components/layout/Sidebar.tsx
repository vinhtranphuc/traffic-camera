"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Video,
  Tv,
  Search,
  Bell,
  Settings,
  UserCheck,
  Users,
  Cog,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export default function Sidebar() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const role = user?.role || "";

  const navItems = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/cameras", label: t("nav.cameras"), icon: Video },
    { href: "/live-view", label: t("nav.liveView"), icon: Tv },
    { href: "/detections", label: t("nav.detections"), icon: Search },
    { href: "/notifications", label: t("nav.notifications"), icon: Bell },
  ];

  const adminItems = [
    { href: "/admin/approvals", label: t("nav.approvals"), icon: UserCheck, roles: ["ADMIN", "SUPER_ADMIN"] },
    { href: "/admin/customers", label: t("nav.users"), icon: Users, roles: ["ADMIN", "SUPER_ADMIN", "SYSTEM_ADMIN"] },
    { href: "/system/config", label: t("nav.systemConfig"), icon: Cog, roles: ["SYSTEM_ADMIN"] },
  ];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const roleLabel = (r: string) => {
    try { return t(`user.roles.${r}` as any); } catch { return r; }
  };

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-3 p-4 pb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          TC
        </div>
        <div>
          <h1 className="text-sm font-semibold">{t("common.appName")}</h1>
          <p className="text-xs text-muted-foreground">Management System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 overflow-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {adminItems.some((i) => i.roles.includes(role)) && (
          <>
            <div className="pb-1 pt-4">
              <p className="px-3 text-xs font-medium uppercase text-muted-foreground">
                {t("nav.admin")}
              </p>
            </div>
            {adminItems
              .filter((i) => i.roles.includes(role))
              .map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
          </>
        )}

        <div className="pt-4">
          <Link
            href="/settings/profile"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
              pathname.startsWith("/settings")
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <Settings className="h-4 w-4" />
            {t("nav.settings")}
          </Link>
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between rounded-lg bg-accent/50 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
              {user?.fullName?.charAt(0) || "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel(role)}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            title={t("nav.logout")}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
