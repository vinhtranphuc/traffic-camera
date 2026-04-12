"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { userService } from "@/services/authService";

export default function ChangePasswordPage() {
  const t = useTranslations();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    if (form.newPassword.length < 6) {
      toast.error("Mật khẩu phải tối thiểu 6 ký tự");
      return;
    }
    setSaving(true);
    try {
      await userService.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success(t("settings.passwordChanged"));
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Lỗi");
    }
    setSaving(false);
  };

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  const labelCls = "mb-1 block text-sm text-muted-foreground";

  return (
    <div className="p-6">
      <div className="max-w-lg space-y-4 rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold">{t("settings.changePassword")}</h3>
        <div>
          <label className={labelCls}>{t("auth.currentPassword")}</label>
          <input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t("auth.newPassword")}</label>
          <input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>{t("auth.confirmPassword")}</label>
          <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className={inputCls} />
        </div>
        <button onClick={handleSave} disabled={saving} className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {saving ? t("common.loading") : t("common.save")}
        </button>
      </div>
    </div>
  );
}
