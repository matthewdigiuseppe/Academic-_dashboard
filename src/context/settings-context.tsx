"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useSettings } from "@/hooks/use-settings";

type SettingsType = ReturnType<typeof useSettings>;

const SettingsContext = createContext<SettingsType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const settingsStore = useSettings();
  const { settings, isHydrated } = settingsStore;

  // Apply theme to <html> element
  useEffect(() => {
    if (!isHydrated) return;

    const root = document.documentElement;

    // Resolve system preference
    let resolvedTheme = settings.theme;
    if (resolvedTheme === "system") {
      resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);

    // Apply accent color as a data attribute
    root.setAttribute("data-accent", settings.accentColor);
  }, [settings.theme, settings.accentColor, isHydrated]);

  // Listen for system theme changes when set to "system"
  useEffect(() => {
    if (!isHydrated || settings.theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.theme, isHydrated]);

  return (
    <SettingsContext.Provider value={settingsStore}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useUserSettings must be used within a SettingsProvider");
  }
  return context;
}
