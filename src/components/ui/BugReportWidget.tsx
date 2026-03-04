import React, { useState } from 'react';
import { PickLabsAlertEngine } from '../../data/PickLabsAlertEngine';
import { getCurrentUser } from '../../data/PickLabsAuthDB';

export const BugReportWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [issueType, setIssueType] = useState('Wrong Odds');
    const [description, setDescription] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [statusText, setStatusText] = useState<string | null>(null);

    const handleSubmit = () => {
        if (!description.trim()) {
            alert('Please describe the issue.');
            return;
        }

        setIsSending(true);

        // Simulate network API call
        setTimeout(() => {
            const user = getCurrentUser();
            const email = user?.email || 'anonymous@beta.tester';

            PickLabsAlertEngine.sendBugReportEmail(email, issueType, description);

            setDescription('');
            setIsSending(false);
            setStatusText('✅ Sent! Thank you.');

            // Auto close after 2 seconds
            setTimeout(() => {
                setIsOpen(false);
                setStatusText(null);
            }, 2000);

        }, 800);
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-[80px] md:bottom-6 right-6 z-[120] w-[50px] h-[50px] rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 shadow-[0_4px_15px_rgba(245,158,11,0.3)] flex items-center justify-center text-xl hover:scale-105 transition-all ${isOpen ? 'rotate-45' : 'rotate-0'}`}
            >
                <span className="material-symbols-outlined text-[24px]">bug_report</span>
            </button>

            {/* Slide-out Panel */}
            <div
                className={`fixed bottom-[140px] md:bottom-24 z-[120] w-[300px] bg-[#121212]/95 backdrop-blur-md border border-border rounded-2xl p-5 shadow-2xl transition-all duration-300 ease-in-out ${isOpen ? 'right-6 opacity-100 pointer-events-auto' : '-right-[350px] opacity-0 pointer-events-none'
                    }`}
            >
                <h3 className="mt-0 text-white font-black text-[14px] uppercase tracking-wide">Report an Issue</h3>
                <p className="text-text-muted text-[10px] mb-4">Spot a bad line or a glitch? Let us know.</p>

                <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full p-2 mb-3 bg-white/5 text-white border border-border rounded-lg text-[11px] outline-none focus:border-amber-500/50 [&>option]:bg-[#121212]"
                >
                    <option value="Wrong Odds">Wrong Odds Displayed</option>
                    <option value="Broken Feature">Broken Feature</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Other">Other</option>
                </select>

                <textarea
                    rows={4}
                    placeholder="What happened?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 mb-4 bg-white/5 text-white border border-border rounded-lg text-[11px] outline-none focus:border-amber-500/50 resize-none"
                />

                {!statusText ? (
                    <button
                        onClick={handleSubmit}
                        disabled={isSending}
                        className="w-full bg-amber-500/20 text-amber-500 border border-amber-500/40 hover:bg-amber-500/30 font-black uppercase tracking-widest text-[10px] p-2.5 rounded-lg transition-all disabled:opacity-50"
                    >
                        {isSending ? 'Sending...' : 'Send Report'}
                    </button>
                ) : (
                    <p className="text-emerald-400 text-[11px] text-center mt-2 font-black">{statusText}</p>
                )}
            </div>
        </>
    );
};
