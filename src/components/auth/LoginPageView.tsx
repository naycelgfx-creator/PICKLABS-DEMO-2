import React, { useState, useEffect } from 'react';
import { saveAuth } from '../../utils/auth';
import { login } from '../../data/PickLabsAuthDB';


type ViewType = 'live-board' | 'matchup-terminal' | 'sharp-tools' | 'bankroll' | 'teams-directory' | 'popular-bets' | 'saved-picks' | 'value-finder' | 'landing-page' | 'login-page';

interface LoginPageViewProps {
    onNavigate: (view: ViewType) => void;
}

const MATCHUPS = [
    {
        league: 'NBA',
        leagueLogo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
        matchupId: '#NBA-8290',
        time: 'H1 • 01:45',
        team1: { name: 'LAKERS', score: 25, record: '24-10 (12-5 A)', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png', prob: 43, color: 'text-primary', form: ['L', 'W', 'L', 'W', 'W'] },
        team2: { name: 'CELTICS', score: 81, record: '34-10 (18-2 H)', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png', prob: 57, color: 'text-accent-purple', form: ['W', 'L', 'L', 'W', 'L'] },
        odds: { moneyline: '+263', spread: '-2.6', overUnder: 'OVER', total: '202.5' },
        trend: 'HOT: Won 4'
    },
    {
        league: 'MLB',
        leagueLogo: 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
        matchupId: '#MLB-1042',
        time: 'TOP 5TH',
        team1: { name: 'YANKEES', score: 2, record: '45-20 (22-10 A)', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png', prob: 62, color: 'text-text-muted', form: ['W', 'W', 'L', 'W', 'W'] },
        team2: { name: 'DODGERS', score: 5, record: '48-18 (25-8 H)', logo: 'https://a.espncdn.com/i/teamlogos/mlb/500/lad.png', prob: 38, color: 'text-blue-500', form: ['W', 'W', 'W', 'L', 'W'] },
        odds: { moneyline: '+185', spread: '+1.5', overUnder: 'UNDER', total: '8.5' },
        trend: 'TREND: Dodgers 5-0 at home'
    },
    {
        league: 'WNBA',
        leagueLogo: 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png',
        matchupId: '#WNBA-402',
        time: 'Q3 • 08:12',
        team1: { name: 'ACES', score: 62, record: '28-4 (12-2 A)', logo: 'https://a.espncdn.com/i/teamlogos/wnba/500/lv.png', prob: 75, color: 'text-text-muted', form: ['W', 'W', 'W', 'W', 'L'] },
        team2: { name: 'LIBERTY', score: 54, record: '24-8 (14-3 H)', logo: 'https://a.espncdn.com/i/teamlogos/wnba/500/ny.png', prob: 25, color: 'text-teal-400', form: ['W', 'L', 'W', 'L', 'W'] },
        odds: { moneyline: '-320', spread: '-7.5', overUnder: 'OVER', total: '168.5' },
        trend: 'ACES: 8-2 L10'
    },
    {
        league: 'NHL',
        leagueLogo: 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
        matchupId: '#NHL-901',
        time: 'P2 • 12:40',
        team1: { name: 'RANGERS', score: 1, record: '42-18-4 (20-9-2 A)', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/nyr.png', prob: 48, color: 'text-blue-500', form: ['L', 'W', 'W', 'L', 'W'] },
        team2: { name: 'PANTHERS', score: 2, record: '45-16-4 (23-7-1 H)', logo: 'https://a.espncdn.com/i/teamlogos/nhl/500/fla.png', prob: 52, color: 'text-red-500', form: ['W', 'W', 'L', 'W', 'W'] },
        odds: { moneyline: '-110', spread: '+1.5', overUnder: 'UNDER', total: '5.5' },
        trend: 'MATCHUP: Panthers 3-1 vs NYR'
    }
];

export const LoginPageView: React.FC<LoginPageViewProps> = ({ onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);
    const [shaking, setShaking] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsFading(true);
            setTimeout(() => {
                setActiveIndex((prev) => (prev + 1) % MATCHUPS.length);
                setIsFading(false);
            }, 300);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const m = MATCHUPS[activeIndex];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        saveAuth();
        onNavigate('live-board');
    };

    return (
        <div className="overflow-hidden h-screen flex relative top-0 left-0 w-full z-50 bg-background-dark">
            <main className="w-full lg:w-[450px] xl:w-[500px] flex-shrink-0 border-r border-border-muted flex flex-col p-8 md:p-12 overflow-y-auto bg-background-dark">
                <div className="flex justify-center mb-16">
                    <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); onNavigate('landing-page'); }}
                        className="flex items-center gap-3 w-fit group"
                    >
                        <img
                            src="/picklabs-full-logo.svg"
                            alt="PickLabs Logo"
                            className="h-32 w-auto transition-transform duration-300 hover:scale-105"
                        />
                    </a>
                </div>
                <div className="flex-grow flex flex-col justify-center">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black italic uppercase text-text-main mb-2">ADMIN LOGIN</h1>
                        <p className="text-sm font-bold text-text-muted">Enter your credentials to access the terminal.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-3 pt-1">
                            <button
                                type="submit"
                                className="w-full py-4 bg-primary text-black font-black uppercase tracking-[0.2em] italic rounded-xl hover:scale-[1.01] transition-transform"
                                style={{ boxShadow: '0 0 20px rgba(13,242,13,0.2)' }}
                            >
                                ENTER
                            </button>
                            <div className="flex items-center gap-4 py-2">
                                <div className="h-px flex-grow bg-border-muted"></div>
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">OR</span>
                                <div className="h-px flex-grow bg-border-muted"></div>
                            </div>
                            <div className="space-y-3">
                                <button type="button" className="social-btn">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="currentColor"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor"></path></svg>
                                    Continue with Google
                                </button>
                                <button type="button" className="social-btn">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.11.78.9-.04 2.19-.83 3.69-.65 1.58.19 2.73.81 3.46 1.83-3.13 1.88-2.58 6.32.48 7.57-.61 1.49-1.43 2.97-2.74 3.44zM12.03 7.25c-.02-2.39 1.95-4.4 4.19-4.25.26 2.51-2.2 4.6-4.19 4.25z" fill="currentColor"></path></svg>
                                    Continue with Apple
                                </button>
                                <div className="text-center pt-2">
                                    <a className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline decoration-2 underline-offset-4" href="#">Use phone instead</a>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div className="mt-auto pt-12">
                    <div className="flex flex-col sm:flex-row items-center gap-3 mb-6 justify-center">
                        {/* Apple Store Button */}
                        <a href="#" className="flex items-center justify-center gap-3 bg-black border border-neutral-800 hover:border-neutral-600 text-white px-5 py-2.5 rounded-xl transition-all hover:scale-105 w-full sm:w-auto">
                            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.11.78.9-.04 2.19-.83 3.69-.65 1.58.19 2.73.81 3.46 1.83-3.13 1.88-2.58 6.32.48 7.57-.61 1.49-1.43 2.97-2.74 3.44zM12.03 7.25c-.02-2.39 1.95-4.4 4.19-4.25.26 2.51-2.2 4.6-4.19 4.25z"></path></svg>
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[9px] text-slate-400">Download on the</span>
                                <span className="text-sm font-bold">App Store</span>
                            </div>
                        </a>

                        {/* Google Play Button */}
                        <a href="#" className="flex items-center justify-center gap-3 bg-black border border-neutral-800 hover:border-neutral-600 text-white px-5 py-2.5 rounded-xl transition-all hover:scale-105 w-full sm:w-auto">
                            <span className="material-symbols-outlined text-[26px]">shop</span>
                            <div className="flex flex-col items-start leading-none">
                                <span className="text-[9px] text-slate-400">GET IT ON</span>
                                <span className="text-sm font-bold">Google Play</span>
                            </div>
                        </a>
                    </div>

                    <p className="text-[9px] text-slate-600 text-center font-bold uppercase tracking-widest leading-relaxed">
                        By continuing, I acknowledge that I've read and agree to the <a className="text-text-muted hover:text-primary underline" href="#">Terms of Service</a> &amp; <a className="text-text-muted hover:text-primary underline" href="#">Privacy Policy</a>.
                    </p>
                </div>
            </main>
            <section className="hidden lg:flex flex-grow bg-neutral-950 relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #1e2e1e 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                <div className="w-full max-w-4xl relative z-10">
                    <div className={`transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                        <div className="flex items-center justify-between mb-6 px-4">
                            <div className="flex items-center gap-6">
                                <img alt={m.league} className="h-8" src={m.leagueLogo} />
                                <div className="flex items-center gap-3">
                                    <span className="bg-red-600 text-[10px] font-black px-2 py-0.5 rounded italic">LIVE</span>
                                    <span className="text-xs font-bold text-text-muted tracking-[0.2em]">{m.time}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">MATCHUP ID</span>
                                <span className="text-xs font-bold text-white tracking-widest">{m.matchupId}</span>
                            </div>
                        </div>
                        <div className="terminal-panel p-4 xl:p-8 border-primary/20 overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex flex-col items-center flex-1 min-w-0 overflow-hidden">
                                    <img alt={m.team1.name} className="w-12 h-12 xl:w-16 xl:h-16 mb-2 object-contain" src={m.team1.logo} />
                                    <div className="text-center w-full px-1">
                                        <h2 className="text-xs xl:text-sm font-black italic uppercase text-text-main leading-tight">
                                            <span className="text-text-muted block truncate">{m.team1.name}</span>
                                            <span className={`${m.team1.color} block`}>{m.team1.score}</span>
                                        </h2>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 truncate">{m.team1.record}</p>
                                    </div>
                                    <div className="flex gap-0.5 mt-2">
                                        {m.team1.form.map((res, i) => (
                                            <div key={`t1-${i}`} className={res === 'W' ? 'win-badge' : 'loss-badge'}>{res}</div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-2 xl:gap-4 px-2 xl:px-4 shrink-0">
                                    <div className="relative flex flex-col items-center">
                                        <div className="relative w-14 h-14 xl:w-20 xl:h-20 flex items-center justify-center">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                                                <circle className="text-neutral-800" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeWidth="4"></circle>
                                                <circle className={m.team1.color} cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeDasharray="213.5" strokeDashoffset={213.5 * (1 - m.team1.prob / 100)} strokeWidth="4"></circle>
                                            </svg>
                                            <span className="absolute text-xs font-black text-white italic">{m.team1.prob}%</span>
                                        </div>
                                        <span className={`text-[7px] font-black ${m.team1.color} uppercase tracking-widest mt-1`}>WIN PROB</span>
                                    </div>
                                    <div className="h-10 w-[1px] bg-border-muted relative">
                                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 bg-neutral-950 py-0.5">VS</span>
                                    </div>
                                    <div className="relative flex flex-col items-center">
                                        <div className="relative w-14 h-14 xl:w-20 xl:h-20 flex items-center justify-center">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                                                <circle className="text-neutral-800" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeWidth="4"></circle>
                                                <circle className={m.team2.color} cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeDasharray="213.5" strokeDashoffset={213.5 * (1 - m.team2.prob / 100)} strokeWidth="4"></circle>
                                            </svg>
                                            <span className="absolute text-xs font-black text-white italic">{m.team2.prob}%</span>
                                        </div>
                                        <span className={`text-[7px] font-black ${m.team2.color} uppercase tracking-widest mt-1`}>WIN PROB</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center flex-1 min-w-0 overflow-hidden">
                                    <img alt={m.team2.name} className="w-12 h-12 xl:w-16 xl:h-16 mb-2 object-contain" src={m.team2.logo} />
                                    <div className="text-center w-full px-1">
                                        <h2 className="text-xs xl:text-sm font-black italic uppercase text-text-main leading-tight">
                                            <span className="text-text-muted block truncate">{m.team2.name}</span>
                                            <span className={`${m.team2.color} block`}>{m.team2.score}</span>
                                        </h2>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 truncate">{m.team2.record}</p>
                                    </div>
                                    <div className="flex gap-0.5 mt-2">
                                        {m.team2.form.map((res, i) => (
                                            <div key={`t2-${i}`} className={res === 'W' ? 'win-badge' : 'loss-badge'}>{res}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 border-t border-border-muted pt-8 pb-4">
                                <div className="bet-card">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">MONEYLINE</span>
                                    <span className={`text-xl font-black ${m.team1.color}`}>{m.odds.moneyline}</span>
                                </div>
                                <div className="bet-card">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">SPREAD</span>
                                    <span className={`text-xl font-black ${m.team2.color}`}>{m.odds.spread}</span>
                                </div>
                                <div className="bet-card">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">O/U {m.odds.total}</span>
                                    <span className="text-xl font-black text-white">{m.odds.overUnder}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4 px-2">
                                <span className={`text-[10px] font-black ${m.team1.color} uppercase tracking-widest`}>{m.trend}</span>
                            </div>
                            <div className="flex items-center justify-between mt-8 pt-4 border-t border-border-muted/50">
                                <button className="flex items-center gap-2 text-[10px] font-black text-text-main uppercase tracking-widest hover:text-primary transition-colors">
                                    PUBLIC BETTING
                                    <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                                </button>
                                <button className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest hover:text-white transition-colors">
                                    MATCH DETAILS
                                    <span className="material-symbols-outlined text-sm">keyboard_arrow_right</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
