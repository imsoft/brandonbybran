"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Shop items ─────────────────────────────────────────────────────────────────
/** Crédito a quien propuso la idea del minijuego clicker (panel central). */
const CLICKER_GAME_CREDIT = {
  handle: "@DarkatterDash",
  url: "https://www.youtube.com/@DarkatterDash",
} as const;

/** Crédito a quien propuso la idea de la tienda (también en el encabezado del panel 🛒). */
const CLICKER_SHOP_CREDIT = {
  handle: "@JDFURYEX",
  url: "https://www.youtube.com/@JDFURYEX",
} as const;

const SHOP_ITEMS = [
  { id: "cursor",  name: "Cursor",      emoji: "🖱️",  baseCost: 15,      cps: 0.1,    desc: "Hace clic solo" },
  { id: "grandma", name: "Abuelita",    emoji: "👵",  baseCost: 100,     cps: 0.5,    desc: "Teje clics a crochet" },
  { id: "bot",     name: "Bot",         emoji: "🤖",  baseCost: 500,     cps: 2,      desc: "Clics automatizados" },
  { id: "factory", name: "Fábrica",     emoji: "🏭",  baseCost: 3_000,   cps: 10,     desc: "Produce clics en masa" },
  { id: "lab",     name: "Laboratorio", emoji: "🔬",  baseCost: 20_000,  cps: 60,     desc: "Ciencia aplicada al clic" },
  { id: "mine",    name: "Mina",        emoji: "⛏️",  baseCost: 100_000, cps: 300,    desc: "Extrae clics del subsuelo" },
  { id: "portal",  name: "Portal",      emoji: "🌀",  baseCost: 600_000, cps: 1_500,  desc: "Clics de otras dimensiones" },
] as const;

type ItemId = (typeof SHOP_ITEMS)[number]["id"];
type Upgrades = Record<ItemId, number>;

