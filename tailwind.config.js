/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"]
      },
      colors: {
        leaf: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e"
        }
      },
      backgroundImage: {
        mesh:
          "radial-gradient(ellipse 120% 80% at 100% -20%, rgba(45, 212, 191, 0.28), transparent 50%), radial-gradient(ellipse 90% 60% at -10% 40%, rgba(167, 139, 250, 0.12), transparent 45%), linear-gradient(180deg, #f0fdfa 0%, #fafafa 55%, #f8fafc 100%)"
      },
      boxShadow: {
        glow: "0 0 42px -12px rgba(13, 148, 136, 0.35)",
        "glow-sm": "0 0 24px -8px rgba(13, 148, 136, 0.25)",
        dock: "0 -12px 40px -12px rgba(15, 118, 110, 0.14)"
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "aurora-soft": {
          "0%, 100%": { opacity: "0.25", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(1.05)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-up-delay": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both",
        "fade-up-delay-2": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both",
        "aurora-soft": "aurora-soft 6s ease-in-out infinite",
        shimmer: "shimmer 2.5s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
