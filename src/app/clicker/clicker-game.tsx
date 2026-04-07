"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

const STORAGE_TOP = "brandonbybran-clicker-top10";

const CLICKER_EMOJI = "👾";

type Popup = { id: string; x: number; y: number; drift: number; hue: number };

type GameState = { score: number; popups: Popup[] };

/** Recorre el matiz 0°→360° de forma gradual; cada 255 puntos completa un ciclo (como 0–255 en RGB). */
function hueForScore(score: number): number {
  return ((score * 360) / 255) % 360;
}

export type HighScoreEntry = {
  score: number;
  dateIso: string;
};

function loadTopScores(): HighScoreEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_TOP);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is HighScoreEntry =>
          e != null &&
          typeof e === "object" &&
          typeof (e as HighScoreEntry).score === "number" &&
          typeof (e as HighScoreEntry).dateIso === "string"
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  } catch {
    return [];
  }
}

function saveTopScores(entries: HighScoreEntry[]) {
  const sorted = [...entries].sort((a, b) => b.score - a.score).slice(0, 10);
  localStorage.setItem(STORAGE_TOP, JSON.stringify(sorted));
  return sorted;
}

const initialGame: GameState = { score: 0, popups: [] };

export function ClickerGame() {
  const [game, setGame] = useState<GameState>(initialGame);
  const [pulse, setPulse] = useState(false);
  const [topScores, setTopScores] = useState<HighScoreEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef(0);
  scoreRef.current = game.score;

  useEffect(() => {
    setTopScores(loadTopScores());
    setHydrated(true);
  }, []);

  const commitRun = useCallback((finalScore: number) => {
    if (finalScore <= 0) return;
    const entry: HighScoreEntry = {
      score: finalScore,
      dateIso: new Date().toISOString(),
    };
    const merged = [...loadTopScores(), entry];
    const next = saveTopScores(merged);
    setTopScores(next);
  }, []);

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = areaRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const drift = (Math.random() - 0.5) * 24;
      const popupId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `p-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

      setGame((g) => {
        const next = g.score + 1;
        return {
          score: next,
          popups: [
            ...g.popups,
            { id: popupId, x, y, drift, hue: hueForScore(next) },
          ],
        };
      });
      setPulse(true);
      window.setTimeout(() => setPulse(false), 120);
    },
    []
  );

  const removePopup = useCallback((id: string) => {
    setGame((g) => ({
      ...g,
      popups: g.popups.filter((item) => item.id !== id),
    }));
  }, []);

  const handleReset = useCallback(() => {
    commitRun(scoreRef.current);
    setGame(initialGame);
  }, [commitRun]);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Inicio
        </Link>
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Clicker
        </span>
        <button
          type="button"
          onClick={handleReset}
          className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Reiniciar
        </button>
      </header>

      <main className="relative flex w-full flex-1 flex-col gap-6 px-4 pb-10 pt-4 md:min-h-0 md:px-6 md:pt-3">
        <section
          className="order-2 mx-auto w-full max-w-sm shrink-0 text-left md:order-none md:mx-0 md:absolute md:left-6 md:top-3 md:z-20 md:w-72 md:max-w-none md:overflow-y-auto md:max-h-[min(70dvh,calc(100dvh-5.5rem))] lg:left-8 lg:top-3 lg:w-80"
          aria-labelledby="top-scores-heading"
        >
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-900">
            <h2
              id="top-scores-heading"
              className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Top 10 mejores puntajes
              {!hydrated && (
                <span className="ml-2 text-xs font-normal text-zinc-400">(cargando…)</span>
              )}
            </h2>
            {topScores.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Aún no hay registros. Juega y pulsa Reiniciar para guardar tu puntaje con fecha.
              </p>
            ) : (
              <ol className="space-y-2">
                {topScores.map((entry, index) => (
                  <li
                    key={`${entry.dateIso}-${entry.score}-${index}`}
                    className="flex flex-col items-start gap-0.5 rounded-lg bg-zinc-50 px-3 py-2 text-left text-sm dark:bg-zinc-950"
                  >
                    <span className="font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                      #{index + 1} · {entry.score.toLocaleString()} pts
                    </span>
                    <time
                      className="text-xs text-zinc-500 dark:text-zinc-400"
                      dateTime={entry.dateIso}
                    >
                      {new Date(entry.dateIso).toLocaleString("es", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        <div className="order-1 flex min-h-0 w-full flex-1 flex-col items-center justify-center md:order-none md:min-h-[calc(100dvh-5.5rem)]">
          <div className="mb-2 flex w-full max-w-md flex-col items-center">
            <div className="flex items-center justify-center gap-2 text-center">
              <p className="text-sm uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Puntaje
              </p>
              <div className="group relative inline-flex">
                <button
                  type="button"
                  id="clicker-help-trigger"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    setHelpOpen((prev) => !prev);
                  }}
                  aria-expanded={helpOpen}
                  aria-describedby="clicker-help-panel"
                  className="inline-flex size-8 shrink-0 cursor-help items-center justify-center rounded-full border border-zinc-300 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  aria-label="Cómo funciona el clicker (pasa el cursor o enfoca para ver la ayuda)"
                >
                  <svg
                    className="size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                </button>
                <div className="fixed left-1/2 top-[7.25rem] z-40 flex -translate-x-1/2 flex-col items-center pt-1 md:absolute md:left-1/2 md:top-full">
                  <div className="h-2 w-20 shrink-0" aria-hidden />
                  <div
                    id="clicker-help-panel"
                    role="tooltip"
                    className={`w-[min(calc(100vw-2rem),22rem)] rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-center text-sm leading-relaxed text-zinc-600 shadow-lg transition-[opacity,visibility] duration-150 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 ${
                      helpOpen
                        ? "visible pointer-events-auto opacity-100"
                        : "pointer-events-none invisible opacity-0 md:group-hover:visible md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-focus-within:visible md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100"
                    }`}
                  >
                    Toca el alien 👾 para sumar. El{" "}
                    <strong className="text-zinc-800 dark:text-zinc-100">+1</strong> sube hacia arriba.{" "}
                    <strong className="text-zinc-800 dark:text-zinc-100">Reiniciar</strong> guarda esta
                    partida en el top 10 si aplica.
                  </div>
                </div>
              </div>
            </div>
          </div>
          <output
            className={`mb-6 w-full max-w-md text-center font-mono text-5xl font-bold tabular-nums tracking-tight text-zinc-900 transition-transform duration-150 dark:text-zinc-50 sm:text-6xl ${pulse ? "scale-110" : "scale-100"}`}
            aria-live="polite"
          >
            {game.score.toLocaleString()}
          </output>

          <div
            ref={areaRef}
            className="relative flex w-full max-w-md min-h-[280px] shrink-0 items-center justify-center sm:min-h-[360px]"
          >
            {game.popups.map(({ id, x, y, drift, hue }) => (
              <span
                key={id}
                className="pointer-events-none absolute z-20 text-xl font-bold clicker-float-up"
                style={
                  {
                    left: x,
                    top: y,
                    "--drift": `${drift}px`,
                    color: `hsl(${hue} 88% 52%)`,
                    textShadow: `0 0 16px hsl(${hue} 88% 55% / 0.5), 0 1px 2px rgb(0 0 0 / 0.2)`,
                  } as CSSProperties & { "--drift": string }
                }
                onAnimationEnd={() => removePopup(id)}
              >
                +1
              </span>
            ))}

            <button
              type="button"
              className="clicker-emoji-btn relative z-0 flex h-72 w-72 max-w-[min(100vw-2rem,24rem)] max-h-[min(100vw-2rem,24rem)] select-none items-center justify-center rounded-full border-2 border-zinc-200 bg-white text-[10rem] hover:border-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-400 min-[480px]:h-80 min-[480px]:w-80 min-[480px]:max-w-[min(100vw-2rem,26rem)] min-[480px]:max-h-[min(100vw-2rem,26rem)] min-[480px]:text-[11rem] dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-500 sm:h-96 sm:w-96 sm:max-w-none sm:max-h-none sm:text-[12rem]"
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
              <span className="leading-none" aria-hidden>
                {CLICKER_EMOJI}
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
