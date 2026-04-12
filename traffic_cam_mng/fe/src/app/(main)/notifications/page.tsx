"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCheck, Trash2, Bell } from "lucide-react";
import toast from "react-hot-toast";
import { notificationService } from "@/services/cameraService";
import { useAuthStore } from "@/stores/authStore";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function NotificationsPage() {
  const t = useTranslations();
  const userId = useAuthStore((s) => s.user?.id);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    notificationService.list({ size: 100 })
      .then((res) => setNotifications(res.data.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useWebSocket(
    userId ? `/topic/notifications/${userId}` : null,
    useCallback((n: any) => {
      toast(n.title);
      load();
    }, [load])
  );

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{notifications.length} {t("notification.title").toLowerCase()}</p>
        <button onClick={() => notificationService.markAllRead().then(load)} className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-accent">
          <CheckCheck className="h-4 w-4" />
          {t("notification.markAllRead")}
        </button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-center text-muted-foreground">{t("common.loading")}</p>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground opacity-30" />
            <p className="mt-3 text-muted-foreground">{t("notification.noNotifications")}</p>
          </div>
        ) : (
          notifications.map((n: any) => (
            <div key={n.id} className={`flex items-start justify-between rounded-xl border p-4 ${!n.isRead ? "border-primary/50 bg-primary/5" : "border-border bg-card"}`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">{n.title}</h3>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString("vi-VN")}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {!n.isRead && (
                  <button onClick={() => notificationService.markRead(n.id).then(load)} className="rounded bg-primary/20 px-2 py-1 text-xs text-primary">
                    <CheckCheck className="h-3 w-3" />
                  </button>
                )}
                <button onClick={() => notificationService.delete(n.id).then(load)} className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-500">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
