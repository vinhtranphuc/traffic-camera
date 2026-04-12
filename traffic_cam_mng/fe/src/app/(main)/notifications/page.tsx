"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCheck, Trash2, Bell, BellOff } from "lucide-react";
import toast from "react-hot-toast";
import { notificationService } from "@/services/cameraService";
import { useAuthStore } from "@/stores/authStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatRelativeTime } from "@/lib/utils";

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
      toast(n.title, { icon: "🔔" });
      load();
    }, [load])
  );

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("notification.title")}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {loading ? "Đang tải..." : unread > 0 ? `${unread} chưa đọc trên tổng ${notifications.length}` : `${notifications.length} thông báo`}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" onClick={() => notificationService.markAllRead().then(load)} leftIcon={<CheckCheck className="h-4 w-4" />}>
            {t("notification.markAllRead")}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-2 h-3 w-3/4" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={t("notification.noNotifications")}
          description="Bạn sẽ nhận được thông báo khi có hoạt động liên quan đến camera của bạn."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-3 rounded-xl border p-4 transition ${
                !n.isRead
                  ? "border-primary/40 bg-primary/5 hover:border-primary/60"
                  : "border-border bg-card"
              }`}
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Bell className={`h-4 w-4 ${!n.isRead ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium">{n.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatRelativeTime(n.createdAt)}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                {!n.isRead && (
                  <Button
                    variant="ghost" size="icon-sm"
                    onClick={() => notificationService.markRead(n.id).then(load)}
                    aria-label="Đánh dấu đã đọc"
                    className="text-primary"
                  >
                    <CheckCheck className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost" size="icon-sm"
                  onClick={() => notificationService.delete(n.id).then(load)}
                  aria-label="Xóa thông báo"
                  className="text-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
