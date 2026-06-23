"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// ── Constants ──────────────────────────────────────────────────────────────────
/** Crédito a quien propuso la idea del minijuego (también en overlay y cabecera). */
const LASER_IDEA_CREDIT = {
  handle: "@rukieleven",
  url: "https://www.youtube.com/@rukieleven",
} as const;

const GW = 800, GH = 550;
const PR = 10, PSPD = 3.2;
const LRANGE = 760, LMAX = 100, OH_MS = 2600, VIS_R = 165;
const EX = 715, EY = 85, ER = 24;
const INV_MS = 1500, MAX_ENE = 18;

type Phase = "start" | "playing" | "gameover" | "escaped";
type ETypeIdx = 0 | 1 | 2;
type Difficulty = "easy" | "normal" | "hard";

interface DiffCfg { spawnBase: number; spdMult: number; ldrain: number; lregen: number; maxHp: number; killsReq: number; chargeMs: number }
const DIFF: Record<Difficulty, DiffCfg> = {
  easy:   { spawnBase: 5500, spdMult: 0.70, ldrain: 16, lregen: 24, maxHp: 4, killsReq:  8, chargeMs: 2500 },
  normal: { spawnBase: 4000, spdMult: 1.00, ldrain: 28, lregen: 15, maxHp: 3, killsReq: 12, chargeMs: 3500 },
  hard:   { spawnBase: 2500, spdMult: 1.45, ldrain: 38, lregen:  8, maxHp: 2, killsReq: 18, chargeMs: 5000 },
};

// [radius, speed, hp, msToKill, eyeColor, particleColor]
const ETYPES = [
  { r: 20, spd: 1.1, kt: 2000, eye: "#ff2222", pcol: "#880000" }, // Shadow
  { r: 14, spd: 2.2, kt:  900, eye: "#ff8800", pcol: "#553300" }, // Crawler
  { r:  9, spd: 3.6, kt:  450, eye: "#cc00ff", pcol: "#440066" }, // Specter
] as const;

interface Enemy { id: number; x: number; y: number; r: number; spd: number; type: ETypeIdx; damage: number; flash: number }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; r: number; color: string }
interface GState {
  phase: Phase; px: number; py: number; hp: number; maxHp: number; inv: number;
  enemies: Enemy[]; parts: Particle[];
  angle: number; firing: boolean; energy: number; overheat: boolean; ohTimer: number;
  score: number; kills: number; spawnT: number; nextId: number; shake: number;
  diff: Difficulty;
  exitUnlocked: boolean; exitCharge: number; killsReq: number; chargeMax: number; exitFlash: number;
}

function mkState(diff: Difficulty): GState {
  const cfg = DIFF[diff];
  return {
    phase: "start", px: 90, py: 460, hp: cfg.maxHp, maxHp: cfg.maxHp, inv: 0,
    enemies: [], parts: [], angle: -Math.PI / 4,
    firing: false, energy: LMAX, overheat: false, ohTimer: 0,
    score: 0, kills: 0, spawnT: cfg.spawnBase, nextId: 0, shake: 0, diff,
    exitUnlocked: false, exitCharge: 0, killsReq: cfg.killsReq, chargeMax: cfg.chargeMs, exitFlash: 0,
  };
}

function spawnEnemy(s: GState): void {
  if (s.enemies.length >= MAX_ENE) return;
  const edge = Math.floor(Math.random() * 4);
  let x = 0, y = 0;
  if      (edge === 0) { x = Math.random() * GW; y = -35; }
  else if (edge === 1) { x = GW + 35; y = Math.random() * GH; }
  else if (edge === 2) { x = Math.random() * GW; y = GH + 35; }
  else                 { x = -35; y = Math.random() * GH; }
  let type: ETypeIdx = 0;
  if      (s.kills >= 20) { const r = Math.random(); type = r < 0.35 ? 0 : r < 0.65 ? 1 : 2; }
  else if (s.kills >=  8) { type = Math.random() < 0.55 ? 0 : 1; }
  const d = ETYPES[type], mult = DIFF[s.diff].spdMult;
  s.enemies.push({ id: s.nextId++, x, y, r: d.r, spd: d.spd * mult, type, damage: 0, flash: 0 });
}

