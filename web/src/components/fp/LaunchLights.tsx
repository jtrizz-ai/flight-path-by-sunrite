'use client';

import { useEffect, useRef } from 'react';

// Animated runway approach lights - port of the design's JavaScript light field
// Two converging rows of lights recede toward a vanishing point and flash in sequence

export function LaunchLights() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Constants from original design
    const IW = 1376; // intrinsic image width
    const IH = 768;  // intrinsic image height
    const N = 20;    // number of light pairs
    const DURATION = 2100; // ms

    // Vanishing point + near-edge anchors (fractions of image)
    const vpX = 0.505;
    const vpY = 0.635;
    const nlx = 0.305; // left runway edge
    const nrx = 0.715; // right runway edge

    let animationId: number;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const draw = (time: number) => {
      const W = canvas.width / window.devicePixelRatio;
      const H = canvas.height / window.devicePixelRatio;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // object-fit: cover mapping
      const scale = Math.max(W / IW, H / IH);
      const rW = IW * scale;
      const rH = IH * scale;
      const oX = (W - rW) / 2;
      const oY = (H - rH) / 2;

      for (let i = 1; i < N; i++) {
        const s = i / (N - 1);
        const sp = Math.pow(s, 1.7);

        const fy = vpY + (1.0 - vpY) * sp;
        const fxL = vpX + (nlx - vpX) * sp;
        const fxR = vpX + (nrx - vpX) * sp;
        const dotSize = 2 + 12 * sp;

        // Staggered flash phase (delay = -s * DURATION in CSS)
        let phase = ((time / DURATION + s) % 1);
        if (phase < 0) phase += 1;

        const { opacity, glow } = flash(phase);

        [fxL, fxR].forEach((fx) => {
          const cx = oX + fx * rW;
          const cy = oY + fy * rH;

          // Glow halo
          if (glow > 0.01) {
            const halo = dotSize * (1 + 2.4 * glow);
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, halo / 2);
            gradient.addColorStop(0, `rgba(255, 203, 156, ${0.55 * glow})`);
            gradient.addColorStop(1, 'rgba(255, 203, 156, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(cx, cy, halo / 2, 0, Math.PI * 2);
            ctx.fill();
          }

          // Core dot
          ctx.fillStyle = `rgba(255, 203, 156, ${opacity})`;
          ctx.beginPath();
          ctx.arc(cx, cy, dotSize / 2, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animationId = requestAnimationFrame(draw);
    };

    // CSS keyframes: 0%→.14, 5%→1.0, 18%→.14, 100%→.14
    const flash = (phase: number): { opacity: number; glow: number } => {
      const base = 0.14;
      if (phase < 0.05) {
        const k = phase / 0.05;
        return { opacity: base + (1.0 - base) * k, glow: k };
      } else if (phase < 0.18) {
        const k = 1 - (phase - 0.05) / 0.13;
        return { opacity: base + (1.0 - base) * k, glow: Math.max(0, k) };
      } else {
        return { opacity: base, glow: 0 };
      }
    };

    resize();
    window.addEventListener('resize', resize);
    animationId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
}
