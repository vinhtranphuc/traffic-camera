"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { userService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

export default function ProfilePage() {
  const t = useTranslations();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userService.getProfile().then((res) => {
      const p = res.data.data;
      setForm({ fullName: p.fullName || "", email: p.email || "", phone: p.phone || "" });
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await userService.updateProfile(form);
      setUser({ ...user!, fullName: res.data.data.fullName });
      toast.success(t("settings.profileUpdated"));
    } catch { toast.error(t("common.error")); }
    setSaving(false);
  };

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  const labelCls = "mb-1 block text-sm text-muted-foreground";

  const subNavs = [
    { href: "/settings/profile", label: t("settings.profile") },
    { href: "/settings/password", label: t("settings.changePassword") },
    { href: "/settings/sessions", label: t("settings.sessions") },
    { href: "/settings/notifications", label: t("settings.notificationPrefs") },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex gap-2 border-b border-border pb-3">
        {subNavs.map((n) => {
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-lg px-4 py-2 text-sm transition ${
                active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </div>

      <div className="max-w-lg space-y-4 rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold">{t("settings.profile")}</h3>
        <div>
          <label className={labelCls}>{t("auth.fullName")}</label>
          <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t("auth.email")}</label>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t("auth.phone")}</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
        </div>
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {saving ? t("common.loading") : t("common.save")}
        </button>
      </div>
    </div>
  );
}
