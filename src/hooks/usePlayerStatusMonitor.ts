/**
 * usePlayerStatusMonitor.ts
 * Polls a player status feed and fires alerts when status changes to OUT/DOUBTFUL.
 *
 * Python original:
 *   if status_feed[player_id] == "OUT":
 *     suspend_prop(player_id)
 *     send_alert(f"Line Suspended: {player_id}")
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export type PlayerStatus = 'ACTIVE' | 'QUESTIONABLE' | 'DOUBTFUL' | 'OUT' | 'IR';

export interface PlayerStatusEntry {
    playerId: string;
    name: string;
    team: string;
    sport: string;
    status: PlayerStatus;
    updatedAt: number;
}

export interface StatusAlert {
    id: string;
    player: PlayerStatusEntry;
    previousStatus: PlayerStatus;
    timestamp: number;
}

// ─── Mock status feed (simulates ESPN/OddsAPI injury feed) ───────────────────

const MOCK_PLAYERS: PlayerStatusEntry[] = [
    { playerId: 'lebron_james', name: 'LeBron James', team: 'LAL', sport: 'NBA', status: 'ACTIVE', updatedAt: Date.now() },
    { playerId: 'jayson_tatum', name: 'Jayson Tatum', team: 'BOS', sport: 'NBA', status: 'ACTIVE', updatedAt: Date.now() },
    { playerId: 'stephen_curry', name: 'Stephen Curry', team: 'GSW', sport: 'NBA', status: 'ACTIVE', updatedAt: Date.now() },
    { playerId: 'nikola_jokic', name: 'Nikola Jokić', team: 'DEN', sport: 'NBA', status: 'ACTIVE', updatedAt: Date.now() },
    { playerId: 'shai_gilgeous', name: 'Shai Gilgeous-Alexander', team: 'OKC', sport: 'NBA', status: 'ACTIVE', updatedAt: Date.now() },
];

// Simulates a random status update every ~20 seconds for demo
function simulateStatusPoll(current: PlayerStatusEntry[]): PlayerStatusEntry[] {
    const statuses: PlayerStatus[] = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'QUESTIONABLE', 'DOUBTFUL', 'OUT'];
    // Only randomly change one player ~15% of the time
    if (Math.random() > 0.15) return current;

    const idx = Math.floor(Math.random() * current.length);
    const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
    return current.map((p, i) =>
        i === idx ? { ...p, status: newStatus, updatedAt: Date.now() } : p
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const POLL_INTERVAL = 20_000; // 20 seconds (mirrors ESPN injury ticker)
const SUSPENDED_STATUSES: PlayerStatus[] = ['OUT', 'IR'];
const ALERT_STATUSES: PlayerStatus[] = ['OUT', 'IR', 'DOUBTFUL'];

export function usePlayerStatusMonitor(pollInterval = POLL_INTERVAL) {
    const [players, setPlayers] = useState<PlayerStatusEntry[]>(MOCK_PLAYERS);
    const [alerts, setAlerts] = useState<StatusAlert[]>([]);
    const prevPlayersRef = useRef<Map<string, PlayerStatus>>(
        new Map(MOCK_PLAYERS.map(p => [p.playerId, p.status]))
    );

    const checkForChanges = useCallback((newPlayers: PlayerStatusEntry[]) => {
        const prev = prevPlayersRef.current;
        const newAlerts: StatusAlert[] = [];

        for (const player of newPlayers) {
            const prevStatus = prev.get(player.playerId);
            if (prevStatus && prevStatus !== player.status && ALERT_STATUSES.includes(player.status)) {
                newAlerts.push({
                    id: `${player.playerId}_${Date.now()}`,
                    player,
                    previousStatus: prevStatus,
                    timestamp: Date.now(),
                });
            }
            prev.set(player.playerId, player.status);
        }

        if (newAlerts.length > 0) {
            setAlerts(prev => [...newAlerts, ...prev].slice(0, 20));
        }
    }, []);

    useEffect(() => {
        const poll = () => {
            setPlayers(current => {
                const updated = simulateStatusPoll(current);
                checkForChanges(updated);
                return updated;
            });
        };

        const id = setInterval(poll, pollInterval);
        return () => clearInterval(id);
    }, [pollInterval, checkForChanges]);

    const isSuspended = useCallback((playerId: string): boolean => {
        const player = players.find(p => p.playerId === playerId);
        return player ? SUSPENDED_STATUSES.includes(player.status) : false;
    }, [players]);

    const getStatus = useCallback((playerId: string): PlayerStatus | null => {
        return players.find(p => p.playerId === playerId)?.status ?? null;
    }, [players]);

    const dismissAlert = useCallback((alertId: string) => {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
    }, []);

    return {
        players,
        alerts,
        isSuspended,
        getStatus,
        dismissAlert,
    };
}
