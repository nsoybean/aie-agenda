"use client";

import { useState } from "react";
import { getSpeakerImageCandidates } from "@/lib/speaker-images";
import { pillColors } from "@/lib/theme";

function initials(name: string): string {
  const parts = name.trim().replace(/\([^)]*\)/g, "").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function SpeakerAvatar({
  name,
  apiImageUrl,
  size = 40,
  className = "",
}: {
  name: string;
  apiImageUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const candidates = getSpeakerImageCandidates(name, apiImageUrl);
  const [idx, setIdx] = useState(0);
  const showImg = idx < candidates.length;

  const px = `${size}px`;
  const c = pillColors(name);

  if (showImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={candidates[idx]}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover ring-1 ring-white/20 ${className}`}
        style={{ width: px, height: px, flexShrink: 0 }}
        onError={() => setIdx((i) => i + 1)}
      />
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-sm font-semibold ${className}`}
      style={{
        width: px,
        height: px,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.fg,
      }}
    >
      {initials(name)}
    </span>
  );
}
