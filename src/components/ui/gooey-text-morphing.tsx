"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

interface GooeyTextProps {
    /** Array of text strings to cycle through */
    texts: string[];
    /**
     * Optional array of Tailwind class strings — one per text entry.
     * When provided, the corresponding class is swapped onto each span
     * at the same time the text content changes, so font style morphs too.
     */
    fontClassNames?: string[];
    morphTime?: number;
    cooldownTime?: number;
    className?: string;
    /** Base class applied to both spans at all times */
    textClassName?: string;
}

export function GooeyText({
    texts,
    fontClassNames,
    morphTime = 1,
    cooldownTime = 0.25,
    className,
    textClassName,
}: GooeyTextProps) {
    const text1Ref = React.useRef<HTMLSpanElement>(null);
    const text2Ref = React.useRef<HTMLSpanElement>(null);

    React.useEffect(() => {
        // Track which class each span currently has so we can swap them
        let textIndex = texts.length - 1;
        let time = new Date();
        let morph = 0;
        let cooldown = cooldownTime;

        // Apply the right fontClassName to each span
        const applyFontClass = (span: HTMLSpanElement | null, idx: number) => {
            if (!span || !fontClassNames) return;
            // Remove any previously applied dynamic classes by stripping them from className.
            // We track them via a data attribute to avoid guessing.
            const prev = span.dataset.dynClass;
            if (prev) span.classList.remove(...prev.split(' ').filter(Boolean));
            const next = fontClassNames[idx % fontClassNames.length] ?? '';
            if (next) {
                span.classList.add(...next.split(' ').filter(Boolean));
                span.dataset.dynClass = next;
            }
        };

        const setMorph = (fraction: number) => {
            if (text1Ref.current && text2Ref.current) {
                text2Ref.current.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
                text2Ref.current.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
                fraction = 1 - fraction;
                text1Ref.current.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
                text1Ref.current.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
            }
        };

        const doCooldown = () => {
            morph = 0;
            if (text1Ref.current && text2Ref.current) {
                text2Ref.current.style.filter = "";
                text2Ref.current.style.opacity = "100%";
                text1Ref.current.style.filter = "";
                text1Ref.current.style.opacity = "0%";
            }
        };

        const doMorph = () => {
            morph -= cooldown;
            cooldown = 0;
            let fraction = morph / morphTime;
            if (fraction > 1) { cooldown = cooldownTime; fraction = 1; }
            setMorph(fraction);
        };

        // Initialise with first pair of texts + classes
        if (text1Ref.current) {
            text1Ref.current.textContent = texts[textIndex % texts.length];
            applyFontClass(text1Ref.current, textIndex % texts.length);
        }
        if (text2Ref.current) {
            text2Ref.current.textContent = texts[(textIndex + 1) % texts.length];
            applyFontClass(text2Ref.current, (textIndex + 1) % texts.length);
        }

        let animFrameId: number;

        function animate() {
            animFrameId = requestAnimationFrame(animate);
            const newTime = new Date();
            const shouldIncrementIndex = cooldown > 0;
            const dt = (newTime.getTime() - time.getTime()) / 1000;
            time = newTime;
            cooldown -= dt;

            if (cooldown <= 0) {
                if (shouldIncrementIndex) {
                    textIndex = (textIndex + 1) % texts.length;
                    if (text1Ref.current && text2Ref.current) {
                        const t1Idx = textIndex % texts.length;
                        const t2Idx = (textIndex + 1) % texts.length;
                        text1Ref.current.textContent = texts[t1Idx];
                        text2Ref.current.textContent = texts[t2Idx];
                        applyFontClass(text1Ref.current, t1Idx);
                        applyFontClass(text2Ref.current, t2Idx);
                    }
                }
                doMorph();
            } else {
                doCooldown();
            }
        }

        animate();
        return () => cancelAnimationFrame(animFrameId);
    }, [texts, fontClassNames, morphTime, cooldownTime]);

    return (
        <div className={cn("relative", className)}>
            {/* Gooey SVG filter */}
            <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
                <defs>
                    <filter id="gooey-threshold">
                        <feColorMatrix
                            in="SourceGraphic"
                            type="matrix"
                            values="1 0 0 0 0
                                    0 1 0 0 0
                                    0 0 1 0 0
                                    0 0 0 255 -140"
                        />
                    </filter>
                </defs>
            </svg>

            <div
                className="flex items-center justify-center"
                style={{ filter: "url(#gooey-threshold)" }}
            >
                <span
                    ref={text1Ref}
                    className={cn(
                        "absolute inline-block select-none text-center",
                        textClassName
                    )}
                />
                <span
                    ref={text2Ref}
                    className={cn(
                        "absolute inline-block select-none text-center",
                        textClassName
                    )}
                />
            </div>
        </div>
    );
}
