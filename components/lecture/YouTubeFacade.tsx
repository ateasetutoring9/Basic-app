"use client";

import { useState } from "react";

interface Props {
  youtubeId: string;
  title: string;
}

export default function YouTubeFacade({ youtubeId, title }: Props) {
  const [active, setActive] = useState(false);

  const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`;
  const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

  if (active) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border">
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setActive(true)}
      className="group relative w-full aspect-video rounded-xl overflow-hidden border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      aria-label={`Play video: ${title}`}
    >
      {/* Thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnailUrl}
        alt={`Thumbnail for ${title}`}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"
        aria-hidden="true"
      />

      {/* Play button */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-7 h-7 text-red-600 ml-1"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Label */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center" aria-hidden="true">
        <span className="bg-black/60 text-white text-sm font-medium px-3 py-1 rounded-full">
          Click to play
        </span>
      </div>
    </button>
  );
}
