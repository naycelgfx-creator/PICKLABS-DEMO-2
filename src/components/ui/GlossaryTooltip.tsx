import React, { useState, useRef, useEffect } from 'react';
import { useRookieMode } from '../../contexts/RookieModeContext';

interface GlossaryTooltipProps {
    term: string;
    definition: string;
    example?: string;
    position?: 'top' | 'bottom';
    children?: React.ReactNode;
}

export const GlossaryTooltip: React.FC<GlossaryTooltipProps> = ({
    term,
    definition,
    example,
    position = 'top',
    children,
}) => {
    const { isRookieModeActive } = useRookieMode();
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    // Close on outside click
    useEffect(() => {
        if (!visible) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setVisible(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [visible]);

    if (!isRookieModeActive) {
        return <>{children ?? <span>{term}</span>}</>;
    }

    const posClass = position === 'top'
        ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
        : 'top-full left-1/2 -translate-x-1/2 mt-2';

    return (
        <span
            ref={ref}
            className="relative inline-block cursor-help"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            onClick={() => setVisible(v => !v)}
        >
            {/* The term with dashed underline */}
            <span className="border-b border-dashed border-yellow-400/70 text-yellow-300 font-bold pb-px">
                {children ?? term}
                <span className="ml-0.5 text-yellow-400/60 text-[8px]">?</span>
            </span>

            {/* Popover */}
            {visible && (
                <span
                    className={`absolute z-[999] w-64 p-4 bg-[#0f0f0f] border border-yellow-500/40 shadow-[0_4px_24px_rgba(250,204,21,0.18)] rounded-xl pointer-events-none ${posClass}`}
                    style={{ whiteSpace: 'normal' }}
                >
                    {/* Arrow */}
                    <span className={`absolute w-3 h-3 bg-[#0f0f0f] border-yellow-500/40 rotate-45
                        ${position === 'top' ? 'bottom-[-7px] left-1/2 -translate-x-1/2 border-b border-r' : 'top-[-7px] left-1/2 -translate-x-1/2 border-t border-l'}
                    `} />
                    <span className="relative z-10 flex flex-col gap-1.5">
                        <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-yellow-400 text-xs">school</span>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{term}</span>
                        </span>
                        <span className="text-[11px] text-slate-300 leading-relaxed font-medium">{definition}</span>
                        {example && (
                            <span className="bg-white/5 rounded p-2 border border-white/5 block mt-1">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-0.5">Example</span>
                                <span className="text-[10px] text-slate-400 italic">"{example}"</span>
                            </span>
                        )}
                    </span>
                </span>
            )}
        </span>
    );
};
