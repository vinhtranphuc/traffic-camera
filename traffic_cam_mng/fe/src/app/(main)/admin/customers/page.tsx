"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Lock, Unlock } from "lucide-react";
import toast from "react-hot-toast";
import { userService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

export default function CustomersPage() {
  const t = useTranslations();
  const currentRole = useAuthStore((s) => s.user?.role);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", fullName: "", role: "CUSTOMER" });

  const availableRoles =
    currentRole === "SYSTEM_ADMIN" ? ["SUPER_ADMIN"] :
    currentRole === "SUPER_ADMIN" ? ["ADMIN"] :
    currentRole === "ADMIN" ? ["CUSTOMER"] : [];

  const load = () => {
    setLoading(true);
    userService.listUsers({ size: 50 })
      .then((res) => setUsers(res.data.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (availableRoles.length > 0) setForm((f) => ({ ...f, role: availableRoles[0] }));
  }, []);

  const handleCreate = async () => {
    try {
      await userService.createUser(form);
      toast.success(t("common.success"));
      setShowCreate(false);
      setForm({ username: "", password: "", fullName: "", role: availableRoles[0] || "CUSTOMER" });
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || t("common.error"));
    }
  };

  const inputCls = "rounded-lg border border-border bg-background px-3 py-2 text-sm";

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{users.length} {t("user.title").toLowerCase()}</p>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" />
          {t("user.createUser")}
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder={t("auth.username")} className={inputCls} />
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={t("auth.password")} className={inputCls} />
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder={t("auth.fullName")} className={inputCls} />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls}>
              {availableRoles.map((r) => (
                <option key={r} value={r}>{t(`user.roles.${r}` as any)}</option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleCreate} className="rounded-lg bg-green-500 px-4 py-2 text-sm text-white hover:opacity-90">{t("common.create")}</button>
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">{t("common.cancel")}</button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-accent/50">
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-4 py-3">{t("auth.username")}</th>
              <th className="px-4 py-3">{t("auth.fullName")}</th>
              <th className="px-4 py-3">{t("user.role")}</th>
              <th className="px-4 py-3">{t("common.status")}</th>
              <th className="px-4 py-3">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t("common.loading")}</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{t("common.noData")}</td></tr>
            ) : users.map((u: any) => (
              <tr key={u.id} className="border-b border-border/50 hover:bg-accent/30">
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">{u.fullName}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-primary/20 px-2 py-0.5 text-xs text-primary">
                    {t(`user.roles.${u.role}` as any)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.isLocked
                    ? <span className="text-red-500">{t("user.locked")}</span>
                    : <span className="text-green-500">{t("user.active")}</span>}
                </td>
                <td className="px-4 py-3">
                  {u.isLocked ? (
                    <button onClick={() => userService.unlockUser(u.id).then(load)} className="flex items-center gap-1 rounded bg-green-500/20 px-2 py-1 text-xs text-green-500">
                      <Unlock className="h-3 w-3" /> {t("user.unlock")}
                    </button>
                  ) : (
                    <button onClick={() => userService.lockUser(u.id, "Admin action").then(load)} className="flex items-center gap-1 rounded bg-red-500/20 px-2 py-1 text-xs text-red-500">
                      <Lock className="h-3 w-3" /> {t("user.lock")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
