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

    return (
        <div className="relative w-full mt-2">
            {/* The Notification Toast */}
            {toastMessage && (
                <div className="absolute -bottom-12 right-0 bg-neutral-900 border border-amber-500 shadow-[0_4px_20px_rgba(245,158,11,0.2)] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg animate-slide-up z-50 whitespace-nowrap">
                    <span className="material-symbols-outlined text-amber-500 text-[14px] align-middle mr-1 relative -top-[1px]">info</span>
                    {toastMessage}
                </div>
            )}

            {/* The Visual Meter */}
            <div className="flex flex-col gap-1.5 p-2 bg-black/20 rounded-lg border border-white/5">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                        AI Tokens Remaining
                    </span>
                    <span className="text-[10px] font-black text-amber-400">
                        {quotaRemaining} / 20
                    </span>
                </div>
                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-amber-400 transition-all duration-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                        style={{ width: `${(quotaRemaining / 20) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
