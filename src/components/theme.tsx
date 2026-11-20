"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { ComputerIcon, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ThemeProvider, useTheme } from "next-themes";

const subscribe = () => () => {};

export function Theme({ children }: { children: ReactNode }) {
  return <ThemeProvider attribute={["data-theme", "class"]} defaultTheme="system" enableSystem disableTransitionOnChange>{children}</ThemeProvider>;
}

export function ThemeControl() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const { theme, setTheme } = useTheme();
  const current = mounted ? theme ?? "system" : "system";
  const icon = current === "light" ? Sun03Icon : current === "dark" ? Moon02Icon : ComputerIcon;

  return (
    <label className="theme-control" title="Color theme">
      <HugeiconsIcon icon={icon} size={18} aria-hidden="true" />
      <select value={current} onChange={(event) => setTheme(event.target.value)} aria-label="Color theme">
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
