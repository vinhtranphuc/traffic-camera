"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import api from "@/lib/api";

const EVENT_TYPES = [
  "CAMERA_APPROVAL_REQUESTED",
  "CAMERA_APPROVED",
  "CAMERA_REJECTED",
  "CAMERA_OFFLINE",
  "CAMERA_ERROR",
];

export default function NotificationPrefsPage() {
  const t = useTranslations();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/v1/users/me/notification-prefs")
      .then((res) => {
        const loaded = res.data.data || {};
        const full: Record<string, boolean> = {};
        for (const tt of EVENT_TYPES) full[tt] = loaded[tt] ?? true;
        setPrefs(full);
      })
      .catch(() => {
        const defaults: Record<string, boolean> = {};
        for (const tt of EVENT_TYPES) defaults[tt] = true;
        setPrefs(defaults);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/v1/users/me/notification-prefs", prefs);
      toast.success(t("common.success"));
    } catch {
      toast.error(t("common.error"));
    }
    setSaving(false);
  };

  if (loading) return <div className="p-6 text-muted-foreground">{t("common.loading")}</div>;

  return (
    <div className="p-6">
      <div className="max-w-lg rounded-xl border border-border bg-card p-6">
        <h3 className="mb-2 text-lg font-semibold">{t("settings.notificationPrefs")}</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Tắt thông báo cho từng loại sự kiện. Thông báo vẫn lưu trong hệ thống — bạn có thể xem bất cứ lúc nào ở mục Thông báo.
        </p>
        <div className="space-y-3">
          {EVENT_TYPES.map((type) => (
            <label key={type} className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/30">
              <span className="text-sm">{t(`notification.types.${type}` as any)}</span>
              <input
                type="checkbox"
                checked={prefs[type] ?? true}
                onChange={(e) => setPrefs({ ...prefs, [type]: e.target.checked })}
                className="h-4 w-4"
                aria-label={`Bật/tắt thông báo ${t(`notification.types.${type}` as any)}`}
              />
            </label>
          ))}
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? t("common.loading") : t("common.save")}
        </button>
      </div>
    </div>
  );
}
