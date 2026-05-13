"use client";

import { useState, useEffect } from "react";
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
  // undefined = still probing, null = all failed, string = resolved URL
  const [resolvedUrl, setResolvedUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const candidates = getSpeakerImageCandidates(name, apiImageUrl);

    function tryNext(idx: number) {
      if (idx >= candidates.length) {
        if (!cancelled) setResolvedUrl(null);
        return;
      }
      const img = new Image();
      img.onload = () => { if (!cancelled) setResolvedUrl(candidates[idx]); };
      img.onerror = () => { if (!cancelled) tryNext(idx + 1); };
      img.src = candidates[idx];
    }

    setResolvedUrl(undefined);
    tryNext(0);
    return () => { cancelled = true; };
  }, [name, apiImageUrl]);

  const px = `${size}px`;
  const c = pillColors(name);

  if (resolvedUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolvedUrl}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover ring-2 ring-white ${className}`}
        style={{ width: px, height: px, flexShrink: 0 }}
      />
    );
  }

  if (resolvedUrl === undefined) {
    return (
      <span
        className={`inline-flex shrink-0 rounded-full animate-pulse ${className}`}
        style={{ width: px, height: px, background: "rgba(255,255,255,0.1)" }}
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
