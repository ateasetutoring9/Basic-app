"use client";

import { useRef, useState, useEffect } from "react";

interface Props {
  html: string;
  title: string;
}

export default function SlidesViewer({ html, title }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(1);

  // Listen for state broadcasts from the iframe
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === "SLIDES_STATE") {
        setCurrent(e.data.current);
        setTotal(e.data.total);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function send(type: "SLIDES_PREV" | "SLIDES_NEXT") {
    iframeRef.current?.contentWindow?.postMessage({ type }, "*");
  }

  const atStart = current <= 1;
  const atEnd   = current >= total;

  const btnBase =
    "inline-flex items-center justify-center min-h-[44px] min-w-[100px] px-5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="w-full">
      {/* Slide canvas */}
      <div className="w-full aspect-video rounded-xl overflow-hidden border border-border shadow-sm">
        <iframe
          ref={iframeRef}
          srcDoc={html}
          title={title}
          className="w-full h-full"
          sandbox="allow-scripts"
        />
      </div>

      {/* Controls — outside the iframe */}
      <div className="flex items-center justify-between mt-4 gap-4">
        <button
          onClick={() => send("SLIDES_PREV")}
          disabled={atStart}
          className={`${btnBase} bg-white border border-border text-fg hover:bg-gray-50`}
          aria-label="Previous slide"
        >
          ← Previous
        </button>

        {/* Dot indicators + counter */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-2" aria-hidden="true">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={`block rounded-full transition-all duration-200 ${
                  i + 1 === current
                    ? "w-5 h-2 bg-primary"
                    : "w-2 h-2 bg-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted" aria-live="polite">
            {current} / {total}
          </span>
        </div>

        <button
          onClick={() => send("SLIDES_NEXT")}
          disabled={atEnd}
          className={`${btnBase} bg-primary text-white hover:bg-primary-hover`}
          aria-label="Next slide"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
