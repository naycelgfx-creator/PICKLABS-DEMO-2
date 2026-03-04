import React from 'react';
import { useRookieMode } from '../../contexts/RookieModeContext';

interface PulsingBeaconProps {
    color?: 'green' | 'yellow' | 'red';
    /** If true, shows even when rookie mode is OFF (used to attract clicks TO the toggle) */
    alwaysVisible?: boolean;
    className?: string;
}

const colorMap = {
    green: { ring: 'bg-primary/40', dot: 'bg-primary' },
    yellow: { ring: 'bg-yellow-400/40', dot: 'bg-yellow-400' },
    red: { ring: 'bg-red-500/40', dot: 'bg-red-500' },
};

export const PulsingBeacon: React.FC<PulsingBeaconProps> = ({
    color = 'green',
    alwaysVisible = false,
    className = '',
}) => {
    const { isRookieModeActive } = useRookieMode();

    if (!alwaysVisible && !isRookieModeActive) return null;

    const c = colorMap[color];

    return (
        <span className={`relative inline-flex h-2.5 w-2.5 shrink-0 ${className}`}>
            <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.ring} opacity-75`}
            />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${c.dot}`} />
        </span>
    );
};
