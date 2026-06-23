"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { DEFAULT_COLOR } from "@/lib/color-themes";

// ── Color theme context ───────────────────────────────────────────────────────

interface ColorThemeCtx {
  color: string;
  setColor: (color: string) => void;
}

const ColorThemeContext = createContext<ColorThemeCtx>({
  color: DEFAULT_COLOR,
  setColor: () => {},
});

export function useColorTheme() {
  return useContext(ColorThemeContext);
}

// ── ColorThemeProvider ────────────────────────────────────────────────────────

function ColorThemeProvider({ children }: { children: ReactNode }) {
  const [color, setColorState] = useState(DEFAULT_COLOR);

  // On mount: read persisted preference and apply to <html>
  useEffect(() => {
    const stored = localStorage.getItem("color-theme") ?? DEFAULT_COLOR;
    setColorState(stored);
    document.documentElement.setAttribute("data-color", stored);
  }, []);

  const setColor = useCallback((next: string) => {
    setColorState(next);
    localStorage.setItem("color-theme", next);
    document.documentElement.setAttribute("data-color", next);
  }, []);

  return (
    <ColorThemeContext.Provider value={{ color, setColor }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

// ── Combined provider ─────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ColorThemeProvider>{children}</ColorThemeProvider>
    </NextThemesProvider>
  );
}
