import React, { useState } from 'react';
import { ViewType } from './PremiumLockView';

interface PremiumUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (v: ViewType) => void;
}

export const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({ isOpen, onClose, onNavigate }) => {
    const [selectedTier, setSelectedTier] = useState<{ name: string, price: string } | null>(null);

    if (!isOpen) {
        // Reset state when closed
        if (selectedTier) setSelectedTier(null);
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-sm bg-neutral-900 border border-amber-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.2)] animate-slide-up overflow-hidden">

                {/* Close Button */}
                <button
                    onClick={() => {
                        setSelectedTier(null);
                        onClose();
                    }}
                    className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors z-10"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                {!selectedTier ? (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                            <span className="material-symbols-outlined text-3xl text-amber-500">lock</span>
                        </div>

                        <h2 className="text-2xl font-black italic uppercase text-text-main mb-2 tracking-tight">
                            Premium Matchup Terminal
                        </h2>

                        <p className="text-xs text-text-muted mb-6 leading-relaxed">
                            Upgrade to <span className="text-white font-bold">Premium</span> to unlock unlimited AI predictions, the Advanced Matchup Terminal, and sharp sports betting analytics.
                        </p>

                        {/* Tier Selection (Ported from User HTML) */}
                        <div className="flex flex-col gap-3 w-full mb-4">
                            <button
                                onClick={() => setSelectedTier({ name: '3 Day Premium', price: '$10' })}
                                className="w-full flex justify-between items-center p-4 bg-neutral-800 border border-neutral-700 hover:border-amber-500 rounded-xl transition-all group hover:bg-neutral-800/80"
                            >
                                <span className="font-bold text-white group-hover:text-amber-500 transition-colors">3 Day Access</span>
                                <span className="font-black text-amber-500 text-lg">$10</span>
                            </button>

                            <button
                                onClick={() => setSelectedTier({ name: '7 Day Premium', price: '$20' })}
                                className="w-full flex justify-between items-center p-4 bg-neutral-800 border border-amber-500/30 hover:border-amber-500 rounded-xl transition-all group hover:bg-neutral-800/80 relative overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                            >
                                <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-widest">Most Popular</div>
                                <span className="font-bold text-white group-hover:text-amber-500 transition-colors">7 Day Access</span>
                                <span className="font-black text-amber-500 text-lg">$20</span>
                            </button>

                            <button
                                onClick={() => setSelectedTier({ name: '30 Day Premium', price: '$50' })}
                                className="w-full flex justify-between items-center p-4 bg-neutral-800 border border-neutral-700 hover:border-amber-500 rounded-xl transition-all group hover:bg-neutral-800/80"
                            >
                                <span className="font-bold text-white group-hover:text-amber-500 transition-colors">30 Day Access</span>
                                <span className="font-black text-amber-500 text-lg">$50</span>
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setSelectedTier(null);
                                onClose();
                            }}
                            className="mt-2 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center animate-fade-in">
                        <button
                            onClick={() => setSelectedTier(null)}
                            className="self-start text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1 mb-2 font-bold uppercase tracking-widest"
                        >
                            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                            Back
                        </button>

                        <h2 className="text-xl font-black italic uppercase text-text-main mb-1 tracking-tight">
                            Complete Payment
                        </h2>

                        <p className="text-sm font-bold text-amber-500 mb-4 bg-amber-500/10 px-4 py-1.5 rounded-lg border border-amber-500/20">
                            Paying for: {selectedTier.name} ({selectedTier.price})
                        </p>

                        <p className="text-xs text-slate-300 mb-4">
                            Scan the Cash App QR Code below to securely complete your payment.
                        </p>

                        <div className="bg-white p-3 rounded-xl mb-4 shadow-xl border-4 border-neutral-800">
                            {/* Placeholder for actual CashApp QR Code */}
                            <div className="w-[180px] h-[180px] bg-slate-200 flex items-center justify-center flex-col gap-2 rounded-lg border border-slate-300">
                                <span className="material-symbols-outlined text-4xl text-[#00D632]">qr_code_scanner</span>
                                <span className="text-[#00D632] font-black tracking-tighter text-sm">CASH APP</span>
                            </div>
                        </div>

                        <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg w-full mb-6">
                            <p className="text-[11px] text-red-200 leading-tight">
                                <strong className="text-red-500 block mb-1 uppercase tracking-widest">⚠️ Important Step</strong>
                                You <span className="font-bold text-white">MUST</span> put your PickLabs email/username in the Cash App note so we can activate your account!
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                setSelectedTier(null);
                                onClose();
                            }}
                            className="w-full py-3 bg-neutral-800 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-neutral-700 transition-colors border border-neutral-700"
                        >
                            I've Sent Payment
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
