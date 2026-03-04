import React, { useState, useRef } from 'react';
import { useRookieMode } from '../../contexts/RookieModeContext';

interface RookieTooltipProps {
    children: React.ReactNode;
    title: string;
    description: string;
    example?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

export const RookieTooltip: React.FC<RookieTooltipProps> = ({
    children,
    title,
    description,
    example,
    position = 'top'
}) => {
    const { isRookieModeActive } = useRookieMode();
    const [isHovered, setIsHovered] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // If rookie mode isn't on, just render the child normally without any hover listener overhead
    if (!isRookieModeActive) {
        return <>{children}</>;
    }

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    return (
        <div
            ref={wrapperRef}
            className="relative inline-block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={`relative transition-all duration-300 ${isHovered ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-background-dark rounded z-10' : 'ring-1 ring-yellow-400/30 ring-dashed rounded'}`}>
                {children}
            </div>

            {isHovered && (
                <div className={`absolute z-50 w-64 p-4 bg-[#111111] border border-yellow-500/50 shadow-[0_4px_20px_rgba(250,204,21,0.15)] rounded-xl pointer-events-none animate-fade-in ${positionClasses[position]}`}>

                    {/* Arrow/Triangle */}
                    <div className={`absolute w-3 h-3 bg-[#111111] border-yellow-500/50 transform rotate-45
                        ${position === 'top' ? 'bottom-[-7px] left-1/2 -translate-x-1/2 border-b border-r' : ''}
                        ${position === 'bottom' ? 'top-[-7px] left-1/2 -translate-x-1/2 border-t border-l' : ''}
                        ${position === 'left' ? 'right-[-7px] top-1/2 -translate-y-1/2 border-t border-r' : ''}
                        ${position === 'right' ? 'left-[-7px] top-1/2 -translate-y-1/2 border-b border-l' : ''}
                    `}></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-yellow-400 text-sm">school</span>
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">{title}</h4>
                        </div>
                        <p className="text-[11px] text-text-muted font-medium leading-relaxed mb-2">
                            {description}
                        </p>
                        {example && (
                            <div className="bg-white/5 rounded p-2 border border-white/5">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Example</span>
                                <p className="text-[10px] text-text-muted italic">"{example}"</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
