"use client";
import type { ReactNode } from "react";
export function PublicNavMenu({ className, label, children }: { className: string; label: ReactNode; children: ReactNode }) {
  return <details className={className}
    onClick={event => {
      if (event.target instanceof Element && event.target.closest("a")) event.currentTarget.open = false;
    }}
    onKeyDown={event => {
      if (event.key === "Escape") {
        event.currentTarget.open = false;
        event.currentTarget.querySelector("summary")?.focus();
      }
    }}>
    <summary>{label}</summary>{children}
  </details>;
}
