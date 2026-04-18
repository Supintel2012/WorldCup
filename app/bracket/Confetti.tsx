"use client";

import { useEffect, useRef } from "react";

export function Confetti({ fire, onDone }: { fire: boolean; onDone?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!fire) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const W = (canvas.width = window.innerWidth * dpr);
    const H = (canvas.height = window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    const colors = [
      "oklch(0.62 0.21 25)",
      "oklch(0.55 0.18 245)",
      "oklch(0.68 0.15 150)",
      "oklch(0.85 0.16 85)",
      "#fff",
    ];
    const N = 240;
    type P = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      g: number;
      w: number;
      h: number;
      rot: number;
      vr: number;
      color: string;
      life: number;
    };
    const parts: P[] = [];
    for (let i = 0; i < N; i++) {
      parts.push({
        x: (0.2 + Math.random() * 0.6) * W,
        y: H * 0.3 + Math.random() * 60,
        vx: (Math.random() - 0.5) * 12 * dpr,
        vy: (-Math.random() * 18 - 8) * dpr,
        g: 0.35 * dpr,
        w: (4 + Math.random() * 6) * dpr,
        h: (6 + Math.random() * 10) * dpr,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 200 + Math.random() * 120,
      });
    }

    let frame = 0;
    const tick = () => {
      frame++;
      ctx.clearRect(0, 0, W, H);
      let alive = 0;
      for (const p of parts) {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life--;
        if (p.life > 0 && p.y < H + 40) alive++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 80));
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive > 0 && frame < 400) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, W, H);
        onDone && onDone();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [fire, onDone]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
        display: fire ? "block" : "none",
      }}
    />
  );
}
