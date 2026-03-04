import React, { useState, useEffect, useRef } from 'react';
import { BetPick } from '../../App';
import { LiveTicketPanel } from '../shared/LiveTicketPanel';

interface Game {
    team: string;
    line: string;
    type: 'lime-glow' | 'orange-outline';
}

const mockGames: Game[] = [
    { team: 'Lakers', line: '-4.5', type: 'lime-glow' },
    { team: 'Warriors', line: '+2.0', type: 'orange-outline' }
];

interface HolographicBoardViewProps {
    betSlip: BetPick[];
    activeTickets: BetPick[][];
}

export const HolographicBoardView: React.FC<HolographicBoardViewProps> = ({ activeTickets }) => {
    const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
    const [needsPermission, setNeedsPermission] = useState<boolean>(true);
    const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        // Check if we need to show the unlock button
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            setNeedsPermission(true);
        } else {
            setNeedsPermission(false);
            setPermissionGranted(true);
        }
    }, []);

    const handleOrientation = (event: DeviceOrientationEvent) => {
        let xTilt = event.gamma || 0;
        let yTilt = event.beta || 0;

        xTilt = Math.max(-45, Math.min(45, xTilt));
        yTilt = Math.max(-45, Math.min(45, yTilt));

        const xPosition = ((xTilt + 45) / 90) * 100;
        const yPosition = ((yTilt + 45) / 90) * 100;

        cardsRef.current.forEach(card => {
            if (card) {
                card.classList.add('is-active');
                card.style.setProperty('--x', `${xPosition}%`);
                card.style.setProperty('--y', `${yPosition}%`);
            }
        });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!permissionGranted) return; // Only process mouse if active

        const xPosition = (e.clientX / window.innerWidth) * 100;
        const yPosition = (e.clientY / window.innerHeight) * 100;

        cardsRef.current.forEach(card => {
            if (card) {
                card.classList.add('is-active');
                card.style.setProperty('--x', `${xPosition}%`);
                card.style.setProperty('--y', `${yPosition}%`);
            }
        });
    };

    useEffect(() => {
        if (permissionGranted) {
            window.addEventListener('deviceorientation', handleOrientation);
            window.addEventListener('mousemove', handleMouseMove);
        }
        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [permissionGranted]);

    const requestGyroscope = () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            (DeviceOrientationEvent as any).requestPermission()
                .then((permissionState: string) => {
                    if (permissionState === 'granted') {
                        setPermissionGranted(true);
                        setNeedsPermission(false);
                    } else {
                        alert("Permission denied. 3D features will be disabled.");
                    }
                })
                .catch(console.error);
        } else {
            setPermissionGranted(true);
            setNeedsPermission(false);
        }
    };

    return (
        <div className="w-full min-h-[calc(100vh-200px)] flex flex-col items-center justify-start gap-8 bg-[#151518] p-6 pt-24 font-sans text-white relative overflow-hidden">
            <div className="absolute top-6 right-6 z-[100] h-10 w-full max-w-sm">
                <LiveTicketPanel activeTickets={activeTickets} />
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                .tilt-card {
                    background-color: #222226;
                    width: 100%;
                    max-width: 400px;
                    padding: 30px;
                    border-radius: 16px;
                    position: relative;
                    overflow: hidden;
                    border: 1px solid transparent;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    transition: transform 0.2s ease-out;
                }
                .tilt-card:hover {
                    transform: scale(1.02);
                }

                .lime-glow { border-color: #2EFA6B; box-shadow: 0 0 15px rgba(46, 250, 107, 0.2); }
                .orange-outline { border-color: #FF5E00; box-shadow: 0 0 15px rgba(255, 94, 0, 0.2); }

                .tilt-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.3s ease-out;
                    z-index: 10;
                    background: radial-gradient(
                        circle at var(--x, 50%) var(--y, 50%), 
                        rgba(255, 255, 255, 0.2) 0%, 
                        rgba(255, 255, 255, 0) 60%   
                    );
                }

                .lime-glow::before {
                    background: radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(46, 250, 107, 0.3) 0%, transparent 60%);
                }
                .orange-outline::before {
                    background: radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(255, 94, 0, 0.3) 0%, transparent 60%);
                }

                .tilt-card.is-active::before {
                    opacity: 1;
                }
            `}} />

            <div className="text-center mb-4">
                <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white mb-2">3D <span className="text-[#A3FF00]">Holographic</span> Board</h1>
                <p className="text-slate-400 text-sm">Experience our gyro-activated dynamic betting cards.</p>
            </div>

            {needsPermission && (
                <button
                    onClick={requestGyroscope}
                    className="bg-gradient-to-r from-[#2EFA6B] to-[#FF5E00] text-black font-black px-8 py-4 rounded-xl shadow-[0_4px_15px_rgba(46,250,107,0.4)] hover:scale-105 transition-transform"
                >
                    Unlock 3D Motion Features
                </button>
            )}

            <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl justify-center items-center z-10">
                {mockGames.map((game, index) => (
                    <div
                        key={index}
                        className={`tilt-card ${game.type}`}
                        ref={(el) => cardsRef.current[index] = el}
                    >
                        <h2 className="text-2xl font-bold mb-2 m-0">{game.team}</h2>
                        <p className={`text-4xl font-black m-0 mb-4 ${game.type === 'lime-glow' ? 'text-[#2EFA6B]' : 'text-[#FF5E00]'}`}>
                            {game.line}
                        </p>
                        <p className="text-[#A0A0A5] text-sm">Move your phone or mouse to see the edge.</p>
                    </div>
                ))}
            </div>

        </div>
    );
};
