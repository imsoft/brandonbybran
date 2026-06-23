// ── Color theme definitions ───────────────────────────────────────────────────
// Each entry maps to a [data-color="X"] CSS block in globals.css

export interface ColorTheme {
  id: string;       // value of data-color attribute
  label: string;    // display name
  swatch: string;   // CSS color for the swatch circle (Tailwind 500 in light)
  swatchDark: string; // CSS color for dark mode swatch (Tailwind 400)
}

export const COLOR_THEMES: ColorTheme[] = [
  { id: "zinc",    label: "Zinc",    swatch: "#71717a", swatchDark: "#a1a1aa" },
  { id: "slate",   label: "Slate",   swatch: "#64748b", swatchDark: "#94a3b8" },
  { id: "red",     label: "Red",     swatch: "#ef4444", swatchDark: "#f87171" },
  { id: "orange",  label: "Orange",  swatch: "#f97316", swatchDark: "#fb923c" },
  { id: "amber",   label: "Amber",   swatch: "#d97706", swatchDark: "#fbbf24" },
  { id: "yellow",  label: "Yellow",  swatch: "#ca8a04", swatchDark: "#facc15" },
  { id: "green",   label: "Green",   swatch: "#16a34a", swatchDark: "#4ade80" },
  { id: "emerald", label: "Emerald", swatch: "#059669", swatchDark: "#34d399" },
  { id: "teal",    label: "Teal",    swatch: "#0d9488", swatchDark: "#2dd4bf" },
  { id: "cyan",    label: "Cyan",    swatch: "#0891b2", swatchDark: "#22d3ee" },
  { id: "sky",     label: "Sky",     swatch: "#0284c7", swatchDark: "#38bdf8" },
  { id: "blue",    label: "Blue",    swatch: "#2563eb", swatchDark: "#60a5fa" },
  { id: "indigo",  label: "Indigo",  swatch: "#4f46e5", swatchDark: "#818cf8" },
  { id: "violet",  label: "Violet",  swatch: "#7c3aed", swatchDark: "#a78bfa" },
  { id: "purple",  label: "Purple",  swatch: "#9333ea", swatchDark: "#c084fc" },
  { id: "rose",    label: "Rose",    swatch: "#e11d48", swatchDark: "#fb7185" },
];

export const DEFAULT_COLOR = "zinc";
