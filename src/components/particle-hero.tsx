"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { sampleCash, sampleHoldings, sampleMoney } from "@/lib/sample-portfolio";
import "./particle-hero.css";

type Point = [number, number, number];
type Particle = { cube: Point; tree: Point; phase: number; color: string };
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => n * n * (3 - 2 * n);

function makeParticles(count: number): Particle[] {
  let seed = 82741;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const branches: [Point, Point][] = [];
  const trunk: [Point, Point] = [[0, -1.15, 0], [0, -0.2, 0]];
  const branch = (start: Point, angle: number, length: number, depth: number) => {
    const end: Point = [start[0] + Math.cos(angle) * length, start[1] + length * (0.72 + random() * 0.5), start[2] + Math.sin(angle) * length];
    branches.push([start, end]);
    if (depth > 0) for (let i = 0; i < 3; i++) branch(end, angle + (i - 1) * 0.8 + (random() - 0.5) * 0.5, length * 0.48, depth - 1);
  };
  for (let i = 0; i < 9; i++) branch([0, -0.25 + random() * 0.3, 0], i / 9 * Math.PI * 2, 0.65 + random() * 0.2, 3);
  const colors = ["#58baff", "#7d8dff", "#b6dfff", "#5274ef", "#b69cff"];
  return Array.from({ length: count }, (_, i) => {
    const face = Math.floor(random() * 6);
    const cube: Point = [(random() - 0.5) * 1.6, (random() - 0.5) * 1.6, (random() - 0.5) * 1.6];
    cube[Math.floor(face / 2)] = (face % 2 ? 1 : -1) * 0.8 + (random() - 0.5) * 0.025;
    const segment = random() < 0.13 ? trunk : branches[Math.floor(random() * branches.length)];
    const t = random();
    const thickness = segment === trunk ? 0.06 : 0.035;
    const tree = segment[0].map((v, axis) => v + (segment[1][axis] - v) * t + (random() - 0.5) * thickness) as Point;
    return { cube, tree, phase: random() * Math.PI * 2, color: colors[i % colors.length] };
  });
}

