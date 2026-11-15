import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#14213D", 2: "#2A3A5E", soft: "#5C6670" },
        fox: { DEFAULT: "#E8590C", dark: "#C2410C", tint: "#FDEBDD" },
        kraft: { DEFAULT: "#C9A27A", light: "#EBDCC8", dark: "#8A6A47" },
        paper: "#FBFBF8",
        line: "#DCDFE3",
        ok: "#1F7A4D",
      },
      fontFamily: {
        sans: ["'Archivo Variable'", "system-ui", "sans-serif"],
      },
      maxWidth: { page: "1180px" },
    },
  },
  plugins: [],
} satisfies Config;
