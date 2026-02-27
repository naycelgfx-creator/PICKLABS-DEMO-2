/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "rgb(var(--primary) / <alpha-value>)",
                "accent-purple": "rgb(var(--accent-purple) / <alpha-value>)",
                "background-dark": "rgb(var(--bg-dark) / <alpha-value>)",
                "neutral-800": "rgb(var(--neutral-800) / <alpha-value>)",
                "neutral-900": "rgb(var(--neutral-900) / <alpha-value>)",
                "border-muted": "rgb(var(--border-muted) / <alpha-value>)",
                "text-main": "rgb(var(--text-main) / <alpha-value>)",
                "text-muted": "rgb(var(--text-muted) / <alpha-value>)",
            },
            fontFamily: {
                "display": ["Space Grotesk", "sans-serif"]
            },
            keyframes: {
                'neon-pulse': {
                    '0%, 100%': { boxShadow: '0 0 15px rgba(168, 85, 247, 0.4), 0 0 5px rgba(168, 85, 247, 0.2)' },
                    '50%': { boxShadow: '0 0 30px rgba(168, 85, 247, 0.8), 0 0 10px rgba(168, 85, 247, 0.4)' },
                },
                'shimmer': {
                    '100%': { transform: 'translateX(100%)' }
                },
                'glow-hot': {
                    '0%, 100%': { filter: 'drop-shadow(0 0 2px #0df20d) drop-shadow(0 0 8px #0df20d)' },
                    '50%': { filter: 'drop-shadow(0 0 4px #0df20d) drop-shadow(0 0 16px #0df20d)' },
                },
                'glow-cold': {
                    '0%, 100%': { filter: 'drop-shadow(0 0 2px #ef4444) drop-shadow(0 0 8px #ef4444)' },
                    '50%': { filter: 'drop-shadow(0 0 4px #ef4444) drop-shadow(0 0 16px #ef4444)' },
                },
                'marquee': {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                'spin-around': {
                    '0%': { transform: 'translateZ(0) rotate(0)' },
                    '15%, 35%': { transform: 'translateZ(0) rotate(90deg)' },
                    '65%, 85%': { transform: 'translateZ(0) rotate(270deg)' },
                    '100%': { transform: 'translateZ(0) rotate(360deg)' },
                },
                'shimmer-slide': {
                    to: { transform: 'translate(calc(100cqw - 100%), 0)' },
                },
            },
            animation: {
                'neon-pulse': 'neon-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'shimmer': 'shimmer 2s infinite',
                'glow-hot': 'glow-hot 1.5s ease-in-out infinite',
                'glow-cold': 'glow-cold 1.5s ease-in-out infinite',
                'marquee': 'marquee 40s linear infinite',
                'shimmer-slide': 'shimmer-slide var(--speed) ease-in-out infinite alternate',
                'spin-around': 'spin-around calc(var(--speed) * 2) infinite linear',
            }
        },
    },
    plugins: [],
}
