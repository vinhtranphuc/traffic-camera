"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ScanEye, Save, Undo2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { cameraService } from "@/services/cameraService";

type DetectionSettings = {
  detectVehicles?: boolean;
  vehicleTypes?: string[];
  detectPersons?: boolean;
  detectPlates?: boolean;
};

interface Props {
  cameraId: string;
  detectionEnabled: boolean;
  detectionSettings: DetectionSettings | null | undefined;
  onChange?: (next: { detectionEnabled: boolean; detectionSettings: DetectionSettings }) => void;
}

const DEFAULT_SETTINGS: DetectionSettings = {
  detectVehicles: true,
  vehicleTypes: ["car", "motorcycle"],
  detectPersons: false,
  detectPlates: false,
};

function mergeDefaults(s: DetectionSettings | null | undefined): DetectionSettings {
  return { ...DEFAULT_SETTINGS, ...(s || {}) };
}

function settingsEqual(a: DetectionSettings, b: DetectionSettings): boolean {
  return (
    !!a.detectVehicles === !!b.detectVehicles &&
    !!a.detectPersons === !!b.detectPersons &&
    !!a.detectPlates === !!b.detectPlates
  );
}

export default function DetectionToggleBadge({
  cameraId,
  detectionEnabled,
  detectionSettings,
  onChange,
}: Props) {
  const t = useTranslations();
  const [enabled, setEnabled] = useState(detectionEnabled);
  const [saved, setSaved] = useState<DetectionSettings>(mergeDefaults(detectionSettings));
  const [draft, setDraft] = useState<DetectionSettings>(mergeDefaults(detectionSettings));
  const [open, setOpen] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from parent props when camera data refreshes
  useEffect(() => {
    setEnabled(detectionEnabled);
    const m = mergeDefaults(detectionSettings);
    setSaved(m);
    setDraft(m);
  }, [detectionEnabled, detectionSettings, cameraId]);

  const hasChanges = !settingsEqual(draft, saved);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toggling) return;
    const next = !enabled;
    setToggling(true);
    try {
      await cameraService.update(cameraId, { detectionEnabled: next });
      setEnabled(next);
      onChange?.({ detectionEnabled: next, detectionSettings: saved });
      toast.success(next ? t("liveView.detectionOn") : t("liveView.detectionOff"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setToggling(false);
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saving || !hasChanges) return;
    setSaving(true);
    try {
      // Save settings only. detectionEnabled is NOT touched here — toggle is a
      // separate action. When OFF, settings are stored but the pipeline will
      // not apply them until the user enables detection via the toggle.
      await cameraService.update(cameraId, { detectionSettings: draft });
      setSaved(draft);
      onChange?.({ detectionEnabled: enabled, detectionSettings: draft });
      toast.success(t("common.success"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraft(saved);
  };

  // Hover open/close with grace period so users can move between badge and popover
  const openPopover = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const schedulePopoverClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  // Close when clicking outside (keyboard + touch users)
  useEffect(() => {
    if (!open) return;
    const onDocClick = (ev: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(ev.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="absolute right-2 top-2 z-10"
      onMouseEnter={openPopover}
      onMouseLeave={schedulePopoverClose}
    >
      <button
        type="button"
        onClick={handleToggle}
        disabled={toggling}
        aria-pressed={enabled}
        aria-label={t("liveView.detectionMode")}
        className={[
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold text-white transition-colors",
          enabled ? "bg-primary hover:bg-primary/90" : "bg-gray-500/80 hover:bg-gray-500",
          toggling ? "cursor-wait opacity-80" : "cursor-pointer",
        ].join(" ")}
      >
        {toggling ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <ScanEye className="h-3 w-3" />
        )}
        <span>{t("liveView.detectionMode")}</span>
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg ring-1 ring-black/5"
          onMouseEnter={openPopover}
          onMouseLeave={schedulePopoverClose}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold">{t("camera.detectionSettings")}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleRevert}
                disabled={!hasChanges}
                title={t("liveView.revert")}
                aria-label={t("liveView.revert")}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasChanges || saving}
                title={t("liveView.save")}
                aria-label={t("liveView.save")}
                className="rounded p-1 text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex cursor-pointer items-center justify-between gap-2 text-xs">
              <span>{t("camera.detectVehicles")}</span>
              <input
                type="checkbox"
                checked={!!draft.detectVehicles}
                onChange={(e) => setDraft({ ...draft, detectVehicles: e.target.checked })}
                className="h-3.5 w-3.5"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-2 text-xs">
              <span>{t("camera.detectPersons")}</span>
              <input
                type="checkbox"
                checked={!!draft.detectPersons}
                onChange={(e) => setDraft({ ...draft, detectPersons: e.target.checked })}
                className="h-3.5 w-3.5"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-2 text-xs">
              <span>{t("camera.detectPlates")}</span>
              <input
                type="checkbox"
                checked={!!draft.detectPlates}
                onChange={(e) => setDraft({ ...draft, detectPlates: e.target.checked })}
                className="h-3.5 w-3.5"
              />
            </label>
          </div>

          {!enabled && (
            <p className="mt-2 border-t border-border pt-2 text-[10px] leading-snug text-muted-foreground">
              {t("liveView.detectionOff")} — {t("liveView.detectionMode").toLowerCase()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
