"use client";

import { useRef, useEffect, useCallback } from "react";
import Link from "next/link";

// Logical game resolution (all game logic uses these coordinates)
const GAME_W = 800;
const GAME_H = 500;
const PADDLE_W = 12;
const PADDLE_H = 80;
const BALL_SIZE = 10;
const PADDLE_SPEED = 6;
const BALL_SPEED_INITIAL = 5;
const WINNING_SCORE = 7;

interface GameState {
  ballX: number;
  ballY: number;
  ballDX: number;
  ballDY: number;
  paddle1Y: number;
  paddle2Y: number;
  score1: number;
  score2: number;
  paused: boolean;
  winner: string | null;
}

function createInitialState(): GameState {
  return {
    ballX: GAME_W / 2,
    ballY: GAME_H / 2,
    ballDX: BALL_SPEED_INITIAL * (Math.random() > 0.5 ? 1 : -1),
    ballDY: BALL_SPEED_INITIAL * (Math.random() * 0.6 - 0.3),
    paddle1Y: GAME_H / 2 - PADDLE_H / 2,
    paddle2Y: GAME_H / 2 - PADDLE_H / 2,
    score1: 0,
    score2: 0,
    paused: true,
    winner: null,
  };
}

function resetBall(state: GameState): void {
  state.ballX = GAME_W / 2;
  state.ballY = GAME_H / 2;
  state.ballDX = BALL_SPEED_INITIAL * (state.ballDX > 0 ? -1 : 1);
  state.ballDY = BALL_SPEED_INITIAL * (Math.random() * 0.6 - 0.3);
}

