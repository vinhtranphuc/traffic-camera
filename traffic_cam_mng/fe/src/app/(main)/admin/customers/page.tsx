"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Lock, Unlock, Users } from "lucide-react";
import toast from "react-hot-toast";
import { userService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import SearchInput from "@/components/ui/SearchInput";
import { SkeletonRow } from "@/components/ui/Skeleton";
import Modal from "@/components/shared/Modal";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

export default function CustomersPage() {
  const t = useTranslations();
  const currentRole = useAuthStore((s) => s.user?.role);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [lockTarget, setLockTarget] = useState<any>(null);
  const [form, setForm] = useState({ username: "", password: "", fullName: "", role: "CUSTOMER" });

  const availableRoles =
    currentRole === "SYSTEM_ADMIN" ? ["SUPER_ADMIN"] :
    currentRole === "SUPER_ADMIN" ? ["ADMIN"] :
    currentRole === "ADMIN" ? ["CUSTOMER"] : [];

  const load = () => {
    setLoading(true);
    userService.listUsers({ size: 100 })
      .then((res) => setUsers(res.data.data?.items || []))
      .catch(() => toast.error(t("common.error")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (availableRoles.length > 0) setForm((f) => ({ ...f, role: availableRoles[0] }));
  }, []);

  const filtered = useMemo(() => users.filter((u: any) => {
    if (search) {
      const s = search.toLowerCase();
      if (!u.username.toLowerCase().includes(s) && !u.fullName.toLowerCase().includes(s)) return false;
    }
    if (roleFilter && u.role !== roleFilter) return false;
    return true;
  }), [users, search, roleFilter]);

  const handleCreate = async () => {
    try {
      await userService.createUser(form);
      toast.success(`Đã tạo người dùng ${form.username}`);
      setShowCreate(false);
      setForm({ username: "", password: "", fullName: "", role: availableRoles[0] || "CUSTOMER" });
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message || t("common.error"));
    }
  };

  const handleLockToggle = async () => {
    if (!lockTarget) return;
    try {
      if (lockTarget.isLocked) {
        await userService.unlockUser(lockTarget.id);
        toast.success(`Đã mở khóa ${lockTarget.username}`);
      } else {
        await userService.lockUser(lockTarget.id, "Admin action");
        toast.success(`Đã khóa ${lockTarget.username}`);
      }
      setLockTarget(null);
      load();
    } catch { toast.error(t("common.error")); }
  };

  const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none";

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Đang hiển thị <strong className="text-foreground">{filtered.length}</strong> / <strong className="text-foreground">{users.length}</strong> người dùng
        </p>
        {availableRoles.length > 0 && (
          <Button onClick={() => setShowCreate(true)} leftIcon={<Plus className="h-4 w-4" />}>
            {t("user.createUser")}
          </Button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <SearchInput className="min-w-[200px] flex-1 max-w-sm" onSearch={setSearch} placeholder="Tìm theo tên hoặc tên đăng nhập..." />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
          aria-label="Lọc theo vai trò"
        >
          <option value="">Tất cả vai trò</option>
          {["SYSTEM_ADMIN", "SUPER_ADMIN", "ADMIN", "CUSTOMER"].map((r) => (
            <option key={r} value={r}>{t(`user.roles.${r}` as any)}</option>
          ))}
        </select>
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={t("user.createUser")}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t("auth.username")} *</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">{t("auth.password")} *</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">{t("auth.fullName")} *</label>
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">{t("user.role")} *</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls}>
              {availableRoles.map((r) => <option key={r} value={r}>{t(`user.roles.${r}` as any)}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setShowCreate(false)}>{t("common.cancel")}</Button>
            <Button variant="success" onClick={handleCreate}>{t("common.create")}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!lockTarget}
        title={lockTarget?.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
        message={
          lockTarget?.isLocked
            ? `Mở khóa tài khoản "${lockTarget?.username}"? Người dùng có thể đăng nhập trở lại.`
            : `Khóa tài khoản "${lockTarget?.username}"? Tất cả phiên đăng nhập hiện tại sẽ bị vô hiệu hóa.`
        }
        confirmText={lockTarget?.isLocked ? "Mở khóa" : "Khóa"}
        variant={lockTarget?.isLocked ? "primary" : "danger"}
        onConfirm={handleLockToggle}
        onCancel={() => setLockTarget(null)}
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-accent/40">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">{t("auth.username")}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">{t("auth.fullName")}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">{t("user.role")}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground">{t("common.status")}</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1, 2, 3, 4, 5].map((i) => <SkeletonRow key={i} cols={5} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12">
                    {users.length === 0 ? (
                      <EmptyState icon={Users} title="Chưa có người dùng nào" description="Bạn chưa có quyền quản lý người dùng nào" className="border-0 bg-transparent" />
                    ) : (
                      <EmptyState icon={Users} title="Không tìm thấy" description="Thử xóa bộ lọc" className="border-0 bg-transparent" />
                    )}
                  </td>
                </tr>
              ) : filtered.map((u: any) => (
                <tr key={u.id} className="border-b border-border/50 transition hover:bg-accent/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                        {u.fullName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <span className="font-medium">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.fullName}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                      {t(`user.roles.${u.role}` as any)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isLocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-500">
                        <Lock className="h-3 w-3" />
                        {t("user.locked")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        {t("user.active")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLockTarget(u)}
                      leftIcon={u.isLocked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      className={u.isLocked ? "text-green-500" : "text-red-500"}
                    >
                      {u.isLocked ? t("user.unlock") : t("user.lock")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
