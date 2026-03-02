import React, { useMemo } from 'react';
import { ResolvedTicket } from '../../App';
import { getCurrentUser } from '../../data/PickLabsAuthDB';

export interface SavedPicksViewProps {
    ticketHistory: ResolvedTicket[];
}

// Helper to group tickets by MM/DD/YYYY
const groupTicketsByDate = (tickets: ResolvedTicket[]) => {
    const groups: { [key: string]: ResolvedTicket[] } = {};
    tickets.forEach(t => {
        const d = new Date(t.dateStr);
        const dateKey = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(t);
    });
    return groups;
};

export const SavedPicksView: React.FC<SavedPicksViewProps> = ({ ticketHistory }) => {
    const user = getCurrentUser();

    // Sort tickets descending by date (newest first)
    const sortedTickets = useMemo(() => {
        return [...ticketHistory].sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
    }, [ticketHistory]);

    const groupedTickets = useMemo(() => groupTicketsByDate(sortedTickets), [sortedTickets]);

    // Stats for header
    const totalProfit = useMemo(() => sortedTickets.reduce((acc, t) => acc + (t.status === 'WON' ? t.payout - t.stake : -t.stake), 0), [sortedTickets]);
    const winCount = sortedTickets.filter(t => t.status === 'WON').length;

    return (
        <div className="w-full flex justify-center bg-[#121212] py-8 px-6 min-h-[calc(100vh-144px)] font-sans text-white">
            <div className="max-w-[1536px] w-full flex flex-col gap-8 animate-fade-in pb-12">

                {/* ── Playlist Header (Spotify Style) ── */}
                <div className="flex flex-col md:flex-row items-end gap-6 bg-gradient-to-b from-[#2a2a2a] to-[#121212] p-8 -mx-6 -mt-8 mb-4">
                    <div className="w-48 h-48 md:w-60 md:h-60 shrink-0 bg-gradient-to-br from-primary to-accent-blue shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[100px] text-white/90">receipt_long</span>
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Public Playlist</span>
                        <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter mix-blend-plus-lighter">Ticket History</h1>
                        <p className="text-sm text-white/60 font-medium mt-2 max-w-xl">
                            A curated collection of your past bets, grouped by date. Study your wins and losses to improve your edge.
                        </p>
                        <div className="flex items-center gap-2 text-sm mt-3 font-medium">
                            <div className="h-6 w-6 rounded-full bg-neutral-800 flex items-center justify-center border border-white/10">
                                <span className="material-symbols-outlined text-[12px] text-white">person</span>
                            </div>
                            <span className="font-bold text-white hover:underline cursor-pointer">{user?.email?.split('@')[0] || 'Guest'}</span>
                            <span className="text-white/40">•</span>
                            <span>{sortedTickets.length} tickets</span>
                            <span className="text-white/40">•</span>
                            <span className={totalProfit >= 0 ? 'text-primary' : 'text-red-500'}>
                                {totalProfit >= 0 ? '+' : '-'}${Math.abs(totalProfit).toLocaleString('en-US', { minimumFractionDigits: 2 })} Profit
                            </span>
                            <span className="text-white/40">•</span>
                            <span>{winCount} Wins</span>
                        </div>
                    </div>
                </div>

                {/* ── Action Bar ── */}
                <div className="flex items-center gap-6 px-2">
                    <button className="h-14 w-14 rounded-full bg-primary flex items-center justify-center hover:scale-105 transition-transform shadow-[0_8px_20px_rgba(13,242,13,0.3)] text-black">
                        <span className="material-symbols-outlined text-3xl filling">play_arrow</span>
                    </button>
                    <button className="text-slate-400 hover:text-white transition-colors" title="Share User History">
                        <span className="material-symbols-outlined text-3xl">share</span>
                    </button>
                    <button className="text-slate-400 hover:text-white transition-colors" title="Export to CSV">
                        <span className="material-symbols-outlined text-3xl">download</span>
                    </button>
                </div>

                {/* ── Ticket List ── */}
                <div className="flex flex-col w-full">
                    {sortedTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                            <span className="material-symbols-outlined text-6xl text-white/20">history</span>
                            <h3 className="text-xl font-bold text-white">It's a little quiet here...</h3>
                            <p className="text-white/50 text-sm max-w-sm">
                                As you place and resolve real tickets on the Live Board, your betting history will automatically populate right here.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-8">
                            {/* Table Header Row */}
                            <div className="hidden md:grid grid-cols-[40px_1fr_150px_120px_100px_40px] gap-4 px-4 py-2 border-b border-border-muted/50 text-xs font-bold text-white/60 tracking-wider">
                                <div className="text-center">#</div>
                                <div>Ticket Details</div>
                                <div>Date Resolved</div>
                                <div className="text-right">Risk / Payout</div>
                                <div className="text-center">Status</div>
                                <div></div>
                            </div>

                            {/* Render by Date Groups */}
                            {Object.entries(groupedTickets).map(([dateLabel, ticketsForDate]) => (
                                <div key={dateLabel} className="flex flex-col gap-2">
                                    <h3 className="text-sm font-bold text-white/80 px-4 mt-4 sticky top-[112px] bg-[#121212]/95 backdrop-blur py-2 z-10 border-b border-white/5">{dateLabel}</h3>

                                    <div className="flex flex-col">
                                        {ticketsForDate.map((ticket, idx) => {
                                            const isParlay = ticket.picks.length > 1;
                                            const ticketTitle = isParlay ? `${ticket.picks.length}-Leg Parlay` : ticket.picks[0].matchupStr;
                                            const ticketDesc = isParlay ? ticket.picks.map(l => l.type).join(', ') : `${ticket.picks[0].type} — ${ticket.picks[0].team}`;
                                            const timeString = new Date(ticket.dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                                            return (
                                                <div key={idx} className="group grid grid-cols-1 md:grid-cols-[40px_1fr_150px_120px_100px_40px] gap-4 items-center px-4 py-3 hover:bg-white/5 rounded-md transition-colors cursor-pointer border-b border-white/5 md:border-transparent">

                                                    {/* Number / Play Icon */}
                                                    <div className="hidden md:flex items-center justify-center text-white/50 group-hover:hidden">
                                                        <span className="text-sm">{idx + 1}</span>
                                                    </div>
                                                    <div className="hidden md:flex items-center justify-center text-white hidden group-hover:flex">
                                                        <span className="material-symbols-outlined text-lg">play_arrow</span>
                                                    </div>

                                                    {/* Ticket Info */}
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="h-10 w-10 shrink-0 bg-neutral-800 rounded flex items-center justify-center mt-1">
                                                            <span className="material-symbols-outlined text-white/50">{isParlay ? 'account_tree' : 'sports_score'}</span>
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-bold text-white truncate">{ticketTitle}</span>
                                                            <span className="text-xs text-white/60 truncate group-hover:text-white transition-colors">{ticketDesc}</span>
                                                        </div>
                                                    </div>

                                                    {/* Date/Time Added */}
                                                    <div className="hidden md:flex text-sm text-white/60">
                                                        {timeString}
                                                    </div>

                                                    {/* Financials */}
                                                    <div className="flex flex-row md:flex-col justify-between md:justify-center md:items-end text-sm gap-2 md:gap-0 mt-2 md:mt-0">
                                                        <span className="text-white/60 md:hidden">Risk / Win:</span>
                                                        <span className="text-white/80">${ticket.stake.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                        <span className="text-white font-bold hidden md:block">${ticket.payout.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div className="flex justify-end md:justify-center">
                                                        <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${ticket.status === 'WON'
                                                            ? 'bg-[#A3FF00]/10 text-[#A3FF00] border-[#A3FF00]/30'
                                                            : 'bg-red-500/10 text-red-500 border-red-500/30'
                                                            }`}>
                                                            {ticket.status}
                                                        </div>
                                                    </div>

                                                    {/* Actions (Share/Options) */}
                                                    <div className="hidden md:flex items-center justify-center text-white/0 group-hover:text-white/80 transition-colors">
                                                        <button className="hover:text-white p-1" title="Share Ticket">
                                                            <span className="material-symbols-outlined text-lg">share</span>
                                                        </button>
                                                    </div>

                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

