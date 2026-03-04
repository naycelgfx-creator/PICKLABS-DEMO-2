import React, { useState, useEffect, useRef } from 'react';
import { useRookieMode } from '../../contexts/RookieModeContext';
import { getCurrentUser } from '../../data/PickLabsAuthDB';

export const FreeModeQuotaMeter: React.FC = () => {
    const { quotaRemaining } = useRookieMode();
    const prevRemainingRef = useRef(quotaRemaining);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const session = getCurrentUser();
    const isPremium = session?.isPremium;

    // Show toast only when quotaRemaining decreases
    useEffect(() => {
        if (quotaRemaining < prevRemainingRef.current) {
            setToastMessage(`AI feature used! You have ${quotaRemaining} of 20 weekly tokens remaining.`);
            const timer = setTimeout(() => {
                setToastMessage(null);
            }, 3000);
            prevRemainingRef.current = quotaRemaining;
            return () => clearTimeout(timer);
        } else if (quotaRemaining > prevRemainingRef.current) {
            // In case it resets
            prevRemainingRef.current = quotaRemaining;
        }
    }, [quotaRemaining]);

    if (isPremium) {
        return null; // Premium users don't see the quota meter
    }

    // 20 physical squares
    const totalSquares = 20;
    const squares = Array.from({ length: totalSquares }, (_, i) => i < quotaRemaining);

    return (
        <div className="relative flex flex-col items-center gap-1 xl:mt-0 mt-3 mr-2">
            {/* The Notification Toast */}
            {toastMessage && (
                <div className="absolute -bottom-12 right-0 bg-neutral-900 border border-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.2)] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg animate-slide-up z-50 whitespace-nowrap">
                    <span className="material-symbols-outlined text-amber-500 text-[14px] align-middle mr-1 relative -top-[1px]">info</span>
                    {toastMessage}
                </div>
            )}

            {/* The Visual Meter */}
            <div className="flex flex-col items-end">
                <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                    Free AI Tokens
                </span>
                <div className="flex gap-[2px]">
                    {squares.map((isAvailable, index) => (
                        <div
                            key={index}
                            className={`h-3 w-[6px] rounded-[1px] transition-all duration-300 ${isAvailable
                                ? 'bg-amber-400 border border-amber-300 shadow-[0_0_5px_rgba(251,191,36,0.3)]'
                                : 'bg-neutral-800 border items-end border-neutral-700 animate-fade-out scale-90'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
