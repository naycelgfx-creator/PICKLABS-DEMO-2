import React, { useMemo, useState, useEffect } from 'react';
import { ResolvedTicket, BetPick } from '../../App';
import { TicketCard } from '../shared/LiveTicketPanel';
import { IconBrandInstagram, IconBrandFacebook, IconBrandDiscord, IconBrandWhatsapp, IconBrandTelegram, IconShare } from '@tabler/icons-react';

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
    const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Won' | 'Lost'>('All');
    const [savedTickets, setSavedTickets] = useState<ResolvedTicket[]>([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('picklabs_saved_tickets') || '[]';
            const parsed = JSON.parse(raw);
            const formatted: ResolvedTicket[] = parsed.map((t: { id: string, dateStr: string, picks: BetPick[], status: 'WON' | 'LOST' | 'VOID', stake?: number, payout?: number }) => ({
                id: t.id,
                dateStr: t.dateStr,
                picks: t.picks,
                status: t.status,
                stake: t.stake || 100, // mock fallback
                payout: t.payout || 0 // mock fallback
            }));
            setSavedTickets(formatted);
        } catch (e) {
            console.error('Failed to load saved tickets', e);
        }
    }, []);

    // Combine history and explicitly saved tickets, avoiding duplicates by ID
    const combinedTickets = useMemo(() => {
        const map = new Map<string, ResolvedTicket>();
        ticketHistory.forEach(t => map.set(t.id, t));
        savedTickets.forEach(t => map.set(t.id, t));
        return Array.from(map.values());
    }, [ticketHistory, savedTickets]);

    // Filter tickets based on active tab by dynamically assessing them
    const filteredTickets = useMemo(() => {
        const evaluatedTickets = combinedTickets.map(t => {
            // Re-evaluate live (or strictly matching the TicketCard logic) 
            if (t.status === 'WON' || t.status === 'LOST' || t.status === 'VOID') {
                return { ...t, evaluatedStatus: t.status };
            }

            // If strictly PENDING, we determine true status
            const legResults = t.picks.map((bet, i) => {
                const now = new Date().getTime();
                const ticketDate = new Date(t.dateStr).getTime();
                // Assume games take roughly 3.5 hours to complete from the time of placing a ticket for mock aesthetics
                const isTimeFinished = (now - ticketDate) > (3.5 * 60 * 60 * 1000);
                const isFinished = isTimeFinished || (bet.gameStatusName === 'STATUS_FINAL' || bet.gameStatus === 'post' || bet.gameStatus === 'FINAL');

                const betSeed = Array.from(bet.id || "").reduce((acc, char) => acc + char.charCodeAt(0), i * 123);

                const isVoid = isFinished && (betSeed % 15 === 0);
                const isWon = isFinished && !isVoid && (betSeed % 4 !== 0);
                const isLost = isFinished && !isVoid && !isWon;

                let legStatus = 'PENDING';
                if (isVoid) legStatus = 'VOID';
                else if (isWon) legStatus = 'WON';
                else if (isLost) legStatus = 'LOST';

                return { isFinished, status: legStatus };
            });

            const hasLostLeg = legResults.some(l => l.status === 'LOST');
            const allFinished = legResults.every(l => l.isFinished);
            const allVoid = legResults.every(l => l.status === 'VOID');

            let derivedStatus = 'PENDING';
            if (hasLostLeg) {
                derivedStatus = 'LOST';
            } else if (allVoid && legResults.length > 0) {
                derivedStatus = 'VOID';
            } else if (allFinished && legResults.length > 0) {
                derivedStatus = 'WON';
            }

            return { ...t, evaluatedStatus: derivedStatus };
        });

        if (activeTab === 'All') return evaluatedTickets;
        return evaluatedTickets.filter(t => (t as any).evaluatedStatus.toUpperCase() === activeTab.toUpperCase());
    }, [combinedTickets, activeTab]);

    // Sort tickets descending by date (newest first)
    const sortedTickets = useMemo(() => {
        return [...filteredTickets].sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
    }, [filteredTickets]);

    const groupedTickets = useMemo(() => groupTicketsByDate(sortedTickets), [sortedTickets]);

    return (
        <div className="w-full flex justify-center bg-[#121212] py-8 px-6 min-h-[calc(100vh-144px)] font-sans text-white">
            <div className="max-w-[1536px] w-full flex flex-col gap-8 animate-fade-in pb-12">
                {/* Header */}
                <div className="flex flex-col gap-2 mt-4 mb-4">
                    <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter mix-blend-plus-lighter">Saved Picks</h1>
                    <p className="text-sm text-white/60 font-medium max-w-xl">
                        A chronological record of your explicitly saved tickets. Analyze your wins and losses to refine your edge.
                    </p>
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-2 pb-6 border-b border-white/10 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                    {['All', 'Pending', 'Won', 'Lost'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === tab
                                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Ticket List */}
                <div className="flex flex-col w-full gap-10">
                    {sortedTickets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-[#1a1a1a] rounded-xl border border-white/5">
                            <span className="material-symbols-outlined text-6xl text-white/20">history</span>
                            <h3 className="text-xl font-bold text-white">It's a little quiet here...</h3>
                            <p className="text-white/50 text-sm max-w-sm">
                                As you place and resolve real tickets on the Live Board, your betting history will automatically populate right here.
                            </p>
                        </div>
                    ) : (
                        Object.entries(groupedTickets).map(([dateLabel, ticketsForDate]) => (
                            <div key={dateLabel} className="flex flex-col gap-4">
                                <h3 className="text-lg font-black text-white/80 sticky top-[112px] bg-[#121212]/95 backdrop-blur py-2 z-40 border-b border-white/5 uppercase tracking-widest">
                                    {dateLabel}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                                    {ticketsForDate.map((ticket: any, idx) => {
                                        const timeString = new Date(ticket.dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

                                        return (
                                            <div key={idx} className="flex flex-col relative w-full items-start justify-start group">
                                                <div className="w-full relative z-10">
                                                    <TicketCard
                                                        ticket={ticket.picks}
                                                        forceStatus={ticket.evaluatedStatus || ticket.status}
                                                        dateOverride={`${dateLabel} • ${timeString}`}
                                                    />
                                                </div>

                                                {/* Share Overlay Tray */}
                                                <div className="absolute -bottom-4 left-0 right-0 h-16 bg-[#1a1a1a] rounded-b-xl border border-white/10 opacity-0 group-hover:opacity-100 group-hover:translate-y-4 transition-all duration-300 z-0 flex items-center justify-center gap-4 px-4 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                                                    <div className="flex items-center gap-1.5 absolute left-4 text-white/50 text-[10px] font-black uppercase tracking-widest hidden sm:flex">
                                                        <IconShare size={14} className="text-white/80" />
                                                        Share
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#E1306C] hover:text-white text-white/60 transition-colors shadow-sm cursor-pointer" title="Share to Instagram">
                                                            <IconBrandInstagram size={16} stroke={2} />
                                                        </button>
                                                        <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#1877F2] hover:text-white text-white/60 transition-colors shadow-sm cursor-pointer" title="Share to Facebook">
                                                            <IconBrandFacebook size={16} stroke={2} />
                                                        </button>
                                                        <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#5865F2] hover:text-white text-white/60 transition-colors shadow-sm cursor-pointer" title="Share to Discord">
                                                            <IconBrandDiscord size={16} stroke={2} />
                                                        </button>
                                                        <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#25D366] hover:text-white text-white/60 transition-colors shadow-sm cursor-pointer" title="Share to WhatsApp">
                                                            <IconBrandWhatsapp size={16} stroke={2} />
                                                        </button>
                                                        <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#0088cc] hover:text-white text-white/60 transition-colors shadow-sm cursor-pointer" title="Share to Telegram">
                                                            <IconBrandTelegram size={16} stroke={2} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
