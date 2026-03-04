import { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';

// ── TextHoverEffect ────────────────────────────────────────────────────────
// Renders text as an SVG outline. Default stroke = PickLabs green (#0ca810).
// On hover the cursor reveals a green radial gradient glow through a mask.
export const TextHoverEffect = ({
    text,
    duration,
    className,
}: {
    text: string;
    duration?: number;
    automatic?: boolean;
    className?: string;
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [cursor, setCursor] = useState({ x: 0, y: 0 });
    const [hovered, setHovered] = useState(false);
    const [maskPosition, setMaskPosition] = useState({ cx: '50%', cy: '50%' });

    useEffect(() => {
        if (svgRef.current && cursor.x !== null && cursor.y !== null) {
            const rect = svgRef.current.getBoundingClientRect();
            setMaskPosition({
                cx: `${((cursor.x - rect.left) / rect.width) * 100}%`,
                cy: `${((cursor.y - rect.top) / rect.height) * 100}%`,
            });
        }
    }, [cursor]);

    return (
        <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox="0 0 300 100"
            xmlns="http://www.w3.org/2000/svg"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
            className={`select-none uppercase cursor-pointer ${className ?? ''}`}
        >
            <defs>
                {/* Green glow gradient revealed where cursor is */}
                <radialGradient id="plGreenGradient" gradientUnits="userSpaceOnUse" cx="50%" cy="50%" r="25%">
                    {hovered && (
                        <>
                            <stop offset="0%" stopColor="#6dff72" />
                            <stop offset="30%" stopColor="#0ca810" />
                            <stop offset="60%" stopColor="#057a07" />
                            <stop offset="100%" stopColor="#024003" />
                        </>
                    )}
                </radialGradient>

                {/* Radial mask that follows the cursor */}
                <motion.radialGradient
                    id="plRevealMask"
                    gradientUnits="userSpaceOnUse"
                    r="20%"
                    initial={{ cx: '50%', cy: '50%' }}
                    animate={maskPosition}
                    transition={{ duration: duration ?? 0, ease: 'easeOut' }}
                >
                    <stop offset="0%" stopColor="white" />
                    <stop offset="100%" stopColor="black" />
                </motion.radialGradient>

                <mask id="plTextMask">
                    <rect x="0" y="0" width="100%" height="100%" fill="url(#plRevealMask)" />
                </mask>
            </defs>

            {/* Faint outline — visible only on hover */}
            <text
                x="50%" y="50%"
                textAnchor="middle" dominantBaseline="middle"
                strokeWidth="0.3"
                className="fill-transparent font-[helvetica] text-7xl font-bold"
                style={{
                    stroke: '#0ca810',
                    opacity: hovered ? 0.25 : 0,
                    transition: 'opacity 0.3s',
                }}
            >
                {text}
            </text>

            {/* Animated draw-on outline — always visible, PickLabs green */}
            <motion.text
                x="50%" y="50%"
                textAnchor="middle" dominantBaseline="middle"
                strokeWidth="0.3"
                className="fill-transparent font-[helvetica] text-7xl font-bold"
                style={{ stroke: '#0ca810' }}
                initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
                animate={{ strokeDashoffset: 0, strokeDasharray: 1000 }}
                transition={{ duration: 4, ease: 'easeInOut' }}
            >
                {text}
            </motion.text>

            {/* Bright green glow revealed by cursor mask */}
            <text
                x="50%" y="50%"
                textAnchor="middle" dominantBaseline="middle"
                stroke="url(#plGreenGradient)"
                strokeWidth="0.3"
                mask="url(#plTextMask)"
                className="fill-transparent font-[helvetica] text-7xl font-bold"
                style={{
                    filter: hovered ? 'drop-shadow(0 0 6px #0ca810)' : 'none',
                    transition: 'filter 0.3s',
                }}
            >
                {text}
            </text>
        </svg>
    );
};

// ── FooterBackgroundGradient ───────────────────────────────────────────────
export const FooterBackgroundGradient = () => (
    <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
            background:
                'radial-gradient(125% 125% at 50% 10%, #0F0F1166 50%, #0ca81022 100%)',
        }}
    />
);
