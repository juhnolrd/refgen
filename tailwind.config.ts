import type { Config } from "tailwindcss";


export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        spbgeu: {
          primary: '#26B38C',
          purple: '#5C21C7',
          lime: '#B8FF00',
        }
      }
    },
  },
  plugins: [],
} satisfies Config;