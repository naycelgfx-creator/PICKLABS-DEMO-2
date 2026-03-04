import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useRookieMode } from '../../contexts/RookieModeContext';

export const RookieTour: React.FC = () => {
    const { isRookieModeActive, hasSeenTour, markTourSeen } = useRookieMode();

    useEffect(() => {
        if (!isRookieModeActive || hasSeenTour) return;

        // Small delay so elements are fully rendered
        const timer = setTimeout(() => {
            const driverObj = driver({
                animate: true,
                showProgress: true,
                showButtons: ['next', 'previous', 'close'],
                allowClose: true,
                overlayColor: 'rgba(0,0,0,0.85)',
                overlayOpacity: 0.85,
                popoverClass: 'rookie-tour-popover',
                onDestroyed: () => {
                    markTourSeen();
                },
                steps: [
                    {
                        element: '#rookie-mode-btn',
                        popover: {
                            title: '🎓 Welcome to Rookie Mode',
                            description:
                                'You just unlocked beginner mode! This button switches the whole app into plain-English betting language. No confusing odds — just clear explanations of every bet.',
                            side: 'bottom',
                            align: 'end',
                        },
                    },
                    {
                        element: '#rookie-odds-row',
                        popover: {
                            title: '📋 Plain-English Bets',
                            description:
                                'Instead of cryptic numbers like -110, you now see exactly what needs to happen for you to win. Hover the terms with a dashed underline to get a full definition!',
                            side: 'top',
                            align: 'center',
                        },
                    },
                    {
                        element: '#bet-slip-sidebar',
                        popover: {
                            title: '💰 What If? Calculator',
                            description:
                                'Add any bet to your slip and you\'ll see a slider you can drag to calculate your exact payout — no math required. Risk $10, win $X.XX — simple!',
                            side: 'left',
                            align: 'start',
                        },
                    },
                ],
            });

            driverObj.drive();
        }, 600);

        return () => clearTimeout(timer);
    }, [isRookieModeActive, hasSeenTour, markTourSeen]);

    return null;
};
