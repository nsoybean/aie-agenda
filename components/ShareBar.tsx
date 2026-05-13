"use client";

import { useState } from "react";
import { toPng } from "html-to-image";
import { buildIcs } from "@/lib/api";
import { X_TAG, EVENT_NAME, EVENT_DATES } from "@/lib/site";
import type { Session } from "@/lib/types";

function download(filename: string, dataUrl: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function buildTweet(_name: string, sessions: Session[]): string {
  return `This is my ${EVENT_NAME} agenda — ${sessions.length} sessions across ${EVENT_DATES}.\n\nWhat's yours? ${X_TAG}`;
}

async function renderPng(cardNodeId: string, name: string): Promise<{ dataUrl: string; file: File } | null> {
  const node = document.getElementById(cardNodeId);
  if (!node) return null;
  const scale = Math.max(1, Math.round((1200 / node.offsetWidth) * 2));
  const dataUrl = await toPng(node, { pixelRatio: scale, cacheBust: true, backgroundColor: "#000000" });
  const slug = (name.trim() || "my").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const filename = `aie-singapore-agenda-${slug || "card"}.png`;
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], filename, { type: "image/png" });
  return { dataUrl, file };
}

export default function ShareBar({
  name,
  sessions,
  cardNodeId,
}: {
  name: string;
  sessions: Session[];
  cardNodeId: string;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<null | "x" | "png">(null);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const tweet = buildTweet(name, sessions);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  async function shareX() {
    setBusy("x");
    try {
      const png = await renderPng(cardNodeId, name);

      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

      // Mobile: Web Share API with image file attached
      if (isMobile && png && navigator.canShare?.({ files: [png.file] })) {
        await navigator.share({ files: [png.file], text: tweet, url });
        return;
      }

      // Desktop: download image, open X compose with caption pre-filled — user attaches the image
      if (png) download(png.file.name, png.dataUrl);
      const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
      window.open(intentUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      // User cancelled share sheet or render failed — fall back to plain intent
      if (err instanceof Error && err.name !== "AbortError") {
        const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}&url=${encodeURIComponent(url)}`;
        window.open(intentUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setBusy(null);
    }
  }

  async function downloadPng() {
    setBusy("png");
    try {
      const png = await renderPng(cardNodeId, name);
      if (png) download(png.file.name, png.dataUrl);
    } finally {
      setBusy(null);
    }
  }

  function downloadIcs() {
    const who = name.trim() ? `${name.trim()}'s` : "My";
    const ics = buildIcs(sessions, `${who} ${EVENT_NAME} 2026`);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const dataUrl = URL.createObjectURL(blob);
    download("aie-singapore-agenda.ics", dataUrl);
    setTimeout(() => URL.revokeObjectURL(dataUrl), 5000);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={shareX}
        disabled={busy === "x"}
        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy === "x" ? "Preparing…" : "Share on X"}
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-white/[0.06]"
      >
        {copied ? "Link copied ✓" : "Copy link"}
      </button>
      <button
        type="button"
        onClick={downloadPng}
        disabled={busy === "png"}
        className="rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-white/[0.06] disabled:opacity-50"
      >
        {busy === "png" ? "Rendering…" : "Download card (PNG)"}
      </button>
      <button
        type="button"
        onClick={downloadIcs}
        className="rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-white/[0.06]"
      >
        Add all to calendar (.ics)
      </button>
    </div>
  );
}
