"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { userService } from "@/services/authService";

export default function SessionsPage() {
  const t = useTranslations();
  const [sessions, setSessions] = useState<any[]>([]);

  const load = () => userService.getSessions().then((r) => setSessions(r.data.data || []));
  useEffect(() => { load(); }, []);

  const revoke = async (id: string) => {
    await userService.revokeSession(id);
    toast.success(t("common.success"));
    load();
  };

  return (
    <div className="p-6">
      <h3 className="mb-4 text-lg font-semibold">{t("settings.sessions")}</h3>
      <div className="space-y-2">
        {sessions.map((s: any) => (
          <div key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {s.deviceInfo || "Unknown device"}
                {s.isActive && <span className="ml-2 rounded bg-green-500/20 px-2 py-0.5 text-xs text-green-500">Active</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                IP: {s.ipAddress || "-"} &middot; {t("settings.lastActive")}: {new Date(s.lastActiveAt).toLocaleString("vi-VN")}
              </p>
            </div>
            {s.isActive && (
              <button onClick={() => revoke(s.id)} className="rounded bg-red-500/20 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/30">
                {t("settings.revokeSession")}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
