import React, { useMemo } from 'react';
import { ResolvedTicket } from '../../App';
import { TicketCard } from '../shared/LiveTicketPanel';

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
    // Sort tickets descending by date (newest first)
    const sortedTickets = useMemo(() => {
        return [...ticketHistory].sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
    }, [ticketHistory]);

    const groupedTickets = useMemo(() => groupTicketsByDate(sortedTickets), [sortedTickets]);

    return (
        <div className="w-full flex justify-center bg-[#121212] py-8 px-6 min-h-[calc(100vh-144px)] font-sans text-white">
            <div className="max-w-[1536px] w-full flex flex-col gap-8 animate-fade-in pb-12">
                {/* Header */}
                <div className="flex flex-col gap-2 mt-4 mb-4">
                    <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter mix-blend-plus-lighter">Ticket History</h1>
                    <p className="text-sm text-white/60 font-medium max-w-xl">
                        A chronological record of your settled tickets. Analyze your wins and losses to refine your edge.
                    </p>
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
                                    {ticketsForDate.map((ticket, idx) => {
                                        const timeString = new Date(ticket.dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                                        return (
                                            <div key={idx} className="flex flex-col relative w-full items-start justify-start">
                                                <TicketCard
                                                    ticket={ticket.picks}
                                                    forceStatus={ticket.status}
                                                    dateOverride={`${dateLabel} • ${timeString}`}
                                                />
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
