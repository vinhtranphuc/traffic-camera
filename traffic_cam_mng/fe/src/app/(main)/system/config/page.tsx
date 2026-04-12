"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { systemConfigService } from "@/services/cameraService";

export default function SystemConfigPage() {
  const t = useTranslations();
  const [configs, setConfigs] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [editValue, setEditValue] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    systemConfigService.getAll()
      .then((res) => setConfigs(res.data.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (key: string, currentValue: string) => {
    const newValue = currentValue === "true" ? "false" : "true";
    await systemConfigService.update(key, newValue);
    toast.success(t("common.success"));
    load();
  };

  const handleUpdateText = async (key: string) => {
    await systemConfigService.update(key, editValue[key] || "");
    toast.success(t("common.success"));
    setEditValue({ ...editValue, [key]: "" });
    load();
  };

  return (
    <div className="p-6">
      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : (
        Object.entries(configs).map(([category, items]) => (
          <div key={category} className="mb-6 rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase text-primary">
              {t(`system.categories.${category}` as any, { defaultMessage: category } as any)}
            </h3>
            <div className="space-y-3">
              {(items as any[]).map((item: any) => (
                <div key={item.key} className="flex items-start justify-between gap-3 border-b border-border/50 pb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-mono">{item.key}</p>
                    {item.description && <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>}
                  </div>
                  {item.value === "true" || item.value === "false" ? (
                    <button
                      onClick={() => handleToggle(item.key, item.value)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        item.value === "true" ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {item.value === "true" ? t("system.enabled") : t("system.disabled")}
                    </button>
                  ) : (
                    <div className="flex w-64 gap-1">
                      <input
                        type="text"
                        placeholder={item.value || "(trống)"}
                        value={editValue[item.key] || ""}
                        onChange={(e) => setEditValue({ ...editValue, [item.key]: e.target.value })}
                        className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm"
                      />
                      {editValue[item.key] && (
                        <button onClick={() => handleUpdateText(item.key)} className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground">
                          {t("common.save")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
