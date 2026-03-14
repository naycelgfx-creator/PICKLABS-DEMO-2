import React, { useState, useEffect } from 'react';
import { getCurrentUser, SessionData } from '../../data/PickLabsAuthDB';
import { clearAuth } from '../../utils/auth';
import { User, Settings, CreditCard, Shield, Activity, LogOut, ChevronRight, AlertTriangle } from 'lucide-react';

interface AccountSettingsViewProps {
    onLogout: () => void;
}

export const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({ onLogout }) => {
    const [user, setUser] = useState<SessionData | null>(null);
    const [oddsDisplay, setOddsDisplay] = useState<'decimals' | 'american'>('american');

    useEffect(() => {
        const session = getCurrentUser();
        if (!session) {
            onLogout();
            return;
        }
        setUser(session);

        // Load saved odds pref if any
        const savedOdds = localStorage.getItem('picklabs_odds_display');
        if (savedOdds === 'decimals' || savedOdds === 'american') {
            setOddsDisplay(savedOdds);
        }
    }, [onLogout]);

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out?")) {
            clearAuth();
            localStorage.removeItem('picklabs_last_view');
            onLogout();
        }
    };

    const handleOddsChange = (val: 'decimals' | 'american') => {
        setOddsDisplay(val);
        localStorage.setItem('picklabs_odds_display', val);
        // Note: For a real app, this should dispatch an event or use Context to update UI globally instantly.
    };

    const handleDeleteAccount = () => {
        if (window.confirm("WARNING: This will permanently delete your account and all data. This action cannot be undone. Proceed?")) {
            alert("Account deletion request submitted to support.");
            clearAuth();
            onLogout();
        }
    };

    const handleManageBilling = () => {
        alert("Billing Management is coming soon! You are currently on an Active plan.");
    };

    if (!user) return null;

    const SectionHeader = ({ title, icon: Icon }: { title: string, icon: React.ElementType }) => (
        <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-800/50 bg-neutral-900/40">
            <Icon className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-black text-white uppercase tracking-widest">{title}</h3>
        </div>
    );

    interface RowProps {
        label: string;
        value?: string | React.ReactNode;
        actionText?: string;
        hideAction?: boolean;
        onClickAction?: () => void;
        children?: React.ReactNode;
        isDanger?: boolean;
    }

    const Row = ({ label, value, actionText, hideAction = false, onClickAction, children, isDanger }: RowProps) => (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-neutral-800/50 bg-neutral-900/20 hover:bg-neutral-800/40 transition-colors group">
            <div className="text-sm font-bold text-slate-400 w-1/3 mb-2 sm:mb-0 uppercase tracking-wider">{label}</div>
            <div className={`flex-1 flex items-center sm:justify-end gap-6 text-sm font-black ${isDanger ? 'text-red-400' : 'text-slate-200'}`}>
                {children ? children : <span>{value}</span>}
                {!hideAction && (
                    <button 
                        onClick={onClickAction || (() => alert("Edit feature coming soon."))}
                        className={`flex items-center gap-1 text-xs font-black uppercase tracking-widest transition-colors ${
                            isDanger 
                                ? 'text-red-500 hover:text-red-400 opacity-80 hover:opacity-100' 
                                : 'text-primary/70 hover:text-primary opacity-0 group-hover:opacity-100'
                        }`}
                    >
                        {actionText || 'Edit'} <ChevronRight className="w-3 h-3" />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex-1 w-full bg-background-dark min-h-screen text-slate-100 overflow-y-auto font-display">
            <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
                {/* Page Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tight text-white flex items-center gap-3">
                            <Settings className="w-8 h-8 text-primary" /> Account Settings
                        </h1>
                        <p className="text-slate-400 mt-1 text-sm font-medium">
                            Manage your profile, preferences, and billing.
                        </p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="px-6 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-xs font-black text-slate-300 hover:text-white hover:bg-neutral-700 uppercase tracking-widest transition-all flex items-center gap-2 w-fit"
                    >
                        <LogOut className="w-4 h-4" /> Log Out
                    </button>
                </header>

                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                    
                    {/* Personal Section */}
                    <SectionHeader title="Personal Data" icon={User} />
                    <Row label="Name" value={user.email ? user.email.split('@')[0] : "PickLabs User"} />
                    <Row label="Email" value={user.email} hideAction />
                    <Row label="Phone Number" value="Not provided" actionText="Add" />
                    <Row label="Timezone" value="Eastern Time (US & Canada)" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 border-b border-neutral-800/50 bg-neutral-900/20 hover:bg-neutral-800/40 transition-colors">
                        <div className="text-sm font-bold text-slate-400 w-1/3 mb-3 sm:mb-0 uppercase tracking-wider flex items-center gap-2">
                            Odds Display
                        </div>
                        <div className="flex-1 flex items-center sm:justify-end gap-6">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${oddsDisplay === 'american' ? 'bg-primary border-primary' : 'border-neutral-600 group-hover:border-primary/50'}`}>
                                    {oddsDisplay === 'american' && <div className="w-1.5 h-1.5 bg-background-dark rounded-sm"></div>}
                                </div>
                                <input 
                                    type="radio" 
                                    name="odds" 
                                    className="hidden"
                                    checked={oddsDisplay === 'american'}
                                    onChange={() => handleOddsChange('american')}
                                />
                                <span className={`text-sm font-black uppercase tracking-wider ${oddsDisplay === 'american' ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>American (-110)</span>
                            </label>
                            
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${oddsDisplay === 'decimals' ? 'bg-primary border-primary' : 'border-neutral-600 group-hover:border-primary/50'}`}>
                                    {oddsDisplay === 'decimals' && <div className="w-1.5 h-1.5 bg-background-dark rounded-sm"></div>}
                                </div>
                                <input 
                                    type="radio" 
                                    name="odds" 
                                    className="hidden"
                                    checked={oddsDisplay === 'decimals'}
                                    onChange={() => handleOddsChange('decimals')}
                                />
                                <span className={`text-sm font-black uppercase tracking-wider ${oddsDisplay === 'decimals' ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>Decimal (1.90)</span>
                            </label>
                        </div>
                    </div>

                    {/* Risk Framework Limits Section */}
                    <SectionHeader title="Risk Profile" icon={Activity} />
                    <Row label="Bankroll Strategy" value="Aggressive (Kelly Criterion)" />
                    <Row label="Total Market Framework (TMF)" value="Not Set" actionText="Configure" />
                    <Row label="Single Game Framework (SGF)" value="Not Set" actionText="Configure" />

                    {/* Security & Billing Section */}
                    <SectionHeader title="Security & Billing" icon={Shield} />
                    <Row label="Password" value="••••••••••••" actionText="Change" />
                    <Row label="Subscription Plan" value={user.isPremium ? "Pro Analytics" : "Basic"} hideAction={true} />
                    
                    <div className="px-6 py-5 border-b border-neutral-800/50 bg-neutral-900/20 hover:bg-neutral-800/40 transition-colors flex justify-end">
                        <button 
                            onClick={handleManageBilling}
                            className="text-xs font-black text-white hover:text-primary uppercase tracking-widest transition-colors flex items-center gap-2 bg-neutral-800 px-4 py-2 rounded-lg border border-neutral-700 hover:border-primary/50"
                        >
                            <CreditCard className="w-4 h-4" /> Manage Billing
                        </button>
                    </div>

                    {/* Danger Zone */}
                    <div className="mt-8 border-t border-red-500/20 bg-red-500/5 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <h3 className="text-sm font-black text-red-500 uppercase tracking-widest">Danger Zone</h3>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <p className="text-sm text-slate-400 font-medium">
                                Once you delete your account, there is no going back. Please be certain.
                            </p>
                            <button 
                                onClick={handleDeleteAccount}
                                className="px-5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all whitespace-nowrap"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

