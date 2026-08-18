import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0d10",
        panel: "#12151a",
        border: "#1f242b",
        accent: "#e88b3c",
        accent2: "#7be6d8",
        muted: "#9aa2ab",
      },
    },
  },
  plugins: [],
};
export default config;
