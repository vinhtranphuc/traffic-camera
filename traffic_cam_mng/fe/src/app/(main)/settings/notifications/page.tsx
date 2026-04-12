"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

const EVENT_TYPES = [
  "CAMERA_APPROVAL_REQUESTED",
  "CAMERA_APPROVED",
  "CAMERA_REJECTED",
  "CAMERA_OFFLINE",
  "CAMERA_ERROR",
];

export default function NotificationPrefsPage() {
  const t = useTranslations();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return Object.fromEntries(EVENT_TYPES.map((k) => [k, true]));
    try {
      return JSON.parse(localStorage.getItem("notification_prefs") || "null") ||
        Object.fromEntries(EVENT_TYPES.map((k) => [k, true]));
    } catch { return Object.fromEntries(EVENT_TYPES.map((k) => [k, true])); }
  });

  const save = () => {
    localStorage.setItem("notification_prefs", JSON.stringify(prefs));
    toast.success(t("common.success"));
  };

  return (
    <div className="p-6">
      <div className="max-w-lg rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">{t("settings.notificationPrefs")}</h3>
        <div className="space-y-3">
          {EVENT_TYPES.map((type) => (
            <label key={type} className="flex items-center justify-between">
              <span className="text-sm">{t(`notification.types.${type}` as any)}</span>
              <input
                type="checkbox"
                checked={prefs[type]}
                onChange={(e) => setPrefs({ ...prefs, [type]: e.target.checked })}
                className="h-4 w-4"
              />
            </label>
          ))}
        </div>
        <button onClick={save} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          {t("common.save")}
        </button>
      </div>
    </div>
  );
}
