"use client";

import { useLocalStorage } from "./use-local-storage";
import type { UserSettings, DashboardPane, Theme, AccentColor } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";

export function useSettings() {
  const [settings, setSettings, isHydrated] = useLocalStorage<UserSettings>(
    "academic-dashboard-settings",
    DEFAULT_SETTINGS
  );

  // Ensure all fields exist for older stored data
  const safeSettings: UserSettings = {
    ...DEFAULT_SETTINGS,
    ...settings,
  };

  function updateSettings(updates: Partial<UserSettings>) {
    setSettings((prev) => ({ ...prev, ...updates }));
  }

  function setTheme(theme: Theme) {
    updateSettings({ theme });
  }

  function setAccentColor(accentColor: AccentColor) {
    updateSettings({ accentColor });
  }

  function togglePane(pane: DashboardPane) {
    setSettings((prev) => {
      const current = prev.visiblePanes ?? DEFAULT_SETTINGS.visiblePanes;
      const next = current.includes(pane)
        ? current.filter((p) => p !== pane)
        : [...current, pane];
      return { ...prev, visiblePanes: next };
    });
  }

  function isPaneVisible(pane: DashboardPane): boolean {
    return safeSettings.visiblePanes.includes(pane);
  }

  function setScreensaverTimeout(minutes: number) {
    updateSettings({ screensaverTimeout: minutes });
  }

  function resetToDefaults() {
    setSettings(DEFAULT_SETTINGS);
  }

  return {
    settings: safeSettings,
    isHydrated,
    updateSettings,
    setTheme,
    setAccentColor,
    togglePane,
    isPaneVisible,
    setScreensaverTimeout,
    resetToDefaults,
  };
}
