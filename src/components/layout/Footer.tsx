import React from 'react';
import { GlobalNewsTicker } from './GlobalNewsTicker';

export const Footer: React.FC = () => {
    return (
        <footer className="border-t border-border-muted bg-background-dark mt-auto">
            {/* News Ticker — stays in footer, scrolls at readable speed */}
            <GlobalNewsTicker />

            {/* Copyright info */}
            <div className="max-w-[1440px] mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4 opacity-50 hover:opacity-100 transition-all duration-300 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    <img src="/picklabs-logo.svg" alt="XCC" className="h-6 w-auto opacity-80 group-hover:drop-shadow-[0_0_15px_rgba(17,248,183,1)] group-hover:scale-105 transition-all duration-300" />
                    <div className="transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
                        <p className="font-black text-white md:text-text-main text-sm uppercase italic group-hover:text-white transition-colors duration-300">PickLabs Advanced Matchup Terminal</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors duration-300">POWERED BY NAYCELGFX LLC©</p>
                    </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        © 2026 PICKLABS. ALL RIGHTS RESERVED.
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        <span className="text-red-500 font-black">21+</span> FOR ENTERTAINMENT ONLY. PLEASE GAMBLE RESPONSIBLY.
                    </p>
                </div>
            </div>
        </footer>
    );
};
