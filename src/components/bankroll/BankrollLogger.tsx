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
        <div style={{ background: '#111115', border: '1px solid #27272a', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <h2 style={{ color: '#f8fafc', marginTop: 0, fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '8px' }}>💰 Log a Bet</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '25px' }}>Track your slips to automatically update your ROI dashboard.</p>

            <form onSubmit={handleSubmit}>
                <label style={{ color: '#06b6d4', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>The Play</label>
                <input
                    type="text"
                    placeholder="e.g. LeBron OVER 25.5 Pts"
                    required
                    value={matchup}
                    onChange={(e) => setMatchup(e.target.value)}
                    style={{ width: '100%', padding: '12px', margin: '8px 0 20px 0', background: '#09090b', border: '1px solid #27272a', color: 'white', borderRadius: '6px' }}
                />

                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ color: '#06b6d4', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Risk Amount ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="50.00"
                            required
                            value={wager}
                            onChange={(e) => setWager(e.target.value)}
                            style={{ width: '100%', padding: '12px', marginTop: '8px', background: '#09090b', border: '1px solid #27272a', color: 'white', borderRadius: '6px' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ color: '#06b6d4', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Odds</label>
                        <input
                            type="number"
                            placeholder="-110"
                            required
                            value={odds}
                            onChange={(e) => setOdds(e.target.value)}
                            style={{ width: '100%', padding: '12px', marginTop: '8px', background: '#09090b', border: '1px solid #27272a', color: 'white', borderRadius: '6px' }}
                        />
                    </div>
                </div>

                <label style={{ color: '#06b6d4', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>Result</label>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    style={{ width: '100%', padding: '12px', margin: '8px 0 25px 0', background: '#09090b', border: '1px solid #27272a', color: 'white', borderRadius: '6px' }}
                >
                    <option value="Pending">⏳ Pending</option>
                    <option value="Won">✅ Win</option>
                    <option value="Lost">❌ Loss</option>
                </select>

                <button
                    type="submit"
                    style={{ width: '100%', background: '#10b981', color: '#000', fontWeight: 'bold', padding: '15px', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: 'transform 0.15s ease' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    Add to Bankroll
                </button>
            </form>

            {successMsg && (
                <p style={{ marginTop: '15px', textAlign: 'center', color: successMsg.includes('❌') ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                    {successMsg}
                </p>
            )}
        </div>
    );
};
