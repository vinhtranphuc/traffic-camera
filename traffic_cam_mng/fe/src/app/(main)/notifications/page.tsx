"use client";

import { useEffect, useState } from "react";
import { notificationService } from "@/services/cameraService";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    notificationService.list({ size: 50 })
      .then((res) => setNotifications(res.data.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Notifications</h2>
        <button onClick={() => notificationService.markAllRead().then(load)} className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600">
          Mark all read
        </button>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center text-gray-500">No notifications</div>
        ) : (
          notifications.map((n: any) => (
            <div key={n.id} className={`flex items-start justify-between rounded-xl border p-4 ${n.isRead ? "border-gray-800 bg-gray-900" : "border-blue-800/50 bg-blue-950/20"}`}>
              <div>
                <h3 className="text-sm font-medium text-white">{n.title}</h3>
                <p className="mt-0.5 text-sm text-gray-400">{n.message}</p>
                <p className="mt-1 text-xs text-gray-600">{new Date(n.createdAt).toLocaleString("vi-VN")}</p>
              </div>
              <div className="flex gap-2">
                {!n.isRead && (
                  <button onClick={() => notificationService.markRead(n.id).then(load)} className="rounded bg-blue-600/20 px-2 py-1 text-xs text-blue-400">Read</button>
                )}
                <button onClick={() => notificationService.delete(n.id).then(load)} className="rounded bg-red-600/20 px-2 py-1 text-xs text-red-400">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
