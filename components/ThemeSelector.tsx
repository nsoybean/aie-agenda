"use client";

import { THEME_ORDER, THEMES } from "@/lib/themes";
import type { ThemeId } from "@/lib/themes";

export default function ThemeSelector({
  current,
  onChange,
}: {
  current: ThemeId;
  onChange: (t: ThemeId) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="label text-[10px] text-ink-faint">Style</span>
      <div className="flex gap-2">
        {THEME_ORDER.map((id) => {
          const t = THEMES[id];
          const active = id === current;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              title={t.label}
              className={`relative h-7 w-7 rounded-full transition-transform hover:scale-110 ${
                active ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-110" : ""
              }`}
              style={{ background: t.swatch }}
            >
              {active && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px]">
                  {t.isDark ? "✓" : <span style={{ color: "#000" }}>✓</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
