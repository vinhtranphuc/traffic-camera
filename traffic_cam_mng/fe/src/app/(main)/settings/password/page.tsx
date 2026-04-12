"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { userService } from "@/services/authService";
import PasswordInput from "@/components/shared/PasswordInput";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Bắt buộc"),
  newPassword: z.string()
    .min(8, "Tối thiểu 8 ký tự")
    .refine((v) => /\d/.test(v), "Phải có chữ số")
    .refine((v) => /[A-Za-z]/.test(v), "Phải có chữ cái"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Xác nhận mật khẩu không khớp",
  path: ["confirmPassword"],
});
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ChangePasswordPage() {
  const t = useTranslations();
  const [saving, setSaving] = useState(false);

  const {
    register, handleSubmit, watch, reset, formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: PasswordForm) => {
    setSaving(true);
    try {
      await userService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success(t("settings.passwordChanged"));
      reset();
    } catch (e: any) {
      toast.error(e.response?.data?.message || t("common.error"));
    }
    setSaving(false);
  };

  const labelCls = "mb-1 block text-sm text-muted-foreground";
  const errCls = "mt-1 text-xs text-red-500";
  const inputCls = (hasErr: boolean) =>
    `w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm focus:outline-none ${
      hasErr ? "border-red-500" : "border-border focus:border-primary"
    }`;

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4 rounded-xl border border-border bg-card p-6" noValidate>
        <h3 className="text-lg font-semibold">{t("settings.changePassword")}</h3>

        <div>
          <label htmlFor="currentPassword" className={labelCls}>
            {t("auth.currentPassword")} <span className="text-red-500">*</span>
          </label>
          <PasswordInput
            id="currentPassword"
            {...register("currentPassword")}
            value={watch("currentPassword") || ""}
            className={inputCls(!!errors.currentPassword)}
            aria-invalid={!!errors.currentPassword}
          />
          {errors.currentPassword && <p className={errCls}>{errors.currentPassword.message}</p>}
        </div>

        <div>
          <label htmlFor="newPassword" className={labelCls}>
            {t("auth.newPassword")} <span className="text-red-500">*</span>
          </label>
          <PasswordInput
            id="newPassword"
            {...register("newPassword")}
            value={watch("newPassword") || ""}
            showStrength
            className={inputCls(!!errors.newPassword)}
            aria-invalid={!!errors.newPassword}
          />
          {errors.newPassword && <p className={errCls}>{errors.newPassword.message}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className={labelCls}>
            {t("auth.confirmPassword")} <span className="text-red-500">*</span>
          </label>
          <PasswordInput
            id="confirmPassword"
            {...register("confirmPassword")}
            value={watch("confirmPassword") || ""}
            className={inputCls(!!errors.confirmPassword)}
            aria-invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && <p className={errCls}>{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? t("common.loading") : t("common.save")}
        </button>
      </form>
    </div>
  );
}
