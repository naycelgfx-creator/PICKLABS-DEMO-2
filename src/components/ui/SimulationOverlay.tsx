import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SimulationOverlayProps {
    isOpen: boolean;
    onCancel: () => void;
    onComplete: () => void;
}

export const SimulationOverlay: React.FC<SimulationOverlayProps> = ({ isOpen, onCancel, onComplete }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isOpen) {
            setProgress(0);
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 10000) {
                        clearInterval(interval);
                        setTimeout(onComplete, 500); // Small delay before closing
                        return 10000;
                    }
                    // Increment by a random amount to look realistic
                    return prev + Math.floor(Math.random() * 300) + 50;
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isOpen, onComplete]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-background-dark/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
                >
                    <div className="max-w-xl w-full text-center space-y-10">
                        <div className="relative inline-block">
                            <span className="material-symbols-outlined text-8xl text-accent-purple animate-pulse">hub</span>
                            <div className="absolute inset-0 border-4 border-accent-purple/20 rounded-full scale-150 animate-ping"></div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Simulating Game Scenarios...</h2>
                            <p className="text-accent-purple font-bold tracking-[0.4em] uppercase text-xs">Neural Engine v4.2 Running 10,000 Iterations</p>
                        </div>

                        <div className="w-full h-1 bg-white dark:bg-white dark:bg-neutral-900 rounded-full overflow-hidden border border-border-muted relative">
                            <div
                                className="h-full bg-accent-purple absolute top-0 left-0 transition-all duration-100 ease-out"
                                style={{ width: `${(progress / 10000) * 100}%` }}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">
                            <div className="bg-white/5 p-3 border border-border-muted rounded">
                                <p className="text-accent-purple mb-1">Status</p>
                                <p className="text-white">
                                    {progress < 3000 ? 'Analyzing Matchups...' :
                                        progress < 6000 ? 'Processing Player Props...' :
                                            progress < 9000 ? 'Calculating Variance...' : 'Finalizing Distribution...'}
                                </p>
                            </div>
                            <div className="bg-white/5 p-3 border border-border-muted rounded">
                                <p className="text-accent-purple mb-1">Progress</p>
                                <p className="text-white">{progress.toLocaleString()} / 10,000</p>
                            </div>
                        </div>

                        <button
                            onClick={onCancel}
                            className="inline-block mt-8 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.3em] border-b border-transparent hover:border-white transition-all italic"
                        >
                            Cancel Sequence
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