export function ParticleHero() {
  const [motionPaused, setMotionPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nav = sampleCash + sampleHoldings.reduce((sum, h) => sum + h.price * h.quantity, 0);

  useEffect(() => {
    const section = sectionRef.current;
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!section || !scene || !canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    let width = 1, height = 1, frame = 0, visible = true;
    let progress = 0, targetProgress = 0, pointerX = 0, pointerY = 0, tiltX = 0, tiltY = 0;
    let particles: Particle[] = [];
    let lastTime = 0, elapsed = 0;
    const vertices: Point[] = Array.from({ length: 8 }, (_, i) => [(i & 1 ? 1 : -1) * 0.8, (i & 2 ? 1 : -1) * 0.8, (i & 4 ? 1 : -1) * 0.8]);
    const edges: [number, number][] = [];
    for (let i = 0; i < 8; i++) for (const bit of [1, 2, 4]) if (!(i & bit)) edges.push([i, i | bit]);

    const updateProgress = () => {
      const top = parseFloat(getComputedStyle(scene).top) || 0;
      const bounds = section.getBoundingClientRect();
      const distance = Math.max(1, section.offsetHeight - scene.offsetHeight);
      targetProgress = (reduced.matches || motionPaused) ? 0 : clamp((top - bounds.top) / distance);
      scene.style.setProperty("--morph", String(targetProgress));
      scene.dataset.phase = targetProgress < 0.28 ? "cube" : targetProgress < 0.72 ? "transition" : "tree";
    };
    const draw = (time: number) => {
      frame = 0;
      const delta = lastTime ? Math.min(40, time - lastTime) : 16;
      lastTime = time;
      if (!(reduced.matches || motionPaused)) elapsed += delta / 1000;
      progress += (targetProgress - progress) * (1 - Math.exp(-delta / 120));
      tiltX += (pointerX - tiltX) * 0.07;
      tiltY += (pointerY - tiltY) * 0.07;
      const morph = smooth(clamp((progress - 0.16) / 0.68));
      const scatter = Math.sin(morph * Math.PI);
      const mobile = width < 700;
      const scale = Math.min(width * (mobile ? 0.25 : 0.2), height * 0.29);
      const cx = width * (mobile ? 0.5 : 0.65);
      const cy = height * (mobile ? 0.53 : 0.47);
      const yaw = 0.5 + elapsed * 0.19 * (1 - morph * 0.8) + tiltX * 0.24;
      const pitch = -0.17 * (1 - morph) + tiltY * 0.12;
      const project = (p: Point) => {
        const x = p[0] * Math.cos(yaw) + p[2] * Math.sin(yaw);
        const z0 = -p[0] * Math.sin(yaw) + p[2] * Math.cos(yaw);
        const y = p[1] * Math.cos(pitch) - z0 * Math.sin(pitch);
        const z = p[1] * Math.sin(pitch) + z0 * Math.cos(pitch);
        const perspective = 4 / (4 + z);
        return { x: cx + x * scale * perspective, y: cy - y * scale * perspective, z, size: perspective };
      };
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#050814";
      ctx.fillRect(0, 0, width, height);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 2.2);
      glow.addColorStop(0, "#0b1738"); glow.addColorStop(0.5, "#090e24"); glow.addColorStop(1, "#050814");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < 75; i++) {
        ctx.globalAlpha = 0.12 + (Math.sin(i * 2.1 + elapsed * 0.4) + 1) * 0.09;
        ctx.fillStyle = "#9abfff";
        ctx.fillRect(((i * 137.508) % 1000) / 1000 * width, ((i * 83.17) % 1000) / 1000 * height, 1, 1);
      }
      ctx.globalCompositeOperation = "lighter";
      const floorY = cy + scale * 1.33;
      for (let i = 0; i < 5; i++) {
        const radius = scale * (0.45 + i * 0.35);
        ctx.globalAlpha = 0.2 - i * 0.025;
        ctx.strokeStyle = i % 2 ? "#7554ff" : "#276cff"; ctx.lineWidth = i === 2 ? 2 : 1;
        ctx.beginPath(); ctx.ellipse(cx, floorY, radius, radius * 0.19, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = (1 - morph) * 0.65;
      ctx.strokeStyle = "#78cfff"; ctx.lineWidth = 0.8;
      for (const [a, b] of edges) {
        const p = project(vertices[a]), q = project(vertices[b]);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      }
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        const p = particle.cube.map((v, axis) => v * (1 - morph) + particle.tree[axis] * morph) as Point;
        const orbit = particle.phase + elapsed * 0.55;
        p[0] += scatter * Math.cos(orbit) * 0.72;
        p[1] += scatter * Math.sin(particle.phase * 2 + elapsed * 0.35) * 0.5;
        p[2] += scatter * Math.sin(orbit) * 0.72;
        // A subtle breathing canopy settles after the cube disperses.
        p[0] += morph * Math.sin(particle.phase + elapsed * 0.7) * 0.018;
        const point = project(p);
        const size = (i % 11 === 0 ? 1.8 : 0.85) * point.size;
        ctx.globalAlpha = Math.max(0.2, Math.min(0.85, 0.52 - point.z * 0.14));
        ctx.fillStyle = particle.color;
        ctx.fillRect(point.x, point.y, size, size);
        if (i % 19 === 0) {
          ctx.globalAlpha = 0.09;
          ctx.fillRect(point.x - 2, point.y - 2, size + 4, size + 4);
        }
      }
      ctx.globalAlpha = (1 - morph) * 0.9;
      ctx.fillStyle = "#c9e9ff";
      ctx.font = "600 " + Math.max(11, Math.round(scale * 0.105)) + "px Arial";
      ctx.textAlign = "center";
      ctx.fillText("CENTURION", cx, cy + 5);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      if (visible && !document.hidden && !(reduced.matches || motionPaused)) frame = requestAnimationFrame(draw);
    };
    const start = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(draw); };
    const resize = () => {
      const bounds = scene.getBoundingClientRect();
      width = bounds.width; height = bounds.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = makeParticles(width < 700 ? 1500 : 3000);
      updateProgress(); start();
    };
    const pointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !fine.matches || (reduced.matches || motionPaused)) return;
      const bounds = scene.getBoundingClientRect();
      pointerX = (event.clientX - bounds.left) / bounds.width * 2 - 1;
      pointerY = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    };
    const pointerLeave = () => { pointerX = 0; pointerY = 0; };
    const preference = () => {
      cancelAnimationFrame(frame); frame = 0; elapsed = 0;
      progress = targetProgress = 0; pointerX = pointerY = tiltX = tiltY = 0;
      section.dataset.motion = (reduced.matches || motionPaused) ? "reduced" : "full";
      scene.dataset.motion = (reduced.matches || motionPaused) ? "reduced" : "full";
      resize();
    };
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
      else start();
    };
    const intersection = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) start(); else { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
    });
    intersection.observe(section);
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(scene);
    scene.addEventListener("pointermove", pointerMove, { passive: true });
    scene.addEventListener("pointerleave", pointerLeave);
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    reduced.addEventListener("change", preference);
    preference();
    return () => {
      cancelAnimationFrame(frame); intersection.disconnect(); sizeObserver.disconnect();
      scene.removeEventListener("pointermove", pointerMove); scene.removeEventListener("pointerleave", pointerLeave);
      window.removeEventListener("scroll", updateProgress); window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", preference);
    };
  }, [motionPaused]);

  return <section ref={sectionRef} className="particle-story" aria-label="Interactive portfolio visualization">
    <div ref={sceneRef} className="particle-scene" data-phase="cube">
      <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />
      <div className="particle-copy"><span className="particle-kicker">CENTURION / A NEW PERSPECTIVE</span>
        <h1>See the whole picture.<br/><span>Understand every connection.</span></h1>
        <p>A portfolio is more than its positions. Explore how individual holdings connect to your wider risk.</p>
        <a href="#demo" className="button">Explore sample portfolio <ArrowUpRight size={15}/></a>
      </div>
      <div className="particle-stage" aria-hidden="true"><span className="stage-cube">01 / THE PORTFOLIO</span><span className="stage-transition">02 / CONNECTING EXPOSURES</span><span className="stage-tree">03 / THE RISK NETWORK</span></div>
      <div className="particle-bottom"><div className="particle-scroll"><ArrowDown size={17}/><span>Scroll to transform<br/><small>Move your pointer to explore</small></span></div>
        <dl className="particle-sample"><div><dt>Sample portfolio</dt><dd>{sampleMoney(nav)}</dd></div><div><dt>Holdings</dt><dd>{sampleHoldings.length}</dd></div><div><dt>Cash reserve</dt><dd>{sampleMoney(sampleCash)}</dd></div></dl>
      </div>
      <p className="particle-disclosure">Fictional sample data · Artistic visualization, not a calculated risk graph</p>
      <button type="button" className="particle-pause" onClick={() => setMotionPaused(!motionPaused)}>{motionPaused ? "Play animation" : "Pause animation"}</button>
      <a className="particle-skip" href="#welcome">Skip animation ↓</a>
    </div>
  </section>;
}
