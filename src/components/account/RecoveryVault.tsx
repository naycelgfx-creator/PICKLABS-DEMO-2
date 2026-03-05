import React, { useState } from 'react';

interface RecoveryVaultProps {
    codes: string[];
    onClose?: () => void;
}

export const RecoveryVault: React.FC<RecoveryVaultProps> = ({ codes, onClose }) => {
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

    const handleDownload = () => {
        const textToSave = "PICKLABS EMERGENCY RECOVERY CODES\n" +
            "Keep this file safe!\n\n" +
            codes.join("\n");
        const blob = new Blob([textToSave], { type: "text/plain" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "PickLabs_Recovery_Codes.txt";
        link.click();
    };

    const handleCopy = (code: string, idx: number) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopiedIdx(idx);
            setTimeout(() => setCopiedIdx(null), 1500);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    };

    return (
        <div className="relative bg-neutral-950 border border-primary/30 rounded-2xl p-6 w-full mx-auto text-center overflow-hidden shadow-[0_0_40px_rgba(13,242,13,0.08)]">
            {/* Corner glow */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] pointer-events-none -z-0" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[60px] pointer-events-none -z-0" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shadow-[0_0_10px_rgba(13,242,13,0.15)]">
                        <span className="material-symbols-outlined text-primary text-base">lock</span>
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-[0.2em] text-primary">
                        PickLabs Secure Vault
                    </h4>
                </div>
                <p className="text-[11px] text-text-muted font-bold uppercase tracking-widest mb-5">
                    Save these codes in a safe place — each works only once
                </p>

                {/* Code Grid */}
                <div className="grid grid-cols-2 gap-2 bg-black/60 p-4 rounded-xl border border-white/5 mb-5">
                    {codes.map((code, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-neutral-900 border border-primary/20 py-2 px-3 rounded-lg group transition-colors hover:border-primary/40">
                            <span className="font-mono text-primary text-sm tracking-[2px] font-black">{code}</span>
                            <button
                                onClick={() => handleCopy(code, idx)}
                                className="text-text-muted hover:text-primary transition-colors ml-2 flex items-center"
                                title="Copy Code"
                            >
                                <span className="material-symbols-outlined text-[14px]">
                                    {copiedIdx === idx ? 'check' : 'content_copy'}
                                </span>
                            </button>
                        </div>
                    ))}
                </div>

                {/* Download Button */}
                <button
                    onClick={handleDownload}
                    className="w-full py-3 bg-primary/10 text-primary border border-primary/30 font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-primary hover:text-black transition-all duration-300 shadow-[0_0_20px_rgba(13,242,13,0.05)] hover:shadow-[0_0_20px_rgba(13,242,13,0.3)] mb-3"
                >
                    <span className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-sm">download</span>
                        Download Recovery File
                    </span>
                </button>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-[11px] text-text-muted hover:text-white transition-colors font-bold uppercase tracking-widest"
                    >
                        Close Secure Vault
                    </button>
                )}
            </div>
        </div>
    );
};
