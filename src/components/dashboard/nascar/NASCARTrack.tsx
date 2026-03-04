import React, { useMemo, useState } from 'react';
import { Game } from '../../../data/mockGames';

interface NASCARTrackProps {
    game: Game;
}

// Seeded random for deterministic car positions
function seededRandom(seed: number) {
    let s = seed;
    return () => {
        s = (s * 1664525 + 1013904223) & 0xffffffff;
        return (s >>> 0) / 0xffffffff;
    };
}

function seed(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return Math.abs(h);
}

// Generate car positions along an oval path
function getOvalPoint(t: number, rx: number, ry: number, cx: number, cy: number) {
    const angle = t * Math.PI * 2;
    return {
        x: cx + rx * Math.cos(angle),
        y: cy + ry * Math.sin(angle),
    };
}

type Sector = 'Turn 1' | 'Back Straight' | 'Turn 3' | 'Front Straight';

interface CarData {
    pos: number;       // 1-indexed position
    num: string;
    driver: string;
    t: number;        // 0–1 position around oval
    speed: number;    // mph
    sector: Sector;
    lapsLed: number;
}

const SECTOR_LABELS: { range: [number, number]; label: Sector }[] = [
    { range: [0.05, 0.2], label: 'Turn 1' },
    { range: [0.2, 0.45], label: 'Back Straight' },
    { range: [0.45, 0.7], label: 'Turn 3' },
    { range: [0.7, 0.95], label: 'Front Straight' },
];

function getSector(t: number): Sector {
    const wrapped = t % 1;
    for (const { range, label } of SECTOR_LABELS) {
        if (wrapped >= range[0] && wrapped < range[1]) return label;
    }
    return 'Front Straight';
}

const DRIVER_NAMES = [
    'C. Bell', 'D. Hamlin', 'M. Truex Jr', 'K. Larson', 'W. Byron',
    'R. Blaney', 'T. Keselowski', 'A. Bowman', 'A. Dillon', 'C. Reddick',
    'B. Elliott', 'M. McDowell', 'C. McDowell', 'E. Jones', 'R. Cindric',
    'H. Gragson', 'D. Patrick', 'T. Dillon', 'J. McMurray', 'B. Keselowski',
];

const CAR_NUMBERS = [
    '20', '11', '19', '5', '24', '12', '6', '48', '3', '8',
    '9', '34', '34', '43', '2', '42', '77', '13', '1', '2',
];

const CAR_COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#e91e63', '#00bcd4', '#8bc34a',
    '#ff5722', '#607d8b', '#795548', '#9c27b0', '#03a9f4',
    '#cddc39', '#ff9800', '#f44336', '#4caf50', '#673ab7',
];

function generateCars(name1: string, name2: string): CarData[] {
    const rng = seededRandom(seed(name1 + name2));
    return Array.from({ length: 20 }, (_, i) => {
        const baseT = 1 - (i / 20); // lead car at t=1
        const scatter = rng() * 0.03;
        const t = (baseT + scatter) % 1;
        return {
            pos: i + 1,
            num: CAR_NUMBERS[i] ?? String(i + 1),
            driver: DRIVER_NAMES[i] ?? `Driver ${i + 1}`,
            t,
            speed: Math.round(175 + rng() * 30),
            sector: getSector(t),
            lapsLed: i === 0 ? Math.round(50 + rng() * 100) : Math.round(rng() * 40),
        };
    });
}

const W = 800;
const H = 420;
const CX = W / 2;
const CY = H / 2;
const RX = 300;
const RY = 150;
const TRACK_W = 36;

// Track border outer/inner radii
const ROX = RX + TRACK_W;
const ROY = RY + TRACK_W;
const RIX = RX - TRACK_W;
const RIY = RY - TRACK_W;

function ovalPath(rx: number, ry: number, cx: number, cy: number): string {
    return `M ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy} Z`;
}

