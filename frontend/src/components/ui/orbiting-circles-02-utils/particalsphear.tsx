"use client";

import React, { useRef, useEffect } from "react";

const PARTICLE_COUNT = 5000;
const RADIUS = 380;

interface Particle {
  x: number;
  y: number;
  z: number;
  r: number;
  g: number;
  b: number;
  size: number;
}

function createParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = RADIUS * Math.cbrt(Math.random());
    const colorRand = Math.random();
    let cr: number, cg: number, cb: number;
    if (colorRand < 0.5) {
      cr = 100 + Math.random() * 100; cg = 150 + Math.random() * 105; cb = 200 + Math.random() * 55;
    } else if (colorRand < 0.8) {
      cr = 180 + Math.random() * 75; cg = 180 + Math.random() * 75; cb = 200 + Math.random() * 55;
    } else {
      cr = 100 + Math.random() * 50; cg = 120 + Math.random() * 60; cb = 180 + Math.random() * 75;
    }
    particles.push({
      x: r * Math.sin(phi) * Math.cos(theta),
      y: r * Math.sin(phi) * Math.sin(theta),
      z: r * Math.cos(phi),
      r: Math.min(255, cr),
      g: Math.min(255, cg),
      b: Math.min(255, cb),
      size: 0.5 + Math.random() * 1.5,
    });
  }
  return particles;
}

function project(
  x: number,
  y: number,
  z: number,
  cx: number,
  cy: number,
  fov: number
) {
  const scale = fov / (fov + z);
  return { px: cx + x * scale, py: cy + y * scale, scale, z };
}

export default function ParticleSphereAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>(createParticles(PARTICLE_COUNT));
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = false;
    let animId = 0;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const w = rect.width;
      const h = rect.height;
      const cx = w / 2;
      const cy = h / 2;
      const fov = 500;

      ctx.clearRect(0, 0, w, h);
      angleRef.current += 0.003;
      const cosA = Math.cos(angleRef.current);
      const sinA = Math.sin(angleRef.current);

      const particles = particlesRef.current;
      const projected: { px: number; py: number; scale: number; z: number; r: number; g: number; b: number; size: number }[] = [];

      for (const p of particles) {
        const rx = p.x * cosA - p.z * sinA;
        const rz = p.x * sinA + p.z * cosA;
        projected.push({ ...project(rx, p.y, rz, cx, cy, fov), r: p.r, g: p.g, b: p.b, size: p.size });
      }

      projected.sort((a, b) => a.z - b.z);

      for (const pt of projected) {
        const depthAlpha = Math.max(0.05, Math.min(1, (pt.z + RADIUS) / (2 * RADIUS)));
        const radius = Math.max(0.3, pt.size * pt.scale);
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pt.r}, ${pt.g}, ${pt.b}, ${depthAlpha * 0.85})`;
        ctx.fill();
      }
    };

    const loop = () => {
      if (!isRunning) return;
      draw();
      animId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (isRunning) return;
      isRunning = true;
      animId = requestAnimationFrame(loop);
    };

    const stop = () => {
      isRunning = false;
      if (animId) cancelAnimationFrame(animId);
    };

    const onVisible = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !document.hidden) {
          start();
        } else {
          stop();
        }
      },
      { threshold: 0 },
    );

    if (canvas.parentElement) observer.observe(canvas.parentElement);
    document.addEventListener("visibilitychange", onVisible);
    start();

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}
