"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, User, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import PasswordInput from "@/components/shared/PasswordInput";

const loginSchema = z.object({
  username: z.string().min(1, "Bắt buộc nhập tên đăng nhập"),
  password: z.string().min(1, "Bắt buộc nhập mật khẩu"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauth, setOauth] = useState<Record<string, boolean>>({});

  const { register, handleSubmit, watch, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: { username: "", password: "" },
  });

  const passwordValue = watch("password");

  // Fetch enabled OAuth providers from SystemAdmin config
  useEffect(() => {
    api.get("/v1/system-config/public/oauth-providers")
      .then((res) => setOauth(res.data.data || {}))
      .catch(() => {});
  }, []);

  const onSubmit = async (data: LoginForm) => {
    setError("");
    setLoading(true);
    try {
      const res = await authService.login(data.username, data.password);
      const { accessToken, refreshToken, user } = res.data.data;
      login(accessToken, refreshToken, user);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: string) => {
    toast(`OAuth ${provider} đang được triển khai. Cấu hình credentials ở SystemAdmin.`, {
      duration: 4000, icon: "ℹ️",
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">TC</div>
          <h1 className="text-2xl font-bold">{t("auth.loginTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.loginSubtitle")}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="username" className="mb-1.5 block text-sm text-muted-foreground">
              {t("auth.username")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="username"
                {...register("username")}
                className={`w-full rounded-lg border bg-background py-2.5 pl-10 pr-3 text-sm focus:outline-none ${
                  errors.username ? "border-red-500" : "border-border focus:border-primary"
                }`}
                placeholder="sysadmin"
                autoComplete="username"
                autoFocus
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? "username-error" : undefined}
              />
            </div>
            {errors.username && <p id="username-error" className="mt-1 text-xs text-red-500">{errors.username.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm text-muted-foreground">
              {t("auth.password")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" aria-hidden="true" />
              <PasswordInput
                id="password"
                {...register("password")}
                value={passwordValue}
                className={`w-full rounded-lg border bg-background py-2.5 pl-10 pr-10 text-sm focus:outline-none ${
                  errors.password ? "border-red-500" : "border-border focus:border-primary"
                }`}
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
            </div>
            {errors.password && <p id="password-error" className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                <path fill="currentColor" d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2z" />
              </svg>
            )}
            {loading ? t("auth.signingIn") : t("auth.signIn")}
          </button>
        </form>

        {(oauth.google || oauth.zalo) && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">Hoặc</span></div>
            </div>
            <div className="space-y-2">
              {oauth.google && (
                <button type="button" onClick={() => handleOAuth("google")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm font-medium hover:bg-accent">
                  <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                  </svg>
                  {t("auth.loginWithGoogle")}
                </button>
              )}
              {oauth.zalo && (
                <button type="button" onClick={() => handleOAuth("zalo")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-sm font-medium hover:bg-accent">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-[#0068ff] text-[10px] font-bold text-white" aria-hidden="true">Z</span>
                  {t("auth.loginWithZalo")}
                </button>
              )}
            </div>
          </>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Tài khoản mặc định: <code className="rounded bg-accent px-1">sysadmin</code> / <code className="rounded bg-accent px-1">Sysadmin@2025</code>
        </p>
      </div>
    </div>
  );
}
