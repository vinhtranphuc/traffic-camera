"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "\u25A0" },
  { href: "/cameras", label: "Cameras", icon: "\u25B6" },
  { href: "/live-view", label: "Live View", icon: "\u25BA" },
  { href: "/detections", label: "Detections", icon: "\uD83D\uDD0D" },
  { href: "/notifications", label: "Notifications", icon: "\uD83D\uDD14" },
];

const adminItems = [
  { href: "/admin/approvals", label: "Approvals", roles: ["ADMIN", "SUPER_ADMIN"] },
  { href: "/admin/customers", label: "Users", roles: ["ADMIN", "SUPER_ADMIN", "SYSTEM_ADMIN"] },
  { href: "/system/config", label: "System Config", roles: ["SYSTEM_ADMIN"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const role = user?.role || "";

  return (
    <aside className="flex w-64 flex-col border-r border-gray-800 bg-gray-900">
      <div className="flex items-center gap-3 p-4 pb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold">
          TC
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white">TrafficCam</h1>
          <p className="text-xs text-gray-500">Management System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-blue-600/15 text-blue-400"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              <span className="w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {adminItems.some((i) => i.roles.includes(role)) && (
          <>
            <div className="pb-1 pt-4">
              <p className="px-3 text-xs font-medium uppercase text-gray-600">Admin</p>
            </div>
            {adminItems
              .filter((i) => i.roles.includes(role))
              .map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      active
                        ? "bg-blue-600/15 text-blue-400"
                        : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
          </>
        )}

        <div className="pt-4">
          <Link
            href="/settings/profile"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-800 hover:text-gray-300 ${
              pathname.startsWith("/settings") ? "bg-blue-600/15 text-blue-400" : ""
            }`}
          >
            Settings
          </Link>
        </div>
      </nav>

      <div className="border-t border-gray-800 p-3">
        <div className="flex items-center justify-between rounded-lg bg-gray-800/50 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-xs font-bold">
              {user?.fullName?.charAt(0) || "?"}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-200">{user?.fullName}</p>
              <p className="text-xs text-gray-500">{user?.role?.toLowerCase().replace("_", " ")}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); window.location.href = "/login"; }}
            className="rounded p-1 text-gray-500 hover:bg-gray-700 hover:text-gray-300"
            title="Logout"
          >
            &#x2715;
          </button>
        </div>
      </div>
    </aside>
  );
}