function laserHits(px: number, py: number, ang: number, ex: number, ey: number, er: number): boolean {
  const dx = ex - px, dy = ey - py;
  const t = dx * Math.cos(ang) + dy * Math.sin(ang);
  if (t < 0 || t > LRANGE) return false;
  return Math.abs(dx * Math.sin(ang) - dy * Math.cos(ang)) <= er + 3;
}

function burst(s: GState, x: number, y: number, color: string): void {
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2, spd = Math.random() * 3.5 + 0.5;
    s.parts.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
      life: 1, maxLife: 350 + Math.random() * 450, r: Math.random() * 4 + 2, color });
    if (s.parts.length > 120) s.parts.shift();
  }
}

function update(s: GState, dt: number, mx: number, my: number, keys: Set<string>): void {
  if (s.phase !== "playing") return;
  const dtS = dt / 1000;
  const cfg = DIFF[s.diff];

  s.shake = Math.max(0, s.shake - dtS * 5);
  s.angle = Math.atan2(my - s.py, mx - s.px);

  // Laser energy management
  if (!s.overheat) {
    if (s.firing) {
      s.energy -= cfg.ldrain * dtS;
      if (s.energy <= 0) { s.energy = 0; s.overheat = true; s.ohTimer = OH_MS; }
    } else {
      s.energy = Math.min(LMAX, s.energy + cfg.lregen * dtS);
    }
  } else {
    s.ohTimer -= dt;
    if (s.ohTimer <= 0) { s.overheat = false; s.energy = LMAX * 0.35; }
  }

  // Movement — works independently from mouse/firing
  let vx = 0, vy = 0;
  if (keys.has("ArrowUp")    || keys.has("w") || keys.has("W")) vy -= 1;
  if (keys.has("ArrowDown")  || keys.has("s") || keys.has("S")) vy += 1;
  if (keys.has("ArrowLeft")  || keys.has("a") || keys.has("A")) vx -= 1;
  if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) vx += 1;
  if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
  s.px = Math.max(PR, Math.min(GW - PR, s.px + vx * PSPD));
  s.py = Math.max(PR, Math.min(GH - PR, s.py + vy * PSPD));

  // Spawning
  s.spawnT -= dt;
  if (s.spawnT <= 0) {
    spawnEnemy(s);
    s.spawnT = Math.max(1000, cfg.spawnBase - s.kills * 80);
  }

  // Exit unlock
  if (!s.exitUnlocked && s.kills >= s.killsReq) {
    s.exitUnlocked = true;
    s.exitFlash = 1;
  }
  if (s.exitFlash > 0) s.exitFlash = Math.max(0, s.exitFlash - dtS * 0.8);

  // Exit charge (player must stand inside for chargeMax ms)
  const distToExit = Math.hypot(EX - s.px, EY - s.py);
  const playerInExit = s.exitUnlocked && distToExit < PR + ER;
  if (playerInExit) {
    s.exitCharge += dt;
    if (s.exitCharge >= s.chargeMax) { s.phase = "escaped"; return; }
  } else {
    // Drain slowly if player steps out
    s.exitCharge = Math.max(0, s.exitCharge - dt * 1.5);
  }

  // Enemies speed up when player is charging the exit (they sense it)
  const exitPanic = s.exitUnlocked && distToExit < ER * 6;
  const spdBoost = exitPanic ? 1.5 : 1.0;

  // Enemies
  const canFire = s.firing && !s.overheat;
  const dead: number[] = [];
  for (const e of s.enemies) {
    const dx = s.px - e.x, dy = s.py - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const effSpd = e.spd * spdBoost;
    if (dist > 0.1) { e.x += (dx / dist) * effSpd * dtS * 60; e.y += (dy / dist) * effSpd * dtS * 60; }
    e.flash = Math.max(0, e.flash - dtS * 4);

    if (canFire && laserHits(s.px, s.py, s.angle, e.x, e.y, e.r)) {
      e.damage += dt / ETYPES[e.type].kt;
      e.flash = 1;
    }
    if (e.damage >= 1) { dead.push(e.id); continue; }

    if (s.inv <= 0 && dist < PR + e.r) {
      s.hp--;
      s.inv = INV_MS;
      s.shake = 1;
      if (s.hp <= 0) { s.phase = "gameover"; return; }
    }
  }

  for (const id of dead) {
    const e = s.enemies.find(en => en.id === id)!;
    burst(s, e.x, e.y, ETYPES[e.type].pcol);
    s.score += (e.type + 1) * 10;
    s.kills++;
  }
  s.enemies = s.enemies.filter(e => !dead.includes(e.id));

  for (const p of s.parts) {
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.93; p.vy *= 0.93;
    p.life = Math.max(0, p.life - dt / p.maxLife);
  }
  s.parts = s.parts.filter(p => p.life > 0);

  if (s.inv > 0) s.inv -= dt;
}

