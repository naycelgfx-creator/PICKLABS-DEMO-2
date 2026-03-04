import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SparklesCore } from './sparkles';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { GripVertical } from 'lucide-react';

interface CompareProps {
    firstImage?: string;
    secondImage?: string;
    firstContent?: React.ReactNode;
    secondContent?: React.ReactNode;
    className?: string;
    firstImageClassName?: string;
    secondImageClassname?: string;
    initialSliderPercentage?: number;
    slideMode?: 'hover' | 'drag';
    showHandlebar?: boolean;
    autoplay?: boolean;
    autoplayDuration?: number;
}

export const Compare = ({
    firstImage = '',
    secondImage = '',
    firstContent,
    secondContent,
    className,
    firstImageClassName,
    secondImageClassname,
    initialSliderPercentage = 50,
    slideMode = 'hover',
    showHandlebar = true,
    autoplay = false,
    autoplayDuration = 5000,
}: CompareProps) => {
    const [sliderXPercent, setSliderXPercent] = useState(initialSliderPercentage);
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);
    const autoplayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startAutoplay = useCallback(() => {
        if (!autoplay) return;
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = (elapsed % (autoplayDuration * 2)) / autoplayDuration;
            const pct = progress <= 1 ? progress * 100 : (2 - progress) * 100;
            setSliderXPercent(pct);
            autoplayRef.current = setTimeout(animate, 16);
        };
        animate();
    }, [autoplay, autoplayDuration]);

    const stopAutoplay = useCallback(() => {
        if (autoplayRef.current) { clearTimeout(autoplayRef.current); autoplayRef.current = null; }
    }, []);

    useEffect(() => { startAutoplay(); return () => stopAutoplay(); }, [startAutoplay, stopAutoplay]);

    const handleMove = useCallback((clientX: number) => {
        if (!sliderRef.current) return;
        if (slideMode === 'hover' || (slideMode === 'drag' && isDragging)) {
            const rect = sliderRef.current.getBoundingClientRect();
            const pct = ((clientX - rect.left) / rect.width) * 100;
            requestAnimationFrame(() => setSliderXPercent(Math.max(0, Math.min(100, pct))));
        }
    }, [slideMode, isDragging]);

    const handleStart = useCallback(() => {
        if (slideMode === 'drag') setIsDragging(true);
    }, [slideMode]);

    const handleEnd = useCallback(() => {
        if (slideMode === 'drag') setIsDragging(false);
    }, [slideMode]);

    const mouseLeaveHandler = () => {
        if (slideMode === 'hover') setSliderXPercent(initialSliderPercentage);
        if (slideMode === 'drag') setIsDragging(false);
        startAutoplay();
    };

    return (
        <div
            ref={sliderRef}
            className={cn('w-[400px] h-[400px] overflow-hidden', className)}
            style={{ position: 'relative', cursor: slideMode === 'drag' ? 'grab' : 'col-resize' }}
            onMouseMove={(e) => handleMove(e.clientX)}
            onMouseLeave={mouseLeaveHandler}
            onMouseEnter={stopAutoplay}
            onMouseDown={() => handleStart()}
            onMouseUp={() => handleEnd()}
            onTouchStart={(e) => { if (!autoplay) handleStart(); handleMove(e.touches[0].clientX); }}
            onTouchEnd={() => { if (!autoplay) handleEnd(); }}
            onTouchMove={(e) => { if (!autoplay) handleMove(e.touches[0].clientX); }}
        >
            {/* Slider line */}
            <AnimatePresence initial={false}>
                <motion.div
                    className="h-full w-px absolute top-0 z-30"
                    style={{
                        left: `${sliderXPercent}%`,
                        background: 'linear-gradient(to bottom, transparent 5%, #0df20d 50%, transparent 95%)',
                    }}
                    transition={{ duration: 0 }}
                >
                    {/* Glow spread left */}
                    <div
                        className="w-32 h-full absolute top-1/2 -translate-y-1/2 left-0 opacity-30 [mask-image:radial-gradient(80px_at_left,white,transparent)]"
                        style={{ background: 'linear-gradient(to right, #0df20d, transparent)' }}
                    />
                    {/* Sparkles right */}
                    <div className="w-10 h-3/4 top-1/2 -translate-y-1/2 absolute -right-10 [mask-image:radial-gradient(100px_at_left,white,transparent)]">
                        <MemoizedSparkles
                            background="transparent"
                            minSize={0.3}
                            maxSize={0.8}
                            particleDensity={800}
                            className="w-full h-full"
                            particleColor="#0df20d"
                        />
                    </div>
                    {/* Handlebar */}
                    {showHandlebar && (
                        <div className="h-9 w-5 rounded-md top-1/2 -translate-y-1/2 bg-neutral-900 border border-primary/60 z-30 -right-2.5 absolute flex items-center justify-center shadow-[0_0_12px_rgba(13,242,13,0.6)]">
                            <GripVertical className="h-4 w-4 text-primary" />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* First panel — clips to slider position */}
            <div className="overflow-hidden w-full h-full absolute inset-0 z-20 pointer-events-none">
                <AnimatePresence initial={false}>
                    {(firstContent || firstImage) && (
                        <motion.div
                            className={cn('absolute inset-0 z-20 w-full h-full select-none overflow-hidden', firstImageClassName)}
                            style={{ clipPath: `inset(0 ${100 - sliderXPercent}% 0 0)` }}
                            transition={{ duration: 0 }}
                        >
                            {firstContent ?? (
                                <img
                                    alt="before"
                                    src={firstImage}
                                    className={cn('absolute inset-0 z-20 w-full h-full select-none object-cover', firstImageClassName)}
                                    draggable={false}
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Second panel — always behind */}
            <AnimatePresence initial={false}>
                {(secondContent || secondImage) && (
                    <motion.div
                        className={cn('absolute top-0 left-0 z-[19] w-full h-full select-none', secondImageClassname)}
                    >
                        {secondContent ?? (
                            <img
                                alt="after"
                                src={secondImage}
                                className="w-full h-full object-cover"
                                draggable={false}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MemoizedSparkles = React.memo(SparklesCore);
