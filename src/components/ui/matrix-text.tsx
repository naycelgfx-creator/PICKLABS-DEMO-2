import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface LetterState {
    char: string;
    isMatrix: boolean;
    isSpace: boolean;
}

interface MatrixTextProps {
    text?: string;
    className?: string;
    textClassName?: string;
    /** Colour shown on the scrambled 0/1 digits — defaults to primary green */
    matrixColor?: string;
    matrixShadow?: string;
    initialDelay?: number;
    letterAnimationDuration?: number;
    letterInterval?: number;
    /** Re-trigger animation every N ms. 0 = only on mount */
    loopInterval?: number;
}

export const MatrixText = ({
    text = 'Hello World!',
    className,
    textClassName,
    matrixColor = '#0ca810',
    matrixShadow = '0 2px 8px rgba(12,168,16,0.6)',
    initialDelay = 300,
    letterAnimationDuration = 480,
    letterInterval = 80,
    loopInterval = 3500,
}: MatrixTextProps) => {
    const [letters, setLetters] = useState<LetterState[]>(() =>
        text.split('').map((char) => ({
            char,
            isMatrix: false,
            isSpace: char === ' ',
        }))
    );
    const [isAnimating, setIsAnimating] = useState(false);

    const getRandomChar = useCallback(
        () => (Math.random() > 0.5 ? '1' : '0'),
        []
    );

    const animateLetter = useCallback(
        (index: number) => {
            if (index >= text.length) return;

            requestAnimationFrame(() => {
                setLetters((prev) => {
                    const next = [...prev];
                    if (!next[index].isSpace) {
                        next[index] = {
                            ...next[index],
                            char: getRandomChar(),
                            isMatrix: true,
                        };
                    }
                    return next;
                });

                setTimeout(() => {
                    setLetters((prev) => {
                        const next = [...prev];
                        next[index] = {
                            ...next[index],
                            char: text[index],
                            isMatrix: false,
                        };
                        return next;
                    });
                }, letterAnimationDuration);
            });
        },
        [getRandomChar, text, letterAnimationDuration]
    );

    const startAnimation = useCallback(() => {
        if (isAnimating) return;
        setIsAnimating(true);
        let currentIndex = 0;

        const step = () => {
            if (currentIndex >= text.length) {
                setIsAnimating(false);
                return;
            }
            animateLetter(currentIndex);
            currentIndex++;
            setTimeout(step, letterInterval);
        };

        step();
    }, [animateLetter, text, isAnimating, letterInterval]);

    // Initial trigger
    useEffect(() => {
        const t = setTimeout(startAnimation, initialDelay);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Loop trigger
    useEffect(() => {
        if (!loopInterval) return;
        const id = setInterval(startAnimation, loopInterval + letterAnimationDuration);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loopInterval]);

    const motionVariants = useMemo(
        () => ({
            matrix: {
                color: matrixColor,
                textShadow: matrixShadow,
            },
            normal: {
                color: 'inherit',
                textShadow: 'none',
            },
        }),
        [matrixColor, matrixShadow]
    );

    return (
        <span
            className={cn('inline-flex flex-wrap items-baseline', className)}
            aria-label={text}
        >
            {letters.map((letter, index) => (
                <motion.span
                    key={index}
                    className={cn(
                        'font-mono inline-block text-center overflow-hidden tabular-nums',
                        textClassName
                    )}
                    style={{ width: letter.isSpace ? '0.35em' : '1ch' }}
                    initial="normal"
                    animate={letter.isMatrix ? 'matrix' : 'normal'}
                    variants={motionVariants}
                    transition={{ duration: 0.08, ease: 'easeInOut' }}
                >
                    {letter.isSpace ? '\u00A0' : letter.char}
                </motion.span>
            ))}
        </span>
    );
};
