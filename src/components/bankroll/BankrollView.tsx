import React from 'react';
import { BankrollMetrics } from './BankrollMetrics';
import { BankrollChart } from './BankrollChart';
import { AllocationCharts } from './AllocationCharts';
import { TransactionHistory } from './TransactionHistory';
import { DailyExposureMeter } from './DailyExposureMeter';
import { PerformanceWidget } from './PerformanceWidget';
import { AIRoiAnalyser } from './AIRoiAnalyser';
import { ResolvedTicket } from '../../App';

export interface BankrollViewProps {
    bankroll: number;
    ticketHistory: ResolvedTicket[];
}

export const BankrollView: React.FC<BankrollViewProps> = ({ bankroll, ticketHistory }) => {
    return (
        <main className="max-w-[1440px] mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between mb-4 mt-2 px-2">
                <div className="flex flex-col">
                    <span className="text-[10px] text-primary font-black uppercase tracking-widest">Real-time sync</span>
                    <span className="text-[12px] text-text-muted font-bold uppercase">All Books Connected</span>
                </div>
                <button className="flex items-center gap-2 px-6 py-2 rounded-full border border-border-muted bg-white dark:bg-white dark:bg-neutral-900 shadow-md text-[11px] font-black uppercase tracking-widest hover:border-primary hover:bg-neutral-800 transition-all group">
                    <span className="material-symbols-outlined text-sm group-hover:text-primary">monitoring</span>
                    <span className="text-text-muted group-hover:text-white transition-colors">Analytics Mode</span>
                    <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#0df20d]"></div>
                </button>
            </div>

            <BankrollMetrics bankroll={bankroll} ticketHistory={ticketHistory} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DailyExposureMeter />
                        <PerformanceWidget />
                    </div>
                    <BankrollChart />
                </div>

                <div className="flex flex-col gap-6">
                    <AIRoiAnalyser />
                    <AllocationCharts />
                </div>
            </div>

            <TransactionHistory />
        </main>
    );
};
