import { fontFamily as _fontFamily } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Generics
        background: "var(--background)",
        foreground: "var(--foreground)",
        icon: "var(--icon)",
        border: "var(--border)",
        ring: "var(--ring)",

        primary: {
          DEFAULT: "var(--primary)",
          active: "var(--primary-active)",
          disabled: "var(--primary-disabled)",
          focus: "var(--primary-focus)",
          hover: "var(--primary-hover)",
        },
      },
    },
  },
  plugins: [],
};
