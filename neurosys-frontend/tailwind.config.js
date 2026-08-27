/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "primary": "#3525cd",
        "primary-container": "#4f46e5",
        "secondary-container": "#d0e1fb",
        "tertiary-fixed-dim": "#ffb695",
        "error": "#ba1a1a",
        "secondary": "#505f76",
        "on-error": "#ffffff",
        "surface-dim": "#dcd8e5",
        "surface-bright": "#fcf8ff",
        "surface": "#fcf8ff",
        "on-surface-variant": "#464555",
        "surface-container-highest": "#e4e1ee",
        "on-tertiary-fixed-variant": "#7b2f00",
        "tertiary": "#7e3000",
        "secondary-fixed-dim": "#b7c8e1",
        "outline-variant": "#c7c4d8",
        "on-secondary-fixed-variant": "#38485d",
        "background": "#fcf8ff",
        "surface-container-low": "#f5f2ff",
        "on-secondary-fixed": "#0b1c30",
        "on-primary-fixed-variant": "#3323cc",
        "inverse-primary": "#c3c0ff",
        "inverse-on-surface": "#f3effc",
        "on-error-container": "#93000a",
        "on-primary": "#ffffff",
        "outline": "#777587",
        "on-secondary-container": "#54647a",
        "surface-tint": "#4d44e3",
        "secondary-fixed": "#d3e4fe",
        "on-primary-container": "#dad7ff",
        "primary-fixed-dim": "#c3c0ff",
        "on-tertiary-fixed": "#351000",
        "surface-container-lowest": "#ffffff",
        "inverse-surface": "#302f39",
        "primary-fixed": "#e2dfff",
        "surface-container": "#f0ecf9",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#ffd2be",
        "surface-container-high": "#eae6f4",
        "on-primary-fixed": "#0f0069",
        "on-background": "#1b1b24",
        "on-secondary": "#ffffff",
        "on-surface": "#1b1b24",
        "tertiary-fixed": "#ffdbcc",
        "tertiary-container": "#a44100",
        "error-container": "#ffdad6",
        "surface-variant": "#e4e1ee"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "gutter": "16px",
        "sidebar-width": "260px",
        "unit": "4px",
        "container-padding": "24px",
        "sidebar-collapsed": "72px"
      },
      fontFamily: {
        "body-md": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "display": ["Geist", "sans-serif"],
        "mono-sm": ["Geist", "monospace"],
        "label-md": ["Geist", "sans-serif"],
        "headline-md": ["Geist", "sans-serif"],
        "headline-lg": ["Geist", "sans-serif"]
      },
      fontSize: {
        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "mono-sm": ["12px", { "lineHeight": "16px", "fontWeight": "400" }],
        "label-md": ["12px", { "lineHeight": "16px", "letterSpacing": "0.02em", "fontWeight": "500" }],
        "headline-md": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
        "headline-lg": ["28px", { "lineHeight": "36px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
        "display": ["36px", { "lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "700" }]
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-risk": "pulseRisk 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2.5s infinite linear"
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseRisk: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".6", transform: "scale(1.03)" }
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" }
        }
      }
    },
  },
  plugins: [],
}
