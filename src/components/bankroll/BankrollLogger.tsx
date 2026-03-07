import React, { useState } from 'react';
import { logManualBet } from '../../data/PickLabsBetsDB';
import { getCurrentUser } from '../../data/PickLabsAuthDB';

export interface BankrollLoggerProps {
    onSuccess?: () => void;
}

export const BankrollLogger: React.FC<BankrollLoggerProps> = ({ onSuccess }) => {
    const [matchup, setMatchup] = useState('');
    const [wager, setWager] = useState('');
    const [odds, setOdds] = useState('');
    const [status, setStatus] = useState<'Pending' | 'Won' | 'Lost'>('Pending');
    const [successMsg, setSuccessMsg] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const user = getCurrentUser();
        if (!user) {
            setSuccessMsg('❌ Please log in first');
            return;
        }

        logManualBet(
            user.email,
            matchup,
            parseFloat(wager),
            parseInt(odds, 10),
            status
        );

        setSuccessMsg('✅ Bet Logged Successfully!');
        setMatchup('');
        setWager('');
        setOdds('');
        setStatus('Pending');

        setTimeout(() => {
            setSuccessMsg('');
            if (onSuccess) onSuccess();
        }, 1500); // Wait a brief moment to show success message before redirecting
    };

    return (
        <div className="bg-[#111115] border border-zinc-800 p-8 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <h2 className="text-slate-50 mt-0 font-bold text-2xl mb-2">💰 Log a Bet</h2>
            <p className="text-slate-400 text-sm mb-6">Track your slips to automatically update your ROI dashboard.</p>

            <form onSubmit={handleSubmit}>
                <label className="text-cyan-500 text-xs font-bold uppercase block">The Play</label>
                <input
                    type="text"
                    placeholder="e.g. LeBron OVER 25.5 Pts"
                    required
                    value={matchup}
                    onChange={(e) => setMatchup(e.target.value)}
                    className="w-full p-3 my-2 mb-5 bg-zinc-950 border border-zinc-800 text-white rounded-md"
                />

                <div className="flex gap-4 mb-5">
                    <div className="flex-1">
                        <label className="text-cyan-500 text-xs font-bold uppercase block">Risk Amount ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="50.00"
                            required
                            value={wager}
                            onChange={(e) => setWager(e.target.value)}
                            className="w-full p-3 mt-2 bg-zinc-950 border border-zinc-800 text-white rounded-md"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-cyan-500 text-xs font-bold uppercase block">Odds</label>
                        <input
                            type="number"
                            placeholder="-110"
                            required
                            value={odds}
                            onChange={(e) => setOdds(e.target.value)}
                            className="w-full p-3 mt-2 bg-zinc-950 border border-zinc-800 text-white rounded-md"
                        />
                    </div>
                </div>

                <label className="text-cyan-500 text-xs font-bold uppercase block">Result</label>
                <select
                    title="Select Bet Result"
                    value={status}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-3 my-2 mb-6 bg-zinc-950 border border-zinc-800 text-white rounded-md"
                >
                    <option value="Pending">⏳ Pending</option>
                    <option value="Won">✅ Win</option>
                    <option value="Lost">❌ Loss</option>
                </select>

                <button
                    type="submit"
                    className="w-full bg-emerald-500 text-black font-bold p-4 border-none rounded-md cursor-pointer transition-transform duration-150 ease-in-out hover:scale-[1.02]"
                >
                    Add to Bankroll
                </button>
            </form>

            {successMsg && (
                <p className={`mt-4 text-center font-bold ${successMsg.includes('❌') ? 'text-red-500' : 'text-emerald-500'}`}>
                    {successMsg}
                </p>
            )}
        </div>
    );
};