function emptyUpgrades(): Upgrades {
  return Object.fromEntries(SHOP_ITEMS.map((i) => [i.id, 0])) as Upgrades;
}
function itemCost(baseCost: number, owned: number): number {
  return Math.ceil(baseCost * Math.pow(1.15, owned));
}
function totalCps(upgrades: Upgrades): number {
  return SHOP_ITEMS.reduce((s, item) => s + item.cps * (upgrades[item.id] ?? 0), 0);
}
function fmt(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`;
  return Math.floor(n).toLocaleString();
}

// ── Storage ────────────────────────────────────────────────────────────────────
const STORAGE_TOP      = "brandonbybran-clicker-top10";
const STORAGE_UPGRADES = "brandonbybran-clicker-upgrades";
const TICK_MS = 100;

export type HighScoreEntry = { score: number; dateIso: string };

function loadTopScores(): HighScoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_TOP);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[])
      .filter((e): e is HighScoreEntry =>
        e != null && typeof e === "object" &&
        typeof (e as HighScoreEntry).score === "number" &&
        typeof (e as HighScoreEntry).dateIso === "string"
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  } catch { return []; }
}
function saveTopScores(entries: HighScoreEntry[]): HighScoreEntry[] {
  const sorted = [...entries].sort((a, b) => b.score - a.score).slice(0, 10);
  localStorage.setItem(STORAGE_TOP, JSON.stringify(sorted));
  return sorted;
}
function loadUpgrades(): Upgrades {
  if (typeof window === "undefined") return emptyUpgrades();
  try {
    const raw = localStorage.getItem(STORAGE_UPGRADES);
    if (!raw) return emptyUpgrades();
    const parsed = JSON.parse(raw) as Partial<Upgrades>;
    const base = emptyUpgrades();
    for (const key of Object.keys(base) as ItemId[]) {
      if (typeof parsed[key] === "number") base[key] = parsed[key]!;
    }
    return base;
  } catch { return emptyUpgrades(); }
}
function persistUpgrades(u: Upgrades) {
  localStorage.setItem(STORAGE_UPGRADES, JSON.stringify(u));
}

// ── Popup types ───────────────────────────────────────────────────────────────
type Popup      = { id: string; x: number; y: number; drift: number; hue: number };
type SpendPopup = { id: string; label: string };
function hue(score: number) { return ((score * 360) / 255) % 360; }

// ── Component ──────────────────────────────────────────────────────────────────
export function ClickerGame() {
  const [score,    setScore]    = useState(0);
  const [upgrades, setUpgrades] = useState<Upgrades>(emptyUpgrades);
  const [popups,   setPopups]   = useState<Popup[]>([]);
  const [pulse,    setPulse]    = useState(false);
  const [topScores, setTopScores] = useState<HighScoreEntry[]>([]);
  const [hydrated,  setHydrated]  = useState(false);

  const scoreRef    = useRef(0);
  const upgradesRef = useRef<Upgrades>(emptyUpgrades());
  const areaRef     = useRef<HTMLDivElement>(null);
  const shopRef     = useRef<HTMLDivElement>(null);
  const [spendPopups, setSpendPopups] = useState<SpendPopup[]>([]);
  scoreRef.current    = score;
  upgradesRef.current = upgrades;

  // Hydrate
  useEffect(() => {
    const saved = loadUpgrades();
    setUpgrades(saved);
    upgradesRef.current = saved;
    setTopScores(loadTopScores());
    setHydrated(true);
  }, []);

  // Auto-click tick
  useEffect(() => {
    const id = setInterval(() => {
      const cps = totalCps(upgradesRef.current);
      if (cps <= 0) return;
      setScore((s) => { const n = s + cps * (TICK_MS / 1000); scoreRef.current = n; return n; });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  const commitRun = useCallback((finalScore: number) => {
    if (finalScore < 1) return;
    const entry: HighScoreEntry = { score: Math.floor(finalScore), dateIso: new Date().toISOString() };
    setTopScores(saveTopScores([...loadTopScores(), entry]));
  }, []);

  const handlePointer = useCallback((clientX: number, clientY: number) => {
    const el = areaRef.current;
    if (!el) return;
    const rect  = el.getBoundingClientRect();
    const x     = clientX - rect.left;
    const y     = clientY - rect.top;
    const drift = (Math.random() - 0.5) * 24;
    const popupId   = crypto.randomUUID();
    const nextScore = scoreRef.current + 1;

    // Keep these as independent updates — never nest setState inside an updater
    // (React Strict Mode runs updaters twice, which would duplicate the UUID)
    scoreRef.current = nextScore;
    setScore(nextScore);
    setPopups((p) => [...p, { id: popupId, x, y, drift, hue: hue(nextScore) }]);
    setPulse(true);
    window.setTimeout(() => setPulse(false), 120);
  }, []);

  const removePopup = useCallback((id: string) => setPopups((p) => p.filter((i) => i.id !== id)), []);

  const handleReset = useCallback(() => {
    commitRun(scoreRef.current);
    setScore(0); scoreRef.current = 0; setPopups([]);
  }, [commitRun]);

  const handleBuy = useCallback((itemId: ItemId) => {
    const item  = SHOP_ITEMS.find((i) => i.id === itemId)!;
    const owned = upgradesRef.current[itemId] ?? 0;
    const cost  = itemCost(item.baseCost, owned);

    if (scoreRef.current < cost) return;

    const newScore    = scoreRef.current - cost;
    const newUpgrades = { ...upgradesRef.current, [itemId]: owned + 1 };

    scoreRef.current    = newScore;
    upgradesRef.current = newUpgrades;

    setScore(newScore);
    setUpgrades(newUpgrades);
    persistUpgrades(newUpgrades);

    // Show spend feedback so the user sees it's a payment, not a reset
    const spendId = crypto.randomUUID();
    setSpendPopups((p) => [...p, { id: spendId, label: `−${fmt(cost)}` }]);
    setTimeout(() => setSpendPopups((p) => p.filter((s) => s.id !== spendId)), 900);
  }, []);

  const cps         = totalCps(upgrades);
  const displayFmt  = fmt(score);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-background font-sans">
      <main className="flex w-full flex-1 flex-col gap-6 px-4 pb-10 pt-6
                       md:grid md:grid-cols-[240px_1fr_240px] md:items-start md:gap-4 md:px-6 md:pt-5
                       lg:grid-cols-[280px_1fr_280px]">

        {/* ── Top Scores ─────────────────────────────────────────────────── */}
        <section className="order-3 w-full md:order-none md:sticky md:top-5" aria-labelledby="top-scores-heading">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle id="top-scores-heading" className="text-sm">
                🏆 Top 10 puntajes
                {!hydrated && <span className="ml-2 text-xs font-normal text-muted-foreground">(cargando…)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topScores.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay registros. Juega y pulsa Reiniciar para guardar.</p>
              ) : (
                <ol className="space-y-1.5">
                  {topScores.map((entry, i) => (
                    <li key={`${entry.dateIso}-${i}`} className="flex flex-col gap-0.5 rounded-lg bg-muted px-3 py-2 text-sm">
                      <span className="font-mono font-semibold tabular-nums text-foreground">
                        #{i + 1} · {entry.score.toLocaleString()} pts
                      </span>
                      <time className="text-xs text-muted-foreground" dateTime={entry.dateIso}>
                        {new Date(entry.dateIso).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}
                      </time>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ── Clicker ────────────────────────────────────────────────────── */}
        <div className="order-1 flex flex-col items-center justify-center md:order-none md:min-h-[calc(100dvh-5rem)]">
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link href="/">← Volver</Link>
          </Button>
          <p className="mb-3 max-w-md px-2 text-center font-mono text-[10px] leading-tight text-muted-foreground">
            Idea del clicker:{" "}
            <a
              href={CLICKER_GAME_CREDIT.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/90 underline-offset-2 hover:text-primary hover:underline"
            >
              {CLICKER_GAME_CREDIT.handle}
            </a>
          </p>

          {/* Score */}
          <output
            className={`mb-1 w-full max-w-md text-center text-5xl font-bold tabular-nums tracking-tight text-foreground transition-transform duration-150 sm:text-6xl ${pulse ? "scale-110" : "scale-100"}`}
            aria-live="polite"
          >
            {displayFmt}
          </output>

          {/* CPS badge */}
          <div className="mb-5 h-6 flex items-center">
            {cps > 0 ? (
              <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
                ⚡ {cps < 1 ? cps.toFixed(1) : fmt(cps)} clics/seg
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Toca el alien para ganar clics</span>
            )}
          </div>

          {/* Clicker button */}
          <div ref={areaRef} className="relative flex w-full max-w-md min-h-[280px] shrink-0 items-center justify-center sm:min-h-[340px]">
            {popups.map(({ id, x, y, drift, hue: h }) => (
              <span
                key={id}
                className="pointer-events-none absolute z-20 text-xl font-bold clicker-float-up"
                style={{ left: x, top: y, "--drift": `${drift}px`, color: `hsl(${h} 88% 52%)`, textShadow: `0 0 16px hsl(${h} 88% 55% / 0.5)` } as CSSProperties & { "--drift": string }}
                onAnimationEnd={() => removePopup(id)}
              >+1</span>
            ))}
            <button
              type="button"
              className="clicker-emoji-btn relative z-0 flex h-64 w-64 select-none items-center justify-center rounded-full border-2 border-border bg-card text-[9rem] hover:border-ring focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:h-80 sm:w-80 sm:text-[11rem]"
              onPointerDown={(e) => {
                const el = e.currentTarget;
                el.classList.remove("clicker-emoji-btn-shadow-hit");
                void el.offsetWidth;
                el.classList.add("clicker-emoji-btn-shadow-hit");
                el.setPointerCapture(e.pointerId);
                handlePointer(e.clientX, e.clientY);
              }}
              onAnimationEnd={(e) => {
                if (e.animationName !== "clicker-btn-shadow-pop") return;
                e.currentTarget.classList.remove("clicker-emoji-btn-shadow-hit");
              }}
              aria-label="Sumar un punto tocando el alien"
            >
              <span className="leading-none" aria-hidden>👾</span>
            </button>
          </div>

          {/* Reset */}
          <Button type="button" variant="outline" size="icon" onClick={handleReset} className="mt-5 rounded-full" aria-label="Reiniciar" title="Reiniciar y guardar puntaje">
            <RotateCcw className="size-5" aria-hidden />
          </Button>
          <p className="mt-1 text-[10px] text-muted-foreground">Reiniciar guarda tu puntaje · las mejoras se conservan</p>
        </div>

        {/* ── Shop ───────────────────────────────────────────────────────── */}
        <section className="order-2 w-full md:order-none md:sticky md:top-5" aria-labelledby="shop-heading">
          {/* Spend popups — float up from here */}
          <div ref={shopRef} className="relative">
            {spendPopups.map((sp) => (
              <div
                key={sp.id}
                className="pointer-events-none absolute left-1/2 top-0 z-50 -translate-x-1/2 font-mono text-lg font-bold text-destructive clicker-float-up"
                style={{ "--drift": "0px" } as React.CSSProperties & { "--drift": string }}
              >
                {sp.label}
              </div>
            ))}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle id="shop-heading" className="text-sm">🛒 Tienda</CardTitle>
              <p className="mt-1.5 font-mono text-[10px] leading-tight text-muted-foreground">
                Idea de la tienda:{" "}
                <a
                  href={CLICKER_SHOP_CREDIT.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/90 underline-offset-2 hover:text-primary hover:underline"
                >
                  {CLICKER_SHOP_CREDIT.handle}
                </a>
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {SHOP_ITEMS.map((item) => {
                const owned   = upgrades[item.id] ?? 0;
                const cost    = itemCost(item.baseCost, owned);
                const canAfford = score >= cost;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleBuy(item.id)}
                    disabled={!canAfford}
                    aria-label={`Comprar ${item.name} por ${fmt(cost)} clics`}
                    className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all
                      ${canAfford
                        ? "border-border bg-background hover:border-primary hover:bg-primary/5 active:scale-[0.98]"
                        : "border-border/50 bg-muted/40 opacity-60 cursor-not-allowed"
                      }`}
                  >
                    {/* Emoji */}
                    <span className="text-2xl leading-none shrink-0">{item.emoji}</span>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-sm font-semibold text-foreground truncate">{item.name}</span>
                        {owned > 0 && (
                          <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                            ×{owned}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="text-[10px] text-muted-foreground truncate">{item.desc}</span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{item.cps}/s</span>
                      </div>
                    </div>

                    {/* Cost */}
                    <div className={`shrink-0 text-right text-xs font-bold tabular-nums ${canAfford ? "text-primary" : "text-muted-foreground"}`}>
                      {fmt(cost)}
                      <span className="block text-[9px] font-normal text-muted-foreground">clics</span>
                    </div>
                  </button>
                );
              })}

              {/* Total CPS summary */}
              {cps > 0 && (
                <div className="mt-1 rounded-lg bg-muted px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">Total automático</p>
                  <p className="font-mono text-sm font-bold text-foreground">
                    {cps < 1 ? cps.toFixed(1) : fmt(cps)} <span className="font-normal text-muted-foreground">clics/seg</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          </div>{/* end shopRef */}
        </section>

      </main>
    </div>
  );
}
