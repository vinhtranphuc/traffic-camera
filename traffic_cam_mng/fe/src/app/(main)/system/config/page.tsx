"use client";

import { useEffect, useState } from "react";
import { systemConfigService } from "@/services/cameraService";

export default function SystemConfigPage() {
  const [configs, setConfigs] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

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
    load();
  };

  return (
    <div className="p-6">
      <h2 className="mb-6 text-xl font-semibold text-white">System Configuration</h2>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        Object.entries(configs).map(([category, items]) => (
          <div key={category} className="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="mb-4 text-sm font-medium uppercase text-blue-400">{category}</h3>
            <div className="space-y-3">
              {(items as any[]).map((item: any) => (
                <div key={item.key} className="flex items-center justify-between border-b border-gray-800/50 pb-3">
                  <div>
                    <p className="text-sm text-gray-200">{item.key}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                  {item.value === "true" || item.value === "false" ? (
                    <button
                      onClick={() => handleToggle(item.key, item.value)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.value === "true" ? "bg-green-600/20 text-green-400" : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {item.value === "true" ? "Enabled" : "Disabled"}
                    </button>
                  ) : (
                    <span className="max-w-xs truncate text-sm text-gray-400">{item.value || "(empty)"}</span>
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
