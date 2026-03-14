import React, { useState } from 'react';

interface BugReportModalProps {
    onClose: () => void;
}

export const BugReportModal: React.FC<BugReportModalProps> = ({ onClose }) => {
    const [issueType, setIssueType] = useState('bug');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-neutral-900 border border-border-muted rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-orange-400">bug_report</span>
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">Report an Issue</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-5">
                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in">
                            <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                                <span className="material-symbols-outlined text-4xl text-primary">check_circle</span>
                            </div>
                            <h3 className="text-lg font-black text-white mb-2 uppercase tracking-wide">Report Submitted</h3>
                            <p className="text-sm text-slate-400">Thank you for helping us improve PickLabs. We'll look into it right away.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Issue Type</label>
                                <div className="relative">
                                    <select
                                        value={issueType}
                                        onChange={(e) => setIssueType(e.target.value)}
                                        className="w-full appearance-none bg-black/40 border border-border-muted rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors"
                                    >
                                        <option value="bug">I found a bug / error</option>
                                        <option value="ui">Visual issue / UI glitch</option>
                                        <option value="feature">Feature request / Suggestion</option>
                                        <option value="data">Incorrect stats / data</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">expand_more</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Description</label>
                                <textarea
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Please describe the issue in detail. What happened? What did you expect to happen?"
                                    className="w-full bg-black/40 border border-border-muted rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition-colors min-h-[120px] resize-y custom-scrollbar"
                                />
                            </div>

                            <div className="flex items-center gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 rounded-xl border border-border-muted text-xs font-bold text-slate-300 hover:bg-white/5 transition-colors uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !description.trim()}
                                    className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-white transition-all uppercase tracking-widest
                                        ${isSubmitting || !description.trim() ? 'bg-orange-500/50 cursor-not-allowed opacity-70' : 'bg-orange-500 hover:bg-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]'}`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[14px]">send</span>
                                            Submit Report
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
