"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import Link from "next/link";
import { notificationService } from "@/services/cameraService";
import { useAuthStore } from "@/stores/authStore";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function NotificationBell() {
  const t = useTranslations();
  const userId = useAuthStore((s) => s.user?.id);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        notificationService.list({ size: 10 }),
        notificationService.getUnreadCount(),
      ]);
      setItems(listRes.data.data?.items || []);
      setUnread(countRes.data.data?.count || 0);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  useWebSocket(
    userId ? `/topic/notifications/${userId}` : null,
    useCallback((notif: any) => {
      toast(`${notif.title}: ${notif.message}`, { icon: "\uD83D\uDD14" });
      load();
    }, [load])
  );

  const markRead = async (id: string) => {
    await notificationService.markRead(id);
    load();
  };
  const markAllRead = async () => {
    await notificationService.markAllRead();
    load();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:bg-accent"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-96 rounded-xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-3">
              <h3 className="text-sm font-semibold">{t("notification.title")}</h3>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                  {t("notification.markAllRead")}
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-auto">
              {items.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {t("notification.noNotifications")}
                </div>
              ) : (
                items.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 border-b border-border p-3 text-sm ${!n.isRead ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => markRead(n.id)}
                        className="text-xs text-primary hover:underline"
                        title={t("notification.markRead")}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-border p-2">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="block w-full rounded py-1.5 text-center text-xs text-primary hover:bg-accent"
              >
                {t("notification.title")} &rarr;
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
