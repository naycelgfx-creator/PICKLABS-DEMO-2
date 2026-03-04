import { cn } from '../../lib/utils';
import { useMotionValue, animate, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import useMeasure from 'react-use-measure';

type InfiniteSliderProps = {
    children: React.ReactNode;
    gap?: number;
    duration?: number;
    speed?: number;
    speedOnHover?: number;
    durationOnHover?: number;
    direction?: 'horizontal' | 'vertical';
    reverse?: boolean;
    className?: string;
};

export function InfiniteSlider({
    children,
    gap = 16,
    duration = 25,
    speed,
    speedOnHover,
    durationOnHover,
    direction = 'horizontal',
    reverse = false,
    className,
}: InfiniteSliderProps) {
    // Allow either duration-based or speed-based (speed = pixels per second)
    const effectiveDuration = speed ? undefined : duration;
    const [currentDuration, setCurrentDuration] = useState(effectiveDuration ?? duration);
    const [ref, { width, height }] = useMeasure();
    const translation = useMotionValue(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [key, setKey] = useState(0);

    useEffect(() => {
        if (!width && !height) return;
        let controls: ReturnType<typeof animate> | undefined;
        const size = direction === 'horizontal' ? width : height;
        const contentSize = size + gap;

        // Speed-based: duration = contentSize / 2 / speed
        const resolvedDuration = speed ? (contentSize / 2) / speed : currentDuration;

        const from = reverse ? -contentSize / 2 : 0;
        const to = reverse ? 0 : -contentSize / 2;

        if (isTransitioning) {
            controls = animate(translation, [translation.get(), to], {
                ease: 'linear',
                duration: resolvedDuration * Math.abs((translation.get() - to) / contentSize),
                onComplete: () => {
                    setIsTransitioning(false);
                    setKey((prev) => prev + 1);
                },
            });
        } else {
            controls = animate(translation, [from, to], {
                ease: 'linear',
                duration: resolvedDuration,
                repeat: Infinity,
                repeatType: 'loop',
                repeatDelay: 0,
                onRepeat: () => { translation.set(from); },
            });
        }

        return () => controls?.stop();
    }, [key, translation, currentDuration, speed, width, height, gap, isTransitioning, direction, reverse]);

    const hoverProps = durationOnHover || speedOnHover
        ? {
            onHoverStart: () => {
                setIsTransitioning(true);
                if (durationOnHover) setCurrentDuration(durationOnHover);
            },
            onHoverEnd: () => {
                setIsTransitioning(true);
                if (effectiveDuration) setCurrentDuration(effectiveDuration);
            },
        }
        : {};

    return (
        <div className={cn('overflow-hidden', className)}>
            <motion.div
                className="flex w-max"
                style={{
                    ...(direction === 'horizontal' ? { x: translation } : { y: translation }),
                    gap: `${gap}px`,
                    flexDirection: direction === 'horizontal' ? 'row' : 'column',
                }}
                ref={ref}
                {...hoverProps}
            >
                {children}
                {children}
            </motion.div>
        </div>
    );
}
