/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // "Antigravity" Light Mode Palette
                primary: "#7C3AED", // Violet 600
                "primary-light": "#A78BFA", // Violet 400
                secondary: "#EC4899", // Pink 500
                accent: "#06B6D4", // Cyan 500

                // Neutral clean tones
                dark: "#0F172A", // Slate 900 (for text)
                "dark-lighter": "#334155", // Slate 700 (for secondary text)
                light: "#F8FAFC", // Slate 50 (background)
                "light-card": "#FFFFFF", // White (card background)
            },
            fontFamily: {
                sans: ['"Outfit"', 'sans-serif'],
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                'soft-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
                'glow': '0 0 15px rgba(124, 58, 237, 0.3)',
                'purple-soft': '0 4px 14px 0 rgba(124, 58, 237, 0.39)', // Added this one
                'purple-hover': '0 6px 20px rgba(124, 58, 237, 0.23)', // Added this one
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'shine': 'shine 1.5s infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                shine: {
                    '100%': { left: '125%' }
                }
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            }
        },
    },
    plugins: [],
}
