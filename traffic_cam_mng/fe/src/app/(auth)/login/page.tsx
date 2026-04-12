"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, User } from "lucide-react";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";

const loginSchema = z.object({
  username: z.string().min(1, "Bắt buộc"),
  password: z.string().min(1, "Bắt buộc"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const form = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { username: "", password: "" } });

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
            TC
          </div>
          <h1 className="text-2xl font-bold">{t("auth.loginTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.loginSubtitle")}</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}

          <div>
            <label className="mb-1.5 block text-sm text-muted-foreground">{t("auth.username")}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                {...form.register("username")}
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm focus:border-primary focus:outline-none"
                placeholder="sysadmin"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-muted-foreground">{t("auth.password")}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                {...form.register("password")}
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm focus:border-primary focus:outline-none"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? t("auth.signingIn") : t("auth.signIn")}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Default: sysadmin / Sysadmin@2025
        </p>
      </div>
    </div>
  );
}
