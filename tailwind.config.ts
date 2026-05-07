import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Design system tokens ──────────────────────────────────
        page:  "var(--bg-page)",
        panel: "var(--bg-panel)",
        card:  "var(--bg-card)",

        accent: {
          DEFAULT: "var(--accent)",
          hover:   "var(--accent-hover)",
          soft:    "var(--accent-soft)",
        },

        "text-secondary": "var(--text-secondary)",
        "text-tertiary":  "var(--text-tertiary)",

        success: {
          DEFAULT: "var(--success)",
          soft:    "var(--success-soft)",
        },
        error: {
          DEFAULT: "var(--error)",
          soft:    "var(--error-soft)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong:  "var(--border-strong)",
        },

        // ── Legacy aliases — keep existing app pages working ──────
        bg:              "var(--bg)",
        fg:              "var(--fg)",
        muted:           "var(--muted)",
        primary:         "var(--primary)",
        "primary-hover": "var(--primary-hover)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans:    ["var(--font-body)"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      maxWidth: {
        page:    "1100px",
        reading: "720px",
      },
      boxShadow: {
        hover: "var(--shadow-hover)",
      },
    },
  },
  plugins: [],
};

export default config;
