"use client";

import { Moon, Sun, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useColorTheme } from "@/components/theme-provider";
import { COLOR_THEMES } from "@/lib/color-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { color, setColor } = useColorTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        panelRef.current?.contains(e.target as Node) ||
        btnRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Skeleton while not yet mounted (avoids hydration mismatch)
  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Personalizar tema"
        className="fixed left-4 bottom-4 z-50 rounded-full"
      >
        <Palette className="size-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="fixed left-4 bottom-4 z-50">
      {/* Trigger */}
      <Button
        ref={btnRef}
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        aria-label="Personalizar tema"
        aria-expanded={open}
        className="rounded-full shadow-md"
      >
        <Palette className="size-4" />
      </Button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Selector de tema"
          className="absolute left-0 bottom-11 w-64 rounded-2xl border border-border bg-popover p-4 shadow-xl"
          style={{ backdropFilter: "blur(12px)" }}
        >
          {/* Header */}
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Color
          </p>

          {/* Color swatches — 4 per row, 4 rows */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {COLOR_THEMES.map((theme) => {
              const isActive = color === theme.id;
              const swatchColor = isDark ? theme.swatchDark : theme.swatch;
              return (
                <button
                  key={theme.id}
                  title={theme.label}
                  aria-label={`Tema ${theme.label}`}
                  aria-pressed={isActive}
                  onClick={() => setColor(theme.id)}
                  className="relative flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-transparent px-2 py-1.5 text-left transition-all hover:border-border hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    outlineColor: swatchColor,
                    borderColor: isActive ? swatchColor : undefined,
                    backgroundColor: isActive ? `${swatchColor}18` : undefined,
                  }}
                >
                  {/* Swatch circle */}
                  <span
                    className="shrink-0 h-8 w-8 rounded-full"
                    style={{
                      backgroundColor: swatchColor,
                      boxShadow: isActive ? `0 0 0 2px var(--background), 0 0 0 4px ${swatchColor}` : undefined,
                    }}
                  />
                  {/* Label */}
                  <span className="flex-1 text-xs font-medium text-foreground truncate">{theme.label}</span>
                  {/* Check */}
                  {isActive && (
                    <svg className="size-3.5 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-3 border-t border-border" />

          {/* Dark / Light toggle */}
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Modo
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme("light")}
              aria-pressed={!isDark}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-colors ${
                !isDark
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Sun className="size-3.5" />
              Claro
            </button>
            <button
              onClick={() => setTheme("dark")}
              aria-pressed={isDark}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-colors ${
                isDark
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Moon className="size-3.5" />
              Oscuro
            </button>
            <button
              onClick={() => setTheme("system")}
              aria-pressed={resolvedTheme === "system"}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-muted py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Auto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
