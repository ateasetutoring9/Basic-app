"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

interface ToastProps {
  message: string;
  link?: { href: string; label: string };
  onDismiss: () => void;
}

export function Toast({ message, link, onDismiss }: ToastProps) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    const t = setTimeout(() => dismissRef.current(), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-between gap-4 px-6 py-3 bg-fg text-[var(--bg-page)] text-small"
    >
      <span>{message}</span>
      {link && (
        <Link
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline hover:no-underline flex-shrink-0 whitespace-nowrap"
        >
          {link.label}
        </Link>
      )}
    </div>
  );
}
