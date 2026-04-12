"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Camera } from "lucide-react";
import toast from "react-hot-toast";
import { userService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";

export default function ProfilePage() {
  const t = useTranslations();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", avatarUrl: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    userService.getProfile().then((res) => {
      const p = res.data.data;
      setForm({
        fullName: p.fullName || "",
        email: p.email || "",
        phone: p.phone || "",
        avatarUrl: p.avatarUrl || "",
      });
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await userService.updateProfile({
        fullName: form.fullName, email: form.email, phone: form.phone,
      });
      setUser({ ...user!, fullName: res.data.data.fullName });
      toast.success(t("settings.profileUpdated"));
    } catch { toast.error(t("common.error")); }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file vượt quá 5MB");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.put("/v1/users/me/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.data.avatarUrl;
      setForm({ ...form, avatarUrl: url });
      setUser({ ...user!, avatarUrl: url });
      toast.success("Đã cập nhật ảnh đại diện");
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("common.error"));
    }
    setUploading(false);
  };

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary";
  const labelCls = "mb-1 block text-sm text-muted-foreground";

  const subNavs = [
    { href: "/settings/profile", label: t("settings.profile") },
    { href: "/settings/password", label: t("settings.changePassword") },
    { href: "/settings/sessions", label: t("settings.sessions") },
    { href: "/settings/notifications", label: t("settings.notificationPrefs") },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex gap-2 border-b border-border pb-3 overflow-x-auto">
        {subNavs.map((n) => {
          const active = pathname === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm transition ${
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

        <div className="flex items-center gap-4">
          <div className="relative">
            {form.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                {form.fullName?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:opacity-90 disabled:opacity-50"
              aria-label="Tải lên ảnh đại diện"
            >
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div className="text-xs text-muted-foreground">
            <p>JPG, PNG, WebP hoặc GIF</p>
            <p>Tối đa 5MB</p>
            {uploading && <p className="text-primary">Đang tải lên...</p>}
          </div>
        </div>

        <div>
          <label htmlFor="fullName" className={labelCls}>{t("auth.fullName")}</label>
          <input id="fullName" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>{t("auth.email")}</label>
          <input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label htmlFor="phone" className={labelCls}>{t("auth.phone")}</label>
          <input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? t("common.loading") : t("common.save")}
        </button>
      </div>
    </div>
  );
}
