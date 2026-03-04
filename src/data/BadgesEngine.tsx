/**
 * BadgesEngine.ts
 * Pure logic — evaluates a BetRecord[] and awards badges.
 * No React dependency — import anywhere.
 */

import { BetRecord } from '../hooks/useResponsibleGambling';

// ─── Badge definitions ────────────────────────────────────────────────────────

import React from 'react';

export interface Badge {
    id: string;
    label: string;
    emoji: React.ReactNode;
    description: string;
    color: string; // Tailwind text color
    bgColor: string;
}

export const ALL_BADGES: Badge[] = [
    {
        id: 'prop_master',
        label: 'Prop Master',
        emoji: '🎯',
        description: '5 prop picks in a row correct',
        color: 'text-primary',
        bgColor: 'bg-primary/15',
    },
    {
        id: 'nascar_king',
        label: 'NASCAR King',
        emoji: '🏎️',
        description: '5 NASCAR picks in a row correct',
        color: 'text-amber-400',
        bgColor: 'bg-amber-400/15',
    },
    {
        id: 'on_fire',
        label: 'On Fire',
        emoji: <span className="material-symbols-outlined text-orange-500 text-sm align-middle"> local_fire_department </span>,
        description: '3-game win streak',
        color: 'text-orange-400',
        bgColor: 'bg-orange-400/15',
    },
    {
        id: 'sharp_shooter',
        label: 'Sharp Shooter',
        emoji: '🏆',
        description: '>65% win rate over 20+ bets',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-400/15',
    },
    {
        id: 'diamond_hands',
        label: 'Diamond Hands',
        emoji: '💎',
        description: 'No bets placed during a 3-loss streak (disciplined)',
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/15',
    },
    {
        id: 'ice_cold',
        label: 'Ice Cold',
        emoji: '❄️',
        description: 'Faded a public >80% pick and won',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-400/15',
    },
    {
        id: 'bankroll_boss',
        label: 'Bankroll Boss',
        emoji: '💰',
        description: 'Positive ROI over 30+ bets',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-400/15',
    },
    {
        id: 'first_win',
        label: 'First Blood',
        emoji: '⚡',
        description: 'First winning bet',
        color: 'text-purple-400',
        bgColor: 'bg-purple-400/15',
    },
];

// ─── Badge evaluation logic ───────────────────────────────────────────────────

export function evaluateBadges(history: BetRecord[]): Set<string> {
    const earned = new Set<string>();
    const settled = history.filter(b => b.result !== 'pending');

    if (settled.length === 0) return earned;

    // First Blood
    if (settled.some(b => b.result === 'win')) {
        earned.add('first_win');
    }

    // On Fire — 3 consecutive wins
    for (let i = 2; i < settled.length; i++) {
        if (
            settled[i].result === 'win' &&
            settled[i - 1].result === 'win' &&
            settled[i - 2].result === 'win'
        ) {
            earned.add('on_fire');
        }
    }

    // Prop Master — 5 consecutive wins on prop bets
    let propStreak = 0;
    for (const bet of settled) {
        if (bet.sport === 'props') {
            if (bet.result === 'win') {
                propStreak++;
                if (propStreak >= 5) earned.add('prop_master');
            } else {
                propStreak = 0;
            }
        }
    }

    // NASCAR King — 5 consecutive wins on NASCAR
    let nascarStreak = 0;
    for (const bet of settled) {
        if (bet.sport === 'NASCAR') {
            if (bet.result === 'win') {
                nascarStreak++;
                if (nascarStreak >= 5) earned.add('nascar_king');
            } else {
                nascarStreak = 0;
            }
        }
    }

    // Sharp Shooter — >65% over 20+ bets
    if (settled.length >= 20) {
        const wins = settled.filter(b => b.result === 'win').length;
        if (wins / settled.length > 0.65) earned.add('sharp_shooter');
    }

    // Bankroll Boss — positive ROI over 30+ bets (simplified: more wins than losses by count * avg stake)
    if (settled.length >= 30) {
        const totalWon = settled.filter(b => b.result === 'win').reduce((s, b) => s + b.amount, 0);
        const totalLost = settled.filter(b => b.result === 'loss').reduce((s, b) => s + b.amount, 0);
        if (totalWon > totalLost) earned.add('bankroll_boss');
    }

    // Diamond Hands — no bet placed during 3+ loss streak (requires gap in timestamps)
    let lossStreak = 0;
    let diamondHands = false;
    for (let i = 0; i < settled.length; i++) {
        if (settled[i].result === 'loss') {
            lossStreak++;
            if (lossStreak >= 3 && i + 1 < settled.length) {
                // Check if there was a pause (> 24h gap)
                const gap = settled[i + 1].timestamp - settled[i].timestamp;
                if (gap > 24 * 60 * 60 * 1000) {
                    diamondHands = true;
                }
            }
        } else {
            lossStreak = 0;
        }
    }
    if (diamondHands) earned.add('diamond_hands');

    return earned;
}
