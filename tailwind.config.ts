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
        bg:            "var(--bg)",
        fg:            "var(--fg)",
        muted:         "var(--muted)",
        primary:       "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        success:       "var(--success)",
        error:         "var(--error)",
        border:        "var(--border)",
      },
    },
  },
  plugins: [],
};

export default config;