export default function PingPongPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const keysRef = useRef<Set<string>>(new Set());
  const animRef = useRef<number>(0);

  // Resize canvas to fit container while keeping aspect ratio
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const maxW = container.clientWidth;
    const maxH = window.innerHeight * 0.55;
    const aspect = GAME_W / GAME_H;

    let w = maxW;
    let h = w / aspect;
    if (h > maxH) {
      h = maxH;
      w = h * aspect;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${Math.round(w)}px`;
    canvas.style.height = `${Math.round(h)}px`;
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    const canvas = ctx.canvas;
    const scaleX = canvas.width / GAME_W;
    const scaleY = canvas.height / GAME_H;

    ctx.save();
    ctx.scale(scaleX, scaleY);

    // Background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, GAME_W, GAME_H);

    // Dotted center line
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(GAME_W / 2, 0);
    ctx.lineTo(GAME_W / 2, GAME_H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Scores
    ctx.fillStyle = "#fff";
    ctx.font = "48px monospace";
    ctx.textAlign = "center";
    ctx.fillText(String(state.score1), GAME_W / 2 - 60, 60);
    ctx.fillText(String(state.score2), GAME_W / 2 + 60, 60);

    // Paddles
    ctx.fillStyle = "#fff";
    ctx.fillRect(20, state.paddle1Y, PADDLE_W, PADDLE_H);
    ctx.fillRect(GAME_W - 20 - PADDLE_W, state.paddle2Y, PADDLE_W, PADDLE_H);

    // Ball
    ctx.fillRect(
      state.ballX - BALL_SIZE / 2,
      state.ballY - BALL_SIZE / 2,
      BALL_SIZE,
      BALL_SIZE
    );

    // Winner overlay
    if (state.winner) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      ctx.fillStyle = "#fff";
      ctx.font = "36px monospace";
      ctx.fillText(`${state.winner} gana!`, GAME_W / 2, GAME_H / 2 - 20);
      ctx.font = "18px monospace";
      ctx.fillText("Toca o presiona ESPACIO", GAME_W / 2, GAME_H / 2 + 30);
    } else if (state.paused) {
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      ctx.fillStyle = "#fff";
      ctx.font = "22px monospace";
      ctx.fillText("Toca o presiona ESPACIO", GAME_W / 2, GAME_H / 2 - 10);
      ctx.font = "16px monospace";
      ctx.fillText("J1: W/S — J2: ↑/↓", GAME_W / 2, GAME_H / 2 + 25);
    }

    ctx.restore();
  }, []);

  const update = useCallback((state: GameState, keys: Set<string>) => {
    if (state.paused || state.winner) return;

    // Move paddles
    if (keys.has("w") || keys.has("W")) state.paddle1Y = Math.max(0, state.paddle1Y - PADDLE_SPEED);
    if (keys.has("s") || keys.has("S")) state.paddle1Y = Math.min(GAME_H - PADDLE_H, state.paddle1Y + PADDLE_SPEED);
    if (keys.has("ArrowUp")) state.paddle2Y = Math.max(0, state.paddle2Y - PADDLE_SPEED);
    if (keys.has("ArrowDown")) state.paddle2Y = Math.min(GAME_H - PADDLE_H, state.paddle2Y + PADDLE_SPEED);

    // Touch controls (mapped to same keys)
    if (keys.has("_p1up")) state.paddle1Y = Math.max(0, state.paddle1Y - PADDLE_SPEED);
    if (keys.has("_p1down")) state.paddle1Y = Math.min(GAME_H - PADDLE_H, state.paddle1Y + PADDLE_SPEED);
    if (keys.has("_p2up")) state.paddle2Y = Math.max(0, state.paddle2Y - PADDLE_SPEED);
    if (keys.has("_p2down")) state.paddle2Y = Math.min(GAME_H - PADDLE_H, state.paddle2Y + PADDLE_SPEED);

    // Move ball
    state.ballX += state.ballDX;
    state.ballY += state.ballDY;

    // Top/bottom bounce
    if (state.ballY - BALL_SIZE / 2 <= 0 || state.ballY + BALL_SIZE / 2 >= GAME_H) {
      state.ballDY *= -1;
      state.ballY = Math.max(BALL_SIZE / 2, Math.min(GAME_H - BALL_SIZE / 2, state.ballY));
    }

    // Left paddle collision
    if (
      state.ballX - BALL_SIZE / 2 <= 20 + PADDLE_W &&
      state.ballX - BALL_SIZE / 2 >= 20 &&
      state.ballY >= state.paddle1Y &&
      state.ballY <= state.paddle1Y + PADDLE_H
    ) {
      const hitPos = (state.ballY - state.paddle1Y) / PADDLE_H - 0.5;
      state.ballDX = Math.abs(state.ballDX) * 1.05;
      state.ballDY = hitPos * 8;
      state.ballX = 20 + PADDLE_W + BALL_SIZE / 2;
    }

    // Right paddle collision
    if (
      state.ballX + BALL_SIZE / 2 >= GAME_W - 20 - PADDLE_W &&
      state.ballX + BALL_SIZE / 2 <= GAME_W - 20 &&
      state.ballY >= state.paddle2Y &&
      state.ballY <= state.paddle2Y + PADDLE_H
    ) {
      const hitPos = (state.ballY - state.paddle2Y) / PADDLE_H - 0.5;
      state.ballDX = -Math.abs(state.ballDX) * 1.05;
      state.ballDY = hitPos * 8;
      state.ballX = GAME_W - 20 - PADDLE_W - BALL_SIZE / 2;
    }

    // Score
    if (state.ballX < 0) {
      state.score2++;
      if (state.score2 >= WINNING_SCORE) {
        state.winner = "Jugador 2";
      } else {
        resetBall(state);
      }
    }
    if (state.ballX > GAME_W) {
      state.score1++;
      if (state.score1 >= WINNING_SCORE) {
        state.winner = "Jugador 1";
      } else {
        resetBall(state);
      }
    }
  }, []);

  // Toggle pause / restart on canvas tap
  const handleCanvasTap = useCallback(() => {
    const s = stateRef.current;
    if (s.winner) {
      stateRef.current = createInitialState();
      stateRef.current.paused = false;
    } else {
      s.paused = !s.paused;
    }
  }, []);

  // Touch button helpers
  const holdKey = useCallback((key: string) => {
    keysRef.current.add(key);
  }, []);
  const releaseKey = useCallback((key: string) => {
    keysRef.current.delete(key);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", " "].includes(e.key)) e.preventDefault();

      if (e.key === " ") {
        handleCanvasTap();
        return;
      }
      keysRef.current.add(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const loop = () => {
      update(stateRef.current, keysRef.current);
      draw(ctx, stateRef.current);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [draw, update, resizeCanvas, handleCanvasTap]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-black px-4 font-mono">
      <Link
        href="/"
        className="text-sm text-zinc-500 transition hover:text-zinc-300"
      >
        ← Volver
      </Link>
      <h1 className="text-xl font-bold text-white sm:text-2xl">Ping Pong</h1>

      <div ref={containerRef} className="w-full max-w-[800px]">
        <canvas
          ref={canvasRef}
          className="rounded border border-zinc-800"
          onPointerUp={handleCanvasTap}
        />
      </div>

      {/* Touch controls: visible on small screens only */}
      <div className="flex w-full max-w-[800px] justify-between gap-4 sm:hidden">
        {/* Player 1 controls */}
        <div className="flex gap-2">
          <button
            className="select-none rounded-lg bg-zinc-800 px-5 py-4 text-lg font-bold text-white active:bg-zinc-600"
            onTouchStart={() => holdKey("_p1up")}
            onTouchEnd={() => releaseKey("_p1up")}
            onTouchCancel={() => releaseKey("_p1up")}
          >
            ▲
          </button>
          <button
            className="select-none rounded-lg bg-zinc-800 px-5 py-4 text-lg font-bold text-white active:bg-zinc-600"
            onTouchStart={() => holdKey("_p1down")}
            onTouchEnd={() => releaseKey("_p1down")}
            onTouchCancel={() => releaseKey("_p1down")}
          >
            ▼
          </button>
        </div>

        {/* Player 2 controls */}
        <div className="flex gap-2">
          <button
            className="select-none rounded-lg bg-zinc-800 px-5 py-4 text-lg font-bold text-white active:bg-zinc-600"
            onTouchStart={() => holdKey("_p2up")}
            onTouchEnd={() => releaseKey("_p2up")}
            onTouchCancel={() => releaseKey("_p2up")}
          >
            ▲
          </button>
          <button
            className="select-none rounded-lg bg-zinc-800 px-5 py-4 text-lg font-bold text-white active:bg-zinc-600"
            onTouchStart={() => holdKey("_p2down")}
            onTouchEnd={() => releaseKey("_p2down")}
            onTouchCancel={() => releaseKey("_p2down")}
          >
            ▼
          </button>
        </div>
      </div>

      {/* Keyboard instructions: visible on large screens only */}
      <p className="hidden text-sm text-zinc-500 sm:block">
        J1: W/S — J2: ↑/↓ — ESPACIO: pausar
      </p>
    </div>
  );
}
