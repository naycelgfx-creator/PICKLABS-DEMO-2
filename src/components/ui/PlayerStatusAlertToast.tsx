/**
 * PlayerStatusAlertToast.tsx
 * Renders floating alert toasts when player status changes to OUT/DOUBTFUL.
 * Consumes usePlayerStatusMonitor alerts array.
 */

import React, { useEffect } from 'react';
import { StatusAlert, PlayerStatus } from '../../hooks/usePlayerStatusMonitor';

const STATUS_CONFIG: Record<PlayerStatus, { color: string; bg: string; border: string; icon: string }> = {
    OUT: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/40', icon: 'cancel' },
    DOUBTFUL: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/40', icon: 'warning' },
    QUESTIONABLE: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/40', icon: 'help' },
    IR: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/40', icon: 'local_hospital' },
    ACTIVE: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', icon: 'check_circle' },
};

interface ToastItemProps {
    alert: StatusAlert;
    onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ alert, onDismiss }) => {
    const cfg = STATUS_CONFIG[alert.player.status];

    useEffect(() => {
        const id = setTimeout(() => onDismiss(alert.id), 6000);
        return () => clearTimeout(id);
    }, [alert.id, onDismiss]);

    const isSuspended = alert.player.status === 'OUT' || alert.player.status === 'IR';

    return (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl max-w-xs w-full ${cfg.bg} ${cfg.border} animate-slide-in`}>
            <span className={`material-symbols-outlined text-lg flex-none mt-0.5 ${cfg.color}`}>{cfg.icon}</span>
            <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-black ${cfg.color}`}>
                    {isSuspended ? '⚠️ LINE SUSPENDED' : `STATUS: ${alert.player.status}`}
                </p>
                <p className="text-[10px] text-white font-bold truncate">{alert.player.name}</p>
                <p className="text-[9px] text-text-muted">
                    {alert.player.team} · {alert.previousStatus} → {alert.player.status}
                </p>
                {isSuspended && (
                    <p className="text-[9px] text-red-300 mt-1">Props & lines for this player have been suspended</p>
                )}
            </div>
            <button onClick={() => onDismiss(alert.id)} className="text-text-muted hover:text-white transition-colors flex-none">
                <span className="material-symbols-outlined text-sm">close</span>
            </button>
        </div>
    );
};

interface Props {
    alerts: StatusAlert[];
    onDismiss: (id: string) => void;
}

export const PlayerStatusAlertToast: React.FC<Props> = ({ alerts, onDismiss }) => {
    if (alerts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2 items-end">
            {alerts.slice(0, 4).map(alert => (
                <ToastItem key={alert.id} alert={alert} onDismiss={onDismiss} />
            ))}
        </div>
    );
};
