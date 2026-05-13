export type ThemeId = "midnight" | "light" | "vercel" | "claude" | "codex" | "dusk";

export interface CardTheme {
  id: ThemeId;
  label: string;
  /** CSS background for the circular swatch button */
  swatch: string;
  isDark: boolean;
  /** Card background color */
  bg: string;
  /** Primary text color (headings, counts) */
  text: string;
  /** Returns rgba of the text color at a given alpha */
  textAt: (alpha: number) => string;
  /** Hairline frame border color */
  frameBorder: string;
  /** Divider / hr color */
  divider: string;
  /** Aurora / glow blobs. Empty = no glow (Vercel stark) */
  glows: {
    top?: number; bottom?: number; left?: number; right?: number;
    w: number; h: number; color: string;
  }[];
  /** Dark vignette overlay layered over glows */
  vignette?: string;
}

// Helpers
const w = (a: number) => `rgba(255,255,255,${a})`;
const b = (a: number) => `rgba(0,0,0,${a})`;

export const THEMES: Record<ThemeId, CardTheme> = {
  midnight: {
    id: "midnight",
    label: "Midnight",
    swatch: "radial-gradient(circle at 35% 35%, #7c5cff 0%, #000 70%)",
    isDark: true,
    bg: "#000000",
    text: "#ffffff",
    textAt: w,
    frameBorder: w(0.22),
    divider: w(0.18),
    glows: [
      { top: -260, left: -200, w: 760, h: 620, color: "rgba(139,108,255,0.44)" },
      { top: -220, right: -160, w: 620, h: 520, color: "rgba(255,138,92,0.28)" },
      { bottom: -300, left: 220, w: 620, h: 560, color: "rgba(79,212,196,0.18)" },
    ],
    vignette: "radial-gradient(130% 120% at 50% 0%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.82) 100%)",
  },

  light: {
    id: "light",
    label: "Light",
    swatch: "linear-gradient(135deg, #f7f5ef 0%, #e8e2d2 100%)",
    isDark: false,
    // Warm paper — close to Anthropic's cream #f0eee6
    bg: "#f5f2e9",
    text: "#131314",
    textAt: b,
    frameBorder: b(0.11),
    divider: b(0.11),
    glows: [
      { top: -180, left: -120, w: 540, h: 440, color: "rgba(190,170,255,0.20)" },
      { top: -160, right: -100, w: 460, h: 380, color: "rgba(255,180,140,0.18)" },
    ],
    vignette: "radial-gradient(130% 120% at 50% 0%, rgba(245,242,233,0) 45%, rgba(245,242,233,0.50) 100%)",
  },

  vercel: {
    // AI Engineer Singapore brand: pure black, stark, no glow — matches ai.engineer/singapore
    id: "vercel",
    label: "Black",
    swatch: "#000000",
    isDark: true,
    bg: "#000000",
    text: "#ffffff",
    textAt: w,
    frameBorder: w(0.16),
    divider: w(0.16),
    glows: [], // intentionally empty — Vercel is stark mono
    vignette: undefined,
  },

  claude: {
    // Source: anthropic.com brand — #d97757 orange, #f0eee6 cream, #131314 dark bg
    id: "claude",
    label: "Claude",
    swatch: "linear-gradient(135deg, #d97757 0%, #8B4FD0 60%, #1C1917 100%)",
    isDark: true,
    bg: "#1C1917",   // Claude's actual warm dark bg
    text: "#f0eee6", // Anthropic cream
    textAt: (a) => `rgba(240,238,230,${a})`,
    frameBorder: "rgba(217,119,87,0.38)", // Claude orange
    divider: "rgba(217,119,87,0.25)",
    glows: [
      { top: -220, left: -180, w: 700, h: 580, color: "rgba(217,119,87,0.38)" },   // orange
      { top: -180, right: -140, w: 580, h: 480, color: "rgba(139,79,208,0.32)" },  // purple
      { bottom: -280, left: 160,  w: 560, h: 500, color: "rgba(217,119,87,0.15)" },
    ],
    vignette: "radial-gradient(130% 120% at 50% 0%, rgba(28,25,23,0) 35%, rgba(28,25,23,0.82) 100%)",
  },

  codex: {
    // OpenAI / Codex: dark charcoal (#343541), white text, signature green #10A37F
    id: "codex",
    label: "Codex",
    swatch: "linear-gradient(135deg, #202123 0%, #10A37F 100%)",
    isDark: true,
    bg: "#202123",   // ChatGPT sidebar dark
    text: "#ececf1",
    textAt: (a) => `rgba(236,236,241,${a})`,
    frameBorder: "rgba(16,163,127,0.35)", // OpenAI green
    divider: "rgba(16,163,127,0.22)",
    glows: [
      { top: -200, left: -140, w: 600, h: 500, color: "rgba(16,163,127,0.28)" },
      { top: -160, right: -100, w: 480, h: 400, color: "rgba(16,163,127,0.15)" },
      { bottom: -260, left: 180,  w: 540, h: 460, color: "rgba(56,200,160,0.10)" },
    ],
    vignette: "radial-gradient(130% 120% at 50% 0%, rgba(32,33,35,0) 40%, rgba(32,33,35,0.82) 100%)",
  },

  dusk: {
    id: "dusk",
    label: "Dusk",
    swatch: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    isDark: true,
    bg: "#0a0820",
    text: "#f0eeff",
    textAt: (a) => `rgba(240,238,255,${a})`,
    frameBorder: "rgba(180,160,255,0.28)",
    divider: "rgba(180,160,255,0.20)",
    glows: [
      { top: -240, left: -180, w: 700, h: 580, color: "rgba(120,80,255,0.46)" },
      { top: -200, right: -140, w: 580, h: 480, color: "rgba(200,120,255,0.30)" },
      { bottom: -280, left: 160,  w: 600, h: 500, color: "rgba(80,120,255,0.20)" },
    ],
    vignette: "radial-gradient(130% 120% at 50% 0%, rgba(10,8,32,0) 35%, rgba(10,8,32,0.82) 100%)",
  },
};

export const THEME_ORDER: ThemeId[] = ["vercel", "midnight", "dusk", "claude", "codex", "light"];
export const DEFAULT_THEME: ThemeId = "vercel";

export function getTheme(id?: string | null): CardTheme {
  return THEMES[(id as ThemeId) ?? DEFAULT_THEME] ?? THEMES.midnight;
}

/** Topic pill colors adapted for dark vs light card backgrounds */
export function pillColorsForTheme(
  hue: number,
  isDark: boolean,
): { bg: string; border: string; fg: string } {
  if (isDark) {
    return {
      bg: `hsla(${hue},65%,55%,0.16)`,
      border: `hsla(${hue},60%,62%,0.36)`,
      fg: `hsl(${hue},82%,80%)`,
    };
  }
  return {
    bg: `hsla(${hue},60%,42%,0.10)`,
    border: `hsla(${hue},55%,38%,0.32)`,
    fg: `hsl(${hue},65%,30%)`,
  };
}
