"use client";
import { useEffect, useRef } from "react";

const revealSelector = ".resource-section, .demo-intro, .demo-cta, .metric, .panel, .welcome-copy, .welcome-sample, .page-heading, .auth-card";

export function SiteMotion() {
  const layerRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const pointer = pointerRef.current;
    const progress = progressRef.current;
    if (!layer || !pointer || !progress) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let dispose = () => {};

    function configure() {
      dispose();
      if (!layer || !pointer || !progress) return;
      layer.dataset.enabled = String(!reduced.matches);
      pointer.classList.remove("is-visible", "is-interactive");
      if (reduced.matches) return;
      let pointerFrame = 0;
      let scrollFrame = 0;
      let x = 0, y = 0, targetX = 0, targetY = 0;
      let visible = false;
      const animations = new Set<Animation>();
      const seen = new WeakSet<Element>();

      const drawPointer = () => {
        pointerFrame = 0;
        x += (targetX - x) * 0.22;
        y += (targetY - y) * 0.22;
        pointer.style.transform = "translate3d(" + x + "px," + y + "px,0)";
        if (visible && (Math.abs(targetX - x) > 0.2 || Math.abs(targetY - y) > 0.2)) {
          pointerFrame = requestAnimationFrame(drawPointer);
        }
      };
      const movePointer = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        targetX = event.clientX;
        targetY = event.clientY;
        if (!visible) { x = targetX; y = targetY; visible = true; }
        pointer.classList.add("is-visible");
        pointer.classList.toggle("is-interactive", event.target instanceof Element && Boolean(event.target.closest("a, button, summary, input, select")));
        if (!pointerFrame) pointerFrame = requestAnimationFrame(drawPointer);
      };
      const hidePointer = () => {
        visible = false;
        pointer.classList.remove("is-visible");
        cancelAnimationFrame(pointerFrame);
        pointerFrame = 0;
      };
      const drawProgress = () => {
        scrollFrame = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const fraction = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        progress.style.transform = "scaleX(" + fraction + ")";
      };
      const queueProgress = () => {
        if (!scrollFrame) scrollFrame = requestAnimationFrame(drawProgress);
      };
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          if (entry.target.contains(document.activeElement) || typeof entry.target.animate !== "function") continue;
          const animation = entry.target.animate(
            [{ transform: "translateY(16px)" }, { transform: "translateY(0)" }],
            { duration: 560, easing: "cubic-bezier(0.22,1,0.36,1)" },
          );
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        }
      }, { threshold: 0.06 });
      const observe = (root: Element) => {
        const add = (element: Element) => {
          if (!seen.has(element)) { seen.add(element); observer.observe(element); }
        };
        if (root.matches(revealSelector)) add(root);
        root.querySelectorAll(revealSelector).forEach(add);
      };
      observe(document.body);
      const mutations = new MutationObserver(records => {
        for (const record of records) for (const node of record.addedNodes) {
          if (node instanceof Element) observe(node);
        }
        queueProgress();
      });
      mutations.observe(document.body, { childList: true, subtree: true });
      if (finePointer.matches) {
        window.addEventListener("pointermove", movePointer, { passive: true });
        document.documentElement.addEventListener("pointerleave", hidePointer);
        window.addEventListener("blur", hidePointer);
      }
      window.addEventListener("scroll", queueProgress, { passive: true });
      window.addEventListener("resize", queueProgress, { passive: true });
      drawProgress();
      dispose = () => {
        observer.disconnect();
        mutations.disconnect();
        animations.forEach(animation => animation.cancel());
        cancelAnimationFrame(pointerFrame);
        cancelAnimationFrame(scrollFrame);
        window.removeEventListener("pointermove", movePointer);
        document.documentElement.removeEventListener("pointerleave", hidePointer);
        window.removeEventListener("blur", hidePointer);
        window.removeEventListener("scroll", queueProgress);
        window.removeEventListener("resize", queueProgress);
      };
    }
    configure();
    reduced.addEventListener("change", configure);
    finePointer.addEventListener("change", configure);
    return () => {
      dispose();
      reduced.removeEventListener("change", configure);
      finePointer.removeEventListener("change", configure);
    };
  }, []);

  return <div ref={layerRef} className="site-motion" aria-hidden="true">
    <div ref={progressRef} className="scroll-progress" />
    <div ref={pointerRef} className="pointer-aura"><span className="pointer-ring" /></div>
  </div>;
}