// ── Render ─────────────────────────────────────────────────────────────────────
function render(ctx: CanvasRenderingContext2D, s: GState, t: number, scaleX: number, scaleY: number): void {
  ctx.save();
  ctx.scale(scaleX, scaleY);

  if (s.shake > 0) {
    ctx.translate((Math.random() - 0.5) * s.shake * 10, (Math.random() - 0.5) * s.shake * 10);
  }

  // Background
  ctx.fillStyle = "#050308";
  ctx.fillRect(-60, -60, GW + 120, GH + 120);

  // Grid
  ctx.strokeStyle = "rgba(25, 8, 45, 0.5)";
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= GW; gx += 80) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, GH); ctx.stroke(); }
  for (let gy = 0; gy <= GH; gy += 80) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(GW, gy); ctx.stroke(); }

  // Exit portal
  const pulse = 0.7 + 0.3 * Math.sin(t / 500);
  const chargeRatio = s.chargeMax > 0 ? s.exitCharge / s.chargeMax : 0;
  ctx.save();
  if (!s.exitUnlocked) {
    // LOCKED — red/dark, shows kill counter
    ctx.shadowColor = "#ff3333"; ctx.shadowBlur = 15 * pulse;
    ctx.strokeStyle = `rgba(180, 40, 40, ${0.5 * pulse})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(EX, EY, ER + 8, 0, Math.PI * 2); ctx.stroke();
    const lg = ctx.createRadialGradient(EX, EY, 0, EX, EY, ER);
    lg.addColorStop(0, "rgba(70, 20, 20, 0.9)"); lg.addColorStop(1, "rgba(30, 5, 5, 0.95)");
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.arc(EX, EY, ER, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(200, 80, 80, ${0.85 * pulse})`;
    ctx.font = "bold 16px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🔒", EX, EY - 6);
    ctx.font = "bold 10px monospace";
    ctx.fillStyle = `rgba(255, 120, 120, ${0.9})`;
    ctx.fillText(`${s.kills}/${s.killsReq}`, EX, EY + 9);
  } else {
    // UNLOCKED — green portal (brighter when charging)
    const brightness = 1 + chargeRatio * 0.5;
    ctx.shadowColor = "#00ff44"; ctx.shadowBlur = (35 + chargeRatio * 40) * pulse;
    // Outer ring
    ctx.strokeStyle = `rgba(0, 255, 68, ${(0.5 + chargeRatio * 0.5) * pulse})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(EX, EY, ER + 10, 0, Math.PI * 2); ctx.stroke();
    // Fill
    const eg = ctx.createRadialGradient(EX, EY, 0, EX, EY, ER);
    eg.addColorStop(0, `rgba(${Math.round(120 * brightness)}, 255, ${Math.round(160 * brightness)}, ${0.9 * pulse})`);
    eg.addColorStop(1, `rgba(0, 180, 50, ${0.4 * pulse})`);
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(EX, EY, ER, 0, Math.PI * 2); ctx.fill();
    // Charge progress arc (white ring)
    if (chargeRatio > 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(EX, EY, ER + 14, -Math.PI / 2, -Math.PI / 2 + chargeRatio * Math.PI * 2);
      ctx.stroke();
    }
    // Label
    ctx.fillStyle = `rgba(220, 255, 225, ${0.95 * pulse})`;
    ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(chargeRatio > 0 ? "⚡" : "SALIDA", EX, EY);
    // Unlock flash overlay
    if (s.exitFlash > 0) {
      ctx.globalAlpha = s.exitFlash * 0.6;
      ctx.fillStyle = "#aaffcc";
      ctx.beginPath(); ctx.arc(EX, EY, ER * 5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();

  // Particles
  for (const p of s.parts) {
    ctx.save(); ctx.globalAlpha = p.life * 0.85; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Enemies
  for (const e of s.enemies) {
    const def = ETYPES[e.type];
    ctx.save();
    if (e.flash > 0) { ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 18 * e.flash; }
    const bg = ctx.createRadialGradient(e.x - e.r * 0.3, e.y - e.r * 0.3, 0, e.x, e.y, e.r);
    if (e.flash > 0) {
      bg.addColorStop(0, `rgba(255, 80, 80, ${0.6 + 0.4 * e.flash})`);
      bg.addColorStop(1, "rgba(80, 15, 15, 0.95)");
    } else {
      bg.addColorStop(0, "rgba(40, 15, 65, 0.92)");
      bg.addColorStop(1, "rgba(12, 4, 22, 0.97)");
    }
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = e.flash > 0 ? `rgba(255, 70, 70, ${e.flash})` : "rgba(80, 25, 110, 0.5)";
    ctx.lineWidth = 1.5; ctx.stroke();
    // Eyes
    const eo = e.r * 0.3, er2 = Math.max(2, e.r * 0.18);
    ctx.shadowColor = def.eye; ctx.shadowBlur = 8; ctx.fillStyle = def.eye;
    ctx.beginPath(); ctx.arc(e.x - eo, e.y - e.r * 0.15, er2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(e.x + eo, e.y - e.r * 0.15, er2, 0, Math.PI * 2); ctx.fill();
    // HP bar
    if (e.damage > 0.05) {
      const bw = e.r * 2.4, bh = 4, bx = e.x - bw / 2, by = e.y - e.r - 9;
      ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = `rgba(255, ${Math.round(200 * (1 - e.damage))}, 0, 0.9)`;
      ctx.fillRect(bx, by, bw * (1 - e.damage), bh);
    }
    ctx.restore();
  }

  // Laser beam
  if (s.firing && !s.overheat && s.phase === "playing") {
    const cos = Math.cos(s.angle), sin = Math.sin(s.angle);
    ctx.save(); ctx.shadowColor = "#ff1111"; ctx.shadowBlur = 22; ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255, 40, 40, 0.22)"; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(s.px, s.py); ctx.lineTo(s.px + cos * LRANGE, s.py + sin * LRANGE); ctx.stroke();
    ctx.strokeStyle = "rgba(255, 90, 90, 0.55)"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(s.px, s.py); ctx.lineTo(s.px + cos * LRANGE, s.py + sin * LRANGE); ctx.stroke();
    ctx.shadowBlur = 6; ctx.strokeStyle = "#ffbbbb"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(s.px, s.py); ctx.lineTo(s.px + cos * LRANGE, s.py + sin * LRANGE); ctx.stroke();
    ctx.restore();
  }

  // Player
  if (s.inv <= 0 || Math.floor(s.inv / 140) % 2 === 0) {
    ctx.save(); ctx.shadowColor = "#5577ff"; ctx.shadowBlur = 22;
    const pg = ctx.createRadialGradient(s.px - 3, s.py - 3, 0, s.px, s.py, PR);
    pg.addColorStop(0, "#aabbff"); pg.addColorStop(1, "#2244cc");
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.arc(s.px, s.py, PR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(140, 170, 255, 0.75)"; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.px, s.py);
    ctx.lineTo(s.px + Math.cos(s.angle) * (PR + 7), s.py + Math.sin(s.angle) * (PR + 7));
    ctx.stroke();
    ctx.restore();
  }

  // Exit waypoint arrow
  if (Math.hypot(EX - s.px, EY - s.py) > VIS_R * 0.9) {
    const ea = Math.atan2(EY - s.py, EX - s.px);
    const ix = s.px + Math.cos(ea) * VIS_R * 0.78, iy = s.py + Math.sin(ea) * VIS_R * 0.78;
    ctx.save(); ctx.globalAlpha = 0.55 + 0.35 * Math.sin(t / 300);
    ctx.fillStyle = "#00ff66"; ctx.shadowColor = "#00ff44"; ctx.shadowBlur = 10;
    ctx.translate(ix, iy); ctx.rotate(ea);
    ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-7, -5); ctx.lineTo(-7, 5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // Fog of war
  const fog = ctx.createRadialGradient(s.px, s.py, VIS_R * 0.28, s.px, s.py, VIS_R * 2.3);
  fog.addColorStop(0, "rgba(0,0,0,0)"); fog.addColorStop(0.32, "rgba(0,0,0,0.12)");
  fog.addColorStop(0.62, "rgba(0,0,0,0.78)"); fog.addColorStop(1, "rgba(0,0,0,0.99)");
  ctx.fillStyle = fog; ctx.fillRect(-60, -60, GW + 120, GH + 120);

  // Exit ambient bleed through fog (bright green when unlocked, dim red when locked)
  ctx.save();
  if (s.exitUnlocked) {
    ctx.globalAlpha = (0.25 + chargeRatio * 0.25) * pulse;
    ctx.shadowColor = "#00ff44"; ctx.shadowBlur = 55;
    ctx.fillStyle = "rgba(0, 255, 68, 0.12)";
  } else {
    ctx.globalAlpha = 0.12 * pulse;
    ctx.shadowColor = "#ff3333"; ctx.shadowBlur = 30;
    ctx.fillStyle = "rgba(255, 40, 40, 0.08)";
  }
  ctx.beginPath(); ctx.arc(EX, EY, ER * 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── HUD ──────────────────────────────────────────────────────────────────────
  // HP hearts (scale-aware)
  ctx.textBaseline = "top"; ctx.font = "18px serif";
  for (let i = 0; i < s.maxHp; i++) {
    ctx.globalAlpha = i < s.hp ? 1 : 0.2;
    ctx.fillText("❤️", 14 + i * 26, 14);
  }
  ctx.globalAlpha = 1;


  // Score & kills
  ctx.font = "bold 14px monospace"; ctx.textAlign = "right";
  ctx.fillStyle = "rgba(200, 180, 255, 0.85)"; ctx.fillText(`${s.score} pts`, GW - 14, 14);
  ctx.font = "12px monospace";
  if (!s.exitUnlocked) {
    // Kill progress toward unlocking exit
    const prog = s.kills / s.killsReq;
    ctx.fillStyle = "rgba(255, 120, 120, 0.9)";
    ctx.fillText(`🔒 mata ${s.killsReq - s.kills} más`, GW - 14, 32);
    // Mini progress bar under text
    const pbW = 110, pbX = GW - 14 - pbW, pbY = 46;
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(pbX, pbY, pbW, 4);
    ctx.fillStyle = "#ff6666"; ctx.fillRect(pbX, pbY, pbW * prog, 4);
  } else {
    ctx.fillStyle = "rgba(100, 255, 140, 0.85)";
    ctx.fillText(`eliminados: ${s.kills}`, GW - 14, 32);
  }

  // Laser energy bar
  const barW = 180, barH = 8, barX = GW / 2 - barW / 2, barY = GH - 24;
  ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.textAlign = "center";
  ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
  if (!s.overheat && s.energy > 0) {
    const pct = s.energy / LMAX;
    const bc = pct > 0.5 ? "#ff2222" : pct > 0.25 ? "#ff6600" : "#ff0000";
    ctx.fillStyle = bc; ctx.shadowColor = bc; ctx.shadowBlur = 10;
    ctx.fillRect(barX, barY, barW * pct, barH);
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = s.overheat ? "#ff4444" : "rgba(200, 150, 150, 0.7)";
  ctx.font = "10px monospace"; ctx.textBaseline = "bottom";
  ctx.fillText(s.overheat ? `⚠ SOBRECALENTADO — ${(s.ohTimer / 1000).toFixed(1)}s` : "LÁSER", GW / 2, barY - 2);

  // Overheat flash
  if (s.overheat && Math.floor(t / 350) % 2 === 0) {
    ctx.fillStyle = "rgba(255, 0, 0, 0.07)"; ctx.fillRect(0, 0, GW, GH);
  }
  // Overheat center warning
  if (s.overheat) {
    ctx.save();
    ctx.globalAlpha = 0.45 + 0.35 * Math.sin(t / 200);
    ctx.font = "bold 22px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#ff3333"; ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 15;
    ctx.fillText("⚠ LÁSER SOBRECALENTADO ⚠", GW / 2, GH / 2 - 20);
    ctx.restore();
  }

  // Exit-unlock message flash
  if (s.exitFlash > 0) {
    ctx.save();
    ctx.globalAlpha = s.exitFlash;
    ctx.font = "bold 26px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#00ff66"; ctx.shadowColor = "#00ff44"; ctx.shadowBlur = 20;
    ctx.fillText("¡SALIDA DESBLOQUEADA!", GW / 2, GH / 2);
    ctx.restore();
  }

  // Charging message
  if (s.exitCharge > 0 && s.exitCharge < s.chargeMax) {
    const pct = Math.round((s.exitCharge / s.chargeMax) * 100);
    const alpha = 0.7 + 0.3 * Math.sin(t / 120);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = "bold 20px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff"; ctx.shadowColor = "#00ff44"; ctx.shadowBlur = 12;
    ctx.fillText(`ESCAPANDO... ${pct}%`, GW / 2, GH / 2);
    ctx.restore();
  }

  // Speed-boost warning (enemies raging near exit)
  if (s.exitUnlocked && Math.hypot(EX - s.px, EY - s.py) < ER * 6 && s.exitCharge === 0) {
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t / 150);
    ctx.font = "bold 13px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#ff4444";
    ctx.fillText("⚠ ENEMIGOS ACELERADOS ⚠", GW / 2, GH - 50);
    ctx.restore();
  }

  ctx.restore();

  // ── Overlay screens (drawn in canvas pixel space) ─────────────────────────
  const cw = GW * scaleX, ch = GH * scaleY;
  if (s.phase === "start") {
    ctx.fillStyle = "rgba(0,0,0,0.82)"; ctx.fillRect(0, 0, cw, ch);
    drawOverlay(ctx, cw, ch, [
      { text: "☠  LASER TERROR  ☠", size: 26, color: "#ff2222", bold: true, gap: 0 },
      { text: "Idea del juego:", size: 11, color: "#664444", bold: false, gap: 8 },
      { text: LASER_IDEA_CREDIT.handle, size: 12, color: "#aa6666", bold: true, gap: 2 },
      { text: "Mueve: WASD / ↑↓←→", size: 13, color: "#9988bb", bold: false, gap: 22 },
      { text: "Dispara: mantén clic / toca la pantalla", size: 13, color: "#9988bb", bold: false, gap: 6 },
      { text: "Mata enemies → desbloquea la salida 🔒", size: 13, color: "#ff8888", bold: false, gap: 6 },
      { text: "Quédate en la SALIDA ↗ para escapar", size: 13, color: "#44ff88", bold: false, gap: 4 },
      { text: "CLIC o TAP para empezar", size: 15, color: "#ffffff", bold: true, gap: 22 },
    ]);
  } else if (s.phase === "gameover") {
    ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0, 0, cw, ch);
    drawOverlay(ctx, cw, ch, [
      { text: "GAME OVER", size: 32, color: "#ff2222", bold: true, gap: 0 },
      { text: `Puntuación: ${s.score}`, size: 18, color: "#ffaaaa", bold: false, gap: 16 },
      { text: `Eliminados: ${s.kills}`, size: 14, color: "#cc8888", bold: false, gap: 6 },
      { text: "CLIC o TAP para reiniciar", size: 15, color: "#ffffff", bold: true, gap: 22 },
    ]);
  } else if (s.phase === "escaped") {
    ctx.fillStyle = "rgba(0,10,0,0.85)"; ctx.fillRect(0, 0, cw, ch);
    drawOverlay(ctx, cw, ch, [
      { text: "¡ESCAPASTE!", size: 32, color: "#00ff66", bold: true, gap: 0 },
      { text: `Puntuación: ${s.score}`, size: 18, color: "#88ffaa", bold: false, gap: 16 },
      { text: `Eliminados: ${s.kills}`, size: 14, color: "#66cc88", bold: false, gap: 6 },
      { text: "CLIC o TAP para jugar de nuevo", size: 15, color: "#ffffff", bold: true, gap: 22 },
    ]);
  }
}

interface OLine { text: string; size: number; color: string; bold: boolean; gap: number }
function drawOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, lines: OLine[]): void {
  let totalH = lines.reduce((acc, l) => acc + l.size + l.gap, 0);
  let y = h / 2 - totalH / 2;
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  for (const l of lines) {
    y += l.gap;
    ctx.font = `${l.bold ? "bold " : ""}${l.size}px monospace`;
    ctx.fillStyle = l.color;
    ctx.fillText(l.text, w / 2, y);
    y += l.size;
  }
}

// ── Component ──────────────────────────────────────────────────────────────────
export function LaserGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const diffRef      = useRef<Difficulty>("normal");
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef     = useRef<GState>(mkState("normal"));
  const mouseRef     = useRef({ x: GW / 2, y: GH / 2 });
  const keysRef      = useRef<Set<string>>(new Set());
  const animRef      = useRef<number>(0);
  const lastTRef     = useRef<number>(0);

  // Keep diffRef in sync so event-handlers (created once) always see current difficulty
  const handleDifficulty = useCallback((d: Difficulty) => {
    setDifficulty(d);
    diffRef.current = d;
    // If game hasn't started yet, recreate idle state with new difficulty
    if (stateRef.current.phase === "start") {
      stateRef.current = mkState(d);
    }
  }, []);

  const resize = useCallback(() => {
    const canvas = canvasRef.current, con = containerRef.current;
    if (!canvas || !con) return;
    const maxW = con.clientWidth;
    // Use container's own height when available (flex-1 layout), else fallback
    const maxH = con.clientHeight > 40 ? con.clientHeight : window.innerHeight * 0.55;
    const aspect = GW / GH;
    let w = maxW, h = w / aspect;
    if (h > maxH) { h = maxH; w = h * aspect; }
    w = Math.floor(w); h = Math.floor(h);
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width  = `${w}px`;
    canvas.style.height = `${h}px`;
  }, []);

  const getGameCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: GW / 2, y: GH / 2 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (GW / rect.width),
      y: (clientY - rect.top)  * (GH / rect.height),
    };
  }, []);

  const loop = useCallback((now: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dt = Math.min(now - (lastTRef.current || now), 50);
    lastTRef.current = now;
    const scaleX = canvas.width  / GW;
    const scaleY = canvas.height / GH;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update(stateRef.current, dt, mouseRef.current.x, mouseRef.current.y, keysRef.current);
    render(ctx, stateRef.current, now, scaleX, scaleY);
    animRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Keyboard ──────────────────────────────────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);

    // ── Pointer events (unified mouse + touch on canvas) ──────────────────────
    const onPointerMove = (e: PointerEvent) => {
      mouseRef.current = getGameCoords(e.clientX, e.clientY);
    };

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId); // keep events even if pointer leaves canvas
      mouseRef.current = getGameCoords(e.clientX, e.clientY);
      const s = stateRef.current;
      if (s.phase !== "playing") {
        // Start or restart game — firing begins immediately
        stateRef.current = mkState(diffRef.current);
        stateRef.current.phase = "playing";
        stateRef.current.firing = true;
      } else {
        s.firing = true;
      }
    };

    const onPointerUp = () => { stateRef.current.firing = false; };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointermove",  onPointerMove);
    canvas.addEventListener("pointerdown",  onPointerDown);
    canvas.addEventListener("pointerup",    onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointermove",   onPointerMove);
      canvas.removeEventListener("pointerdown",   onPointerDown);
      canvas.removeEventListener("pointerup",     onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  }, [resize, loop, getGameCoords]);

  // Mobile D-Pad helpers — pointer events so they work alongside canvas touch
  const pressKey   = useCallback((k: string) => keysRef.current.add(k),    []);
  const releaseKey = useCallback((k: string) => keysRef.current.delete(k), []);

  const DpadBtn = ({ label, k }: { label: string; k: string }) => (
    <button
      style={{ touchAction: "none" }}
      className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted text-foreground text-lg font-bold select-none active:bg-accent active:scale-95 transition-transform"
      onPointerDown={e => { e.preventDefault(); pressKey(k); }}
      onPointerUp={() => releaseKey(k)}
      onPointerLeave={() => releaseKey(k)}
      onPointerCancel={() => releaseKey(k)}
      aria-label={label}
    >
      {label}
    </button>
  );

  const diffBtnClass = (d: Difficulty) =>
    `rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition-colors whitespace-nowrap ${
      difficulty === d
        ? d === "easy"   ? "bg-emerald-700 text-white"
        : d === "normal" ? "bg-amber-600 text-white"
        :                  "bg-red-700 text-white"
        : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    }`;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">

      {/* Header */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm" className="text-red-500 hover:text-red-400 hover:bg-red-500/10 px-2">
            <Link href="/">← Volver</Link>
          </Button>
          <h1 className="font-mono text-sm font-bold text-red-500 tracking-widest">☠ LASER TERROR ☠</h1>
          <div className="w-16" aria-hidden />
        </div>
        <p className="mt-1.5 text-center font-mono text-[10px] leading-tight text-muted-foreground">
          Idea del juego:{" "}
          <a
            href={LASER_IDEA_CREDIT.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400/90 underline-offset-2 hover:text-red-300 hover:underline"
          >
            {LASER_IDEA_CREDIT.handle}
          </a>
        </p>
      </div>

      {/* Canvas — crece para llenar el espacio disponible, centrado */}
      <div ref={containerRef} className="flex-1 min-h-0 w-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="cursor-crosshair"
          style={{ background: "#050308", touchAction: "none" }}
        />
      </div>

      {/* Controles — fijos abajo */}
      <div className="shrink-0 w-full flex flex-col items-center gap-2 px-4 pt-2 pb-4 border-t border-border">

        {/* Dificultad en una sola fila */}
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-muted-foreground mr-0.5">Dif:</span>
          {(["easy", "normal", "hard"] as Difficulty[]).map(d => (
            <button key={d} onClick={() => handleDifficulty(d)} className={diffBtnClass(d)}>
              {d === "easy" ? "😊 Fácil" : d === "normal" ? "💀 Normal" : "☠️ Difícil"}
            </button>
          ))}
        </div>

        {/* D-Pad móvil */}
        <div className="grid grid-cols-3 gap-1.5 lg:hidden" style={{ touchAction: "none" }}>
          <div /><DpadBtn label="↑" k="ArrowUp" /><div />
          <DpadBtn label="←" k="ArrowLeft" />
          <DpadBtn label="↓" k="ArrowDown" />
          <DpadBtn label="→" k="ArrowRight" />
        </div>

        {/* Hint desktop */}
        <p className="hidden lg:block text-center text-xs text-muted-foreground font-mono">
          WASD / flechas — mover · mantén clic — disparar · llega a la SALIDA verde ↗
        </p>
      </div>
    </div>
  );
}