export const NASCARTrack: React.FC<NASCARTrackProps> = ({ game }) => {
    const name1 = game.homeTeam?.name ?? 'Driver A';
    const name2 = game.awayTeam?.name ?? 'Driver B';
    const cars = useMemo(() => generateCars(name1, name2), [name1, name2]);
    const [hovered, setHovered] = useState<number | null>(null);
    const [highlightSector, setHighlightSector] = useState<Sector | null>(null);

    const sectorColors: Record<Sector, string> = {
        'Turn 1': '#f59e0b',
        'Back Straight': '#22d3ee',
        'Turn 3': '#a78bfa',
        'Front Straight': '#4ade80',
    };

    return (
        <div className="terminal-panel mt-6 overflow-hidden col-span-12">
            {/* Header */}
            <div className="p-4 border-b border-border-muted flex flex-wrap items-center justify-between gap-3 bg-white/5">
                <h3 className="text-xs font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-400 text-sm">flag</span>
                    NASCAR Oval — Track Position Map
                </h3>
                {/* Sector filter */}
                <div className="flex gap-1 flex-wrap">
                    {(['Turn 1', 'Back Straight', 'Turn 3', 'Front Straight'] as Sector[]).map(s => (
                        <button key={s}
                            onClick={() => setHighlightSector(p => p === s ? null : s)}
                            className="text-[9px] font-black uppercase px-2 py-1 rounded border transition-all"
                            style={{
                                background: highlightSector === s ? sectorColors[s] + '30' : 'transparent',
                                borderColor: highlightSector === s ? sectorColors[s] : '#374151',
                                color: highlightSector === s ? sectorColors[s] : '#6b7280',
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* SVG Track */}
            <div className="p-4 bg-background-dark">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="NASCAR Oval Track">
                    <defs>
                        {/* Asphalt texture gradient */}
                        <radialGradient id="asphalt" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#1a1a2e" />
                            <stop offset="100%" stopColor="#0f0f1a" />
                        </radialGradient>
                        {/* Track surface gradient */}
                        <radialGradient id="trackSurface" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#374151" />
                            <stop offset="100%" stopColor="#1f2937" />
                        </radialGradient>
                        {/* Infield gradient */}
                        <radialGradient id="infield" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#14532d" />
                            <stop offset="100%" stopColor="#065f46" />
                        </radialGradient>
                        {/* Speed blur filter */}
                        <filter id="blur-sm">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
                        </filter>
                        {/* Glow */}
                        <filter id="glow">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                    </defs>

                    {/* Background */}
                    <rect width={W} height={H} fill="url(#asphalt)" />

                    {/* Outer wall (white) */}
                    <path d={ovalPath(ROX + 6, ROY + 6, CX, CY)} fill="#e5e7eb" opacity="0.15" />

                    {/* Track surface */}
                    <path d={ovalPath(ROX, ROY, CX, CY)} fill="url(#trackSurface)" />

                    {/* Infield */}
                    <path d={ovalPath(RIX, RIY, CX, CY)} fill="url(#infield)" />

                    {/* APRON (inner concrete) */}
                    <path d={ovalPath(RIX - 8, RIY - 8, CX, CY)} fill="#374151" opacity={0.4} />

                    {/* Track lane dividers */}
                    {[0.33, 0.66].map((f, i) => (
                        <path key={i} d={ovalPath(RIX + (ROX - RIX) * f, RIY + (ROY - RIY) * f, CX, CY)}
                            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" strokeDasharray="10,8" />
                    ))}

                    {/* Pit road (straight bottom) */}
                    <rect x={CX - 95} y={CY + RY + TRACK_W - 2} width={190} height={16} rx={3} fill="#4b5563" opacity={0.7} />
                    <text x={CX} y={CY + RY + TRACK_W + 10} textAnchor="middle" fontSize={7} fontFamily="monospace" fontWeight={700} fill="rgba(250,204,21,0.7)">PIT ROAD</text>

                    {/* Start/Finish line */}
                    <rect x={CX - 2} y={CY + RY - 2} width={4} height={TRACK_W + 4} fill="white" opacity={0.9} />
                    <text x={CX + 10} y={CY + RY + TRACK_W / 2 + 3} fontSize={7} fontFamily="monospace" fontWeight={800} fill="white" opacity={0.8}>S/F</text>

                    {/* Sector labels */}
                    <text x={CX} y={CY - RY - TRACK_W - 8} textAnchor="middle" fontSize={8} fontFamily="monospace" fontWeight={700} fill={sectorColors['Back Straight']} opacity={highlightSector === 'Back Straight' ? 1 : 0.4}>BACK STRAIGHT</text>
                    <text x={CX} y={CY + RY + TRACK_W + 28} textAnchor="middle" fontSize={8} fontFamily="monospace" fontWeight={700} fill={sectorColors['Front Straight']} opacity={highlightSector === 'Front Straight' ? 1 : 0.4}>FRONT STRAIGHT</text>
                    <text x={CX - RX - TRACK_W - 8} y={CY + 4} textAnchor="middle" fontSize={8} fontFamily="monospace" fontWeight={700} fill={sectorColors['Turn 1']} opacity={highlightSector === 'Turn 1' ? 1 : 0.4} transform={`rotate(-90,${CX - RX - TRACK_W - 8},${CY})`}>TURN 1-2</text>
                    <text x={CX + RX + TRACK_W + 8} y={CY + 4} textAnchor="middle" fontSize={8} fontFamily="monospace" fontWeight={700} fill={sectorColors['Turn 3']} opacity={highlightSector === 'Turn 3' ? 1 : 0.4} transform={`rotate(90,${CX + RX + TRACK_W + 8},${CY})`}>TURN 3-4</text>

                    {/* Infield logos / labels */}
                    {game.homeTeam?.logo && (
                        <image href={game.homeTeam.logo} x={CX - 30} y={CY - 30} width={60} height={60} opacity={0.18} preserveAspectRatio="xMidYMid meet" />
                    )}
                    <text x={CX} y={CY + 10} textAnchor="middle" fontSize={9} fontFamily="monospace" fontWeight={900} fill="rgba(250,204,21,0.5)">NASCAR</text>

                    {/* Speed trail effect for leading cars */}
                    {cars.slice(0, 5).map((car, i) => {
                        const pt = getOvalPoint(car.t, RX, RY, CX, CY);
                        return (
                            <circle key={`trail-${i}`} cx={pt.x} cy={pt.y} r={10}
                                fill={CAR_COLORS[i] ?? '#fff'} opacity={0.06} filter="url(#blur-sm)" />
                        );
                    })}

                    {/* Cars */}
                    {cars.map((car, i) => {
                        const pt = getOvalPoint(car.t, RX, RY, CX, CY);
                        const isTop3 = car.pos <= 3;
                        const isHovered = hovered === i;
                        const sectorMatch = !highlightSector || car.sector === highlightSector;
                        const color = CAR_COLORS[i] ?? '#fff';
                        const opacity = sectorMatch ? 1 : 0.2;
                        const r = isTop3 ? 6 : 4.5;

                        return (
                            <g key={i} opacity={opacity}
                                onMouseEnter={() => setHovered(i)}
                                onMouseLeave={() => setHovered(null)}
                                style={{ cursor: 'pointer' }}>
                                {/* Glow for top 3 */}
                                {isTop3 && (
                                    <circle cx={pt.x} cy={pt.y} r={r + 5} fill={color} opacity={0.15} filter="url(#glow)" />
                                )}
                                {/* Car dot */}
                                <circle cx={pt.x} cy={pt.y} r={r}
                                    fill={color}
                                    stroke={isHovered ? 'white' : color}
                                    strokeWidth={isHovered ? 2 : 0.8}
                                    filter={isTop3 ? 'url(#glow)' : undefined}
                                />
                                {/* Car number — only top 6 or hovered */}
                                {(isTop3 || isHovered) && (
                                    <text x={pt.x} y={pt.y + 3} textAnchor="middle" fontSize={5} fontFamily="monospace"
                                        fontWeight={900} fill="white">#{car.num}</text>
                                )}
                                {/* Tooltip on hover */}
                                {isHovered && (
                                    <g>
                                        <rect x={pt.x + 10} y={pt.y - 32} width={90} height={38} rx={4} fill="#0f0f1a" stroke={color} strokeWidth={1} opacity={0.95} />
                                        <text x={pt.x + 14} y={pt.y - 18} fontSize={7} fontFamily="monospace" fontWeight={800} fill={color}>P{car.pos} #{car.num} {car.driver}</text>
                                        <text x={pt.x + 14} y={pt.y - 8} fontSize={6.5} fontFamily="monospace" fill="#94a3b8">{car.speed} mph • {car.sector}</text>
                                        <text x={pt.x + 14} y={pt.y + 2} fontSize={6.5} fontFamily="monospace" fill="#94a3b8">Laps Led: {car.lapsLed}</text>
                                    </g>
                                )}
                            </g>
                        );
                    })}

                    {/* Position legend — top 5 */}
                    <rect x={14} y={14} width={110} height={72} rx={4} fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
                    <text x={20} y={26} fontSize={7} fontFamily="monospace" fontWeight={800} fill="rgba(250,204,21,0.8)">TOP POSITIONS</text>
                    {cars.slice(0, 5).map((car, i) => (
                        <g key={`leg-${i}`}>
                            <circle cx={24} cy={36 + i * 11} r={4} fill={CAR_COLORS[i] ?? '#fff'} />
                            <text x={34} y={39 + i * 11} fontSize={7} fontFamily="monospace" fontWeight={700} fill="rgba(255,255,255,0.85)">
                                P{car.pos} #{car.num} {car.driver}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>

            {/* Speed + Lap data strip */}
            <div className="p-3 border-t border-border-muted bg-background-dark">
                <div className="flex flex-wrap gap-2 justify-center">
                    {cars.slice(0, 8).map((car, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-full border text-[9px] font-black uppercase"
                            style={{ borderColor: CAR_COLORS[i] + '60', background: CAR_COLORS[i] + '15', color: CAR_COLORS[i] }}>
                            <span className="text-[8px] text-slate-400">P{car.pos}</span>
                            #{car.num} {car.driver} — {car.speed} mph
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-[9px] text-slate-600 text-center py-2 font-medium">
                🏁 Simulated track positions — hover cars for details
            </p>
        </div>
    );
};
