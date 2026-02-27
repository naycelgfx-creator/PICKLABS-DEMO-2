import React from 'react';
import { Footer } from '../layout/Footer';
import { isAuthValid } from '../../utils/auth';
import { GlowingEffect } from '../ui/glowing-effect';
import { PricingSection } from '../ui/pricing-section';
import { LogoCloud } from '../ui/logo-cloud-3';
import { BetSlipCompare } from '../ui/BetSlipCompare';
import { ThemeToggle } from '../ui/theme-toggle';
import { BlurFade } from '../ui/blur-fade';
import { ShimmerButton } from '../ui/shimmer-button';
import { Sparkles, Zap, Shield, Star } from 'lucide-react';

type ViewType = 'live-board' | 'matchup-terminal' | 'sharp-tools' | 'bankroll' | 'teams-directory' | 'popular-bets' | 'saved-picks' | 'value-finder' | 'landing-page' | 'login-page';

interface LandingPageViewProps {
    onNavigate: (view: ViewType) => void;
}


const SPORTSBOOK_LOGOS = [
    { src: 'https://www.google.com/s2/favicons?domain=fanduel.com&sz=128', alt: 'FanDuel' },
    { src: 'https://www.google.com/s2/favicons?domain=draftkings.com&sz=128', alt: 'DraftKings' },
    { src: 'https://www.google.com/s2/favicons?domain=betmgm.com&sz=128', alt: 'BetMGM' },
    { src: 'https://www.google.com/s2/favicons?domain=caesars.com&sz=128', alt: 'Caesars Sportsbook' },
    { src: 'https://www.google.com/s2/favicons?domain=bet365.com&sz=128', alt: 'Bet365' },
    { src: 'https://www.google.com/s2/favicons?domain=kalshi.com&sz=128', alt: 'Kalshi' },
    { src: 'https://www.google.com/s2/favicons?domain=underdogfantasy.com&sz=128', alt: 'Underdog Fantasy' },
    { src: 'https://www.google.com/s2/favicons?domain=betrivers.com&sz=128', alt: 'BetRivers' },
    { src: 'https://www.google.com/s2/favicons?domain=getfliff.com&sz=128', alt: 'Fliff' },
    { src: 'https://www.google.com/s2/favicons?domain=sleeper.com&sz=128', alt: 'Sleeper' },
    { src: 'https://www.google.com/s2/favicons?domain=prizepicks.com&sz=128', alt: 'PrizePicks' },
    { src: 'https://www.google.com/s2/favicons?domain=hardrock.bet&sz=128', alt: 'Hard Rock Bet' },
    { src: 'https://www.google.com/s2/favicons?domain=novig.us&sz=128', alt: 'Novig' },
    { src: 'https://www.google.com/s2/favicons?domain=thescore.com&sz=128', alt: 'theScore Bet' },
    { src: 'https://www.google.com/s2/favicons?domain=pinnacle.com&sz=128', alt: 'Pinnacle' },
    { src: 'https://www.google.com/s2/favicons?domain=pointsbet.com&sz=128', alt: 'PointsBet' },
    { src: 'https://www.google.com/s2/favicons?domain=williamhill.com&sz=128', alt: 'William Hill' },
    { src: 'https://www.google.com/s2/favicons?domain=bovada.lv&sz=128', alt: 'Bovada' },
];





const COMMUNITY_REVIEWS = [
    { name: 'Ryan M.', platform: 'App Store', logo: 'https://www.google.com/s2/favicons?domain=apple.com&sz=128', text: '"Absolutely game changing. The AI terminal found two props I would have completely missed. Paid for itself on day one."', rating: 5 },
    { name: 'SharpShooter99', platform: 'Discord', logo: 'https://www.google.com/s2/favicons?domain=discord.com&sz=128', text: '"The community here is unmatched. The correlation matrix tools are what pros use, now available to us. Crazy value."', rating: 5 },
    { name: 'AlexTheBettor', platform: 'Twitter', logo: 'https://www.google.com/s2/favicons?domain=twitter.com&sz=128', text: '"PickLabs just saved me from a massive bad beat by alerting me to a sharp money move against my team. Unreal." - @AlexTheBettor', rating: 5 },
    { name: 'Sammy_Sports', platform: 'Instagram', logo: 'https://www.google.com/s2/favicons?domain=instagram.com&sz=128', text: '"Every single morning starts by checking the PickLabs terminal. The UI is sleek and the stats are deadly accurate. 🔥"', rating: 5 },
    { name: 'David L.', platform: 'App Store', logo: 'https://www.google.com/s2/favicons?domain=apple.com&sz=128', text: '"Finally an app that gives real data without the fluff. The +EV scanner prints. Period."', rating: 5 },
    { name: 'VegasInsider0', platform: 'Twitter', logo: 'https://www.google.com/s2/favicons?domain=twitter.com&sz=128', text: '"Their model on NBA totals is hitting at ~62% this week. Unprecedented consistency from an AI tool. Highly recommend." - @VegasInsider0', rating: 5 },
    { name: 'PropKing', platform: 'Discord', logo: 'https://www.google.com/s2/favicons?domain=discord.com&sz=128', text: '"Joined the Discord, tailed the top 3 EV plays, woke up to green. Best investment I\'ve made all year."', rating: 5 },
    { name: 'Sarah J.', platform: 'App Store', logo: 'https://www.google.com/s2/favicons?domain=apple.com&sz=128', text: '"I was losing money blindly tailing picks online. Now I have the terminal to actually back up my bets with math. 5 stars."', rating: 5 }
];

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onNavigate }) => {


    const PICKLABS_TIERS = [
        {
            name: 'Free',
            price: { monthly: '0', yearly: '0' },
            description: 'No credit card required · Forever free',
            accentColor: 'default' as const,
            ctaLabel: 'Get Started Free',
            onCta: () => onNavigate('login-page'),
            icon: <Zap className="w-5 h-5" />,
            features: [
                { name: 'Trending Insights', description: 'Today\'s top sharp public picks', included: true },
                { name: 'Thousands of Props & Games', description: 'All major sports & leagues', included: true },
                { name: 'Advanced Visuals', description: 'Charts, heatmaps & team stats', included: true },
                { name: 'Injury Reports', description: 'Real-time roster updates', included: true },
                { name: 'Odds Comparison', description: 'Line shopping across books', included: false },
                { name: 'Real Time Betting Alerts', description: 'Sharp money & line move alerts', included: false },
                { name: 'EV+ Bet Indicators', description: 'Positive expected value tags', included: false },
                { name: 'Arbitrage Feed', description: 'Guaranteed profit opportunities', included: false },
            ],
        },
        {
            name: 'Premium',
            price: { monthly: '19.99', yearly: '199.99' },
            description: 'Core analytics suite',
            accentColor: 'default' as const,
            ctaLabel: 'Get Premium',
            icon: <Shield className="w-5 h-5" />,
            features: [
                { name: 'Trending Insights', description: 'Today\'s top sharp public picks', included: true },
                { name: 'Thousands of Props & Games', description: 'All major sports & leagues', included: true },
                { name: 'Advanced Visuals', description: 'Charts, heatmaps & team stats', included: true },
                { name: 'Injury Reports', description: 'Real-time roster updates', included: true },
                { name: 'Odds Comparison', description: 'Line shopping across books', included: true },
                { name: 'Real Time Betting Alerts', description: 'Sharp money & line move alerts', included: true },
                { name: 'EV+ Bet Indicators', description: 'Positive expected value tags', included: false },
                { name: 'Arbitrage Feed', description: 'Guaranteed profit opportunities', included: false },
            ],
        },
        {
            name: 'Premium+',
            price: { monthly: '29.99', yearly: '299.99' },
            description: 'Early bird: 50% off · Best value',
            highlight: true,
            badge: 'Best Value',
            accentColor: 'purple' as const,
            ctaLabel: 'Get Premium+',
            icon: <Sparkles className="w-5 h-5" />,
            features: [
                { name: 'Everything in Premium', description: 'All Premium features included', included: true },
                { name: 'Odds Movement Charts', description: 'Real-time line history visualization', included: true },
                { name: 'EV+ Bet Indicators', description: 'Positive expected value tags', included: true },
                { name: 'Positive EV Power Feed', description: 'Live +EV opportunity stream', included: true },
                { name: 'Sharp Book Odds', description: 'Pinnacle & sharp book comparisons', included: true },
                { name: 'Boost Index', description: 'Promo value scoring', included: true },
                { name: 'Arbitrage Feed', description: 'Guaranteed profit opportunities', included: false },
                { name: 'Middle Betting', description: 'Two-way market gap detection', included: false },
            ],
        },
        {
            name: 'Pro',
            price: { monthly: '79.99', yearly: '359.99' },
            description: 'Get Pro for 38% off · Full access',
            highlight: true,
            badge: 'All Access',
            accentColor: 'green' as const,
            ctaLabel: 'Get Pro',
            icon: <Star className="w-5 h-5" />,
            features: [
                { name: 'Everything in Premium+', description: 'All Premium+ features included', included: true },
                { name: 'Arbitrage Feed', description: 'Guaranteed profit opportunities', included: true },
                { name: 'Middle Betting', description: 'Two-way market gap detection', included: true },
                { name: 'Unlimited API Access', description: 'Full REST & WebSocket endpoints', included: true },
                { name: 'Priority Support', description: '24/7 dedicated support channel', included: true },
                { name: 'Early Feature Access', description: 'Beta features before public release', included: true },
                { name: 'Custom Alerts', description: 'Build personalized betting triggers', included: true },
                { name: 'Export & Reporting', description: 'Download your full bet history & stats', included: true },
            ],
        },
    ];




    const handleScrollToPricing = (e: React.MouseEvent) => {
        e.preventDefault();
        const el = document.getElementById('pricing');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="overflow-x-hidden w-full font-display bg-background-dark text-slate-100 min-h-screen selection:bg-primary selection:text-black">
            <header className="px-6 py-8 max-w-7xl mx-auto flex items-center justify-between">
                <a className="brand-logo flex items-center gap-3 w-fit group" href="#" onClick={(e) => { e.preventDefault(); onNavigate('landing-page'); }}>
                    <img
                        src="/picklabs-full-logo.svg"
                        alt="PickLabs Logo"
                        className="h-10 w-auto transition-transform duration-300 drop-shadow-[0_0_15px_rgba(13,242,13,0.3)] hover:scale-105"
                    />
                </a>
                <nav className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-text-muted">
                    <a className="hover:text-primary transition-colors" href="#how-it-works">How It Works</a>
                    <a className="hover:text-primary transition-colors" href="#pricing">Pricing</a>
                    <a className="hover:text-primary transition-colors" href="#how-it-works">Data Feed</a>
                    <a className="hover:text-primary transition-colors" href="#pricing">API</a>
                </nav>
                <div className="flex items-center gap-2">
                    <ThemeToggle className="hidden md:flex" />
                    <button
                        onClick={() => onNavigate(isAuthValid() ? 'live-board' : 'login-page')}
                        className="hidden md:block px-5 py-2 bg-neutral-800 border border-border-muted rounded-full text-[10px] font-black uppercase tracking-widest text-text-main hover:border-primary/50 transition-all">
                        Live Board
                    </button>
                    <button
                        onClick={() => onNavigate('login-page')}
                        className="px-6 py-2 bg-neutral-800 border border-border-muted rounded-full text-[10px] font-black uppercase tracking-widest text-text-main hover:border-primary/50 transition-all">
                        Login
                    </button>
                </div>
            </header>

            <section className="relative pt-20 pb-16 px-6 hero-gradient">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

                    {/* ── Left: headline + CTAs ── */}
                    <div className="flex-1 text-center lg:text-left space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/30 text-accent-purple text-[10px] font-black uppercase tracking-widest mb-4">
                            <span className="material-symbols-outlined text-sm">auto_awesome</span>
                            v4.2 AI Simulation Engine Now Live
                        </div>
                        {/* Hero headline — BlurFade staggered entrance */}
                        <BlurFade delay={0.1} inView blur="8px" duration={0.5}>
                            <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tight text-text-main leading-tight">
                                Predict the <span className="text-primary">Unpredictable.</span>
                            </h2>
                        </BlurFade>
                        <p className="text-lg md:text-xl text-text-muted max-w-xl leading-relaxed">
                            Professional-grade sports simulations and sharp betting alerts powered by proprietary neural networks. Built for the modern bettor.
                        </p>
                        <div className="flex flex-col md:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                            <ShimmerButton
                                onClick={handleScrollToPricing}
                                shimmerColor="#ffffff"
                                shimmerDuration="2.5s"
                                shimmerSize="0.08em"
                                borderRadius="12px"
                                background="rgb(12 168 16)"
                                className="w-full md:w-auto px-10 py-5 font-black uppercase tracking-[0.2em] italic text-black text-sm hover:scale-105 transition-transform"
                            >
                                Start 7-Day Free Trial
                            </ShimmerButton>
                        </div>
                    </div>

                    {/* ── Right: Bet Slip Compare ── */}
                    <div className="flex-shrink-0 w-full lg:w-[340px] xl:w-[380px] pt-8 lg:pt-0">
                        <BetSlipCompare />
                    </div>

                </div>
            </section>

            <div className="bg-background-dark border-y border-border-muted py-4 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Available on Windows, Mac, Android, and iOS</p>
                    <div className="flex items-center gap-6 text-text-main drop-shadow-[0_0_12px_rgba(0,0,0,0.2)] dark:text-white dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.5)]">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">laptop_windows</span>
                            <span className="text-[9px] font-bold uppercase tracking-tighter">Windows</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">desktop_mac</span>
                            <span className="text-[9px] font-bold uppercase tracking-tighter">macOS</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">android</span>
                            <span className="text-[9px] font-bold uppercase tracking-tighter">Android</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">phone_iphone</span>
                            <span className="text-[9px] font-bold uppercase tracking-tighter">iOS</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-background-dark border-b border-border-muted">
                <div className="py-3 text-center mb-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Live odds aggregated across 20+ sportsbooks</p>
                </div>
                <LogoCloud
                    logos={SPORTSBOOK_LOGOS}
                    className="pb-4"
                />
            </div>

            <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-32 border-b border-border-muted">
                <div className="mb-20">
                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-4">The Methodology</h3>
                    <h2 className="text-4xl md:text-5xl font-black italic uppercase text-text-main">How It Works</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="terminal-panel p-8 group border-primary/10 relative">
                        <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} variant="green" />
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-black transition-all">
                            <span className="material-symbols-outlined">hub</span>
                        </div>
                        <h4 className="text-lg font-black italic uppercase text-text-main mb-3 leading-tight">Neural Network Simulations</h4>
                        <p className="text-sm text-slate-500 mb-6 font-medium">Proprietary engines running 10k+ game runs per matchup.</p>
                        <ul className="space-y-2">
                            <li className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1 h-1 bg-primary rounded-full"></span> Monte Carlo v4.2
                            </li>
                            <li className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1 h-1 bg-primary rounded-full"></span> Live Roster Sync
                            </li>
                        </ul>
                    </div>

                    <div className="terminal-panel p-8 group border-accent-purple/10 relative">
                        <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} variant="green" />
                        <div className="w-12 h-12 rounded-lg bg-accent-purple/10 flex items-center justify-center text-accent-purple mb-6 group-hover:bg-accent-purple group-hover:text-white transition-all">
                            <span className="material-symbols-outlined">visibility</span>
                        </div>
                        <h4 className="text-lg font-black italic uppercase text-white mb-3 leading-tight">Sharp & Whale Intelligence</h4>
                        <p className="text-sm text-slate-500 mb-6 font-medium">Tracking pro money movements and large volume signals.</p>
                        <ul className="space-y-2">
                            <li className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1 h-1 bg-accent-purple rounded-full"></span> Money Flow Heatmaps
                            </li>
                            <li className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1 h-1 bg-accent-purple rounded-full"></span> Vegas Line Alerts
                            </li>
                        </ul>
                    </div>
                    <div className="terminal-panel p-8 group border-accent-blue/10 relative">
                        <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} variant="green" />
                        <div className="w-12 h-12 rounded-lg bg-accent-blue/10 flex items-center justify-center text-accent-blue mb-6 group-hover:bg-accent-blue group-hover:text-white transition-all">
                            <span className="material-symbols-outlined">analytics</span>
                        </div>
                        <h4 className="text-lg font-black italic uppercase text-text-main mb-3 leading-tight">Stat-Prop Engine</h4>
                        <p className="text-sm text-slate-500 mb-6 font-medium">Historical player performance mapped against defenses.</p>
                        <ul className="space-y-2">
                            <li className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1 h-1 bg-accent-blue rounded-full"></span> Micro-Trend Analysis
                            </li>
                            <li className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1 h-1 bg-accent-blue rounded-full"></span> Value-Prop Alerts
                            </li>
                        </ul>
                    </div>
                    <div className="terminal-panel p-8 group border-primary/10 relative">
                        <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} variant="green" />
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-black transition-all">
                            <span className="material-symbols-outlined">balance</span>
                        </div>
                        <h4 className="text-lg font-black italic uppercase text-white mb-3 leading-tight">Arbitrage & EV+ Tools</h4>
                        <p className="text-sm text-slate-500 mb-6 font-medium">Finding market inefficiencies across 20+ sportsbooks.</p>
                        <ul className="space-y-2">
                            <li className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1 h-1 bg-primary rounded-full"></span> Real-time EV Scanning
                            </li>
                            <li className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1 h-1 bg-primary rounded-full"></span> Multi-Book Arbs
                            </li>
                        </ul>
                    </div>
                </div>
            </section>



            <section className="max-w-7xl mx-auto px-6 py-32 border-b border-border-muted bg-background-dark relative">
                <div className="text-center mb-16 relative z-10">
                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-accent-purple mb-4">Wall of Fame</h3>
                    <h2 className="text-3xl md:text-5xl font-black italic uppercase text-text-main tracking-tight">
                        Community <span className="text-accent-purple">Report</span>
                    </h2>
                    <p className="text-text-muted mt-4 max-w-2xl mx-auto text-sm md:text-base">
                        Don't just take our word for it. See what 50,000+ sharp bettors, analysts, and community members are saying across the web.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    {COMMUNITY_REVIEWS.map((review, idx) => (
                        <div key={idx} className="terminal-panel p-6 bg-neutral-900 border-border-muted flex flex-col h-full hover:border-accent-purple/50 transition-colors relative">
                            <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={2} variant="green" />
                            <div className="flex items-center gap-1 mb-4">
                                {[...Array(review.rating)].map((_, i) => (
                                    <span key={i} className="material-symbols-outlined text-xs text-yellow-500 fill-current" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                ))}
                            </div>
                            <p className="text-xs text-text-muted italic mb-8 flex-grow leading-relaxed font-medium">
                                {review.text}
                            </p>
                            <div className="flex items-center justify-between border-t border-border-muted/50 pt-4 mt-auto">
                                <span className="text-[10px] font-bold text-text-main uppercase tracking-wider">{review.name}</span>
                                <div className="flex items-center gap-2">
                                    <img src={review.logo} alt={review.platform} className="w-4 h-4 rounded grayscale opacity-50" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── DEVELOPER API ── */}
            <section className="w-full px-4 sm:px-6 py-24 bg-neutral-950 border-y border-border-muted">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left — simulated API terminal */}
                    <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-[#0d0d0d] shadow-2xl">
                        {/* Window chrome */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800 bg-neutral-900/80">
                            <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                            <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                            <span className="w-3 h-3 rounded-full bg-primary/80"></span>
                            <span className="ml-4 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Live Play-by-Play Feed</span>
                        </div>
                        {/* Simulated response */}
                        <div className="p-6 font-mono text-[11px] leading-relaxed space-y-1 min-h-[320px] overflow-hidden">
                            <p className="text-slate-600">GET /v2/live/nba/game/1584692</p>
                            <p className="text-slate-600 mb-4">200 OK</p>
                            <p className="text-slate-500"><span className="text-yellow-400">"gameId"</span>: <span className="text-primary">"1584692"</span>,</p>
                            <p className="text-slate-500"><span className="text-yellow-400">"teams"</span>: {'{'} <span className="text-yellow-400">"away"</span>: <span className="text-primary">"LAL"</span>, <span className="text-yellow-400">"home"</span>: <span className="text-primary">"GSW"</span> {'}'}</p>
                            <p className="text-slate-500"><span className="text-yellow-400">"score"</span>: {'{'} <span className="text-yellow-400">"away"</span>: <span className="text-cyan-400">112</span>, <span className="text-yellow-400">"home"</span>: <span className="text-cyan-400">109</span> {'}'}</p>
                            <p className="text-slate-500"><span className="text-yellow-400">"clock"</span>: <span className="text-primary">"02:14"</span>, <span className="text-yellow-400">"quarter"</span>: <span className="text-cyan-400">4</span>,</p>
                            <p className="text-slate-500 mt-3"><span className="text-yellow-400">"lastPlay"</span>: {'{'}</p>
                            <p className="text-slate-500 pl-4"><span className="text-yellow-400">"type"</span>: <span className="text-primary">"EVENT"</span>,</p>
                            <p className="text-slate-500 pl-4"><span className="text-yellow-400">"desc"</span>: <span className="text-primary">"L. James makes 28-foot three point jumper"</span></p>
                            <p className="text-slate-500">{'}'}</p>
                            <p className="text-slate-500 mt-3"><span className="text-yellow-400">"oddsShift"</span>: {'{'}</p>
                            <p className="text-slate-500 pl-4"><span className="text-yellow-400">"type"</span>: <span className="text-orange-400">"ALERT"</span>,</p>
                            <p className="text-slate-500 pl-4"><span className="text-yellow-400">"desc"</span>: <span className="text-primary">"LAL Moneyline shifts from -110 to -145 across 4 books."</span></p>
                            <p className="text-slate-500">{'}'}</p>
                            <p className="text-slate-500 mt-3"><span className="text-yellow-400">"injury"</span>: {'{'}</p>
                            <p className="text-slate-500 pl-4"><span className="text-yellow-400">"type"</span>: <span className="text-red-400">"INJURY"</span>,</p>
                            <p className="text-slate-500 pl-4"><span className="text-yellow-400">"desc"</span>: <span className="text-primary">"S. Curry (GSW) heading to locker room (Ankle)."</span></p>
                            <p className="text-slate-500">{'}'}</p>
                            {/* blinking cursor */}
                            <span className="inline-block w-2 h-4 bg-primary animate-pulse mt-2 align-middle"></span>
                        </div>

                    </div>

                    {/* Right — copy */}
                    <div className="flex flex-col gap-6">
                        <span className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-full border border-border-muted bg-neutral-900 text-[10px] font-black uppercase tracking-widest text-slate-300">
                            <span className="material-symbols-outlined text-sm text-primary">code</span>
                            Developer API
                        </span>

                        <h2 className="text-4xl md:text-5xl font-black italic uppercase text-text-main tracking-tight leading-none">
                            Build With The <span className="text-primary">Ultimate API.</span>
                        </h2>

                        <p className="text-text-muted text-sm leading-relaxed max-w-md">
                            Power your own applications, sportsbooks, or analytical tools with our enterprise-grade REST and WebSocket APIs. Access raw data for every major sport from a single endpoint.
                        </p>

                        <ul className="space-y-3 mt-2">
                            {[
                                'NFL, NBA, MLB, NHL, NCAA, Soccer & Tennis',
                                'Real-time Live Scores & Clock Status',
                                'Deep Player Rosters & Active Injuries',
                                'Odds Aggregation Across 20+ Sportsbooks',
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-wider text-text-muted">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <button className="mt-4 self-start px-10 py-4 border-2 border-border-muted bg-neutral-900 text-text-main rounded-xl text-xs font-black uppercase tracking-[0.2em] italic hover:border-primary/60 hover:text-primary transition-all">
                            View Documentation
                        </button>
                    </div>
                </div>
            </section>

            {/* ── CONSUMER DATA FEED ── */}
            <section className="w-full px-4 sm:px-6 py-24 bg-background-dark border-b border-border-muted">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left — copy */}
                    <div className="flex flex-col gap-6">
                        <span className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-[10px] font-black uppercase tracking-widest text-primary">
                            <span className="material-symbols-outlined text-sm">bolt</span>
                            Consumer Data Feed
                        </span>

                        <h2 className="text-4xl md:text-5xl font-black italic uppercase text-text-main tracking-tight leading-none">
                            The Fastest <span className="text-primary">Data<br />Engine</span> In Sports.
                        </h2>

                        <p className="text-text-muted text-sm leading-relaxed max-w-md">
                            PickLabs isn't just analytics; it's a fully integrated data pipeline. Get real-time game logs, precise player proposition tracking, and instant injury updates seconds before the sportsbooks react.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
                            {[
                                { icon: 'sports_score', title: 'Live Match Coverage', desc: 'Sub-second updates on 8+ global leagues.' },
                                { icon: 'personal_injury', title: 'Injury Intelligence', desc: 'Instant depth chart and roster adjustments.' },
                                { icon: 'query_stats', title: 'Advanced Player Logs', desc: 'Deep L5/L10/L20 vs Opponent historicals.' },
                                { icon: 'newspaper', title: 'Breaking News Filters', desc: 'Curated sharp news directly affecting lines.' },
                            ].map((feat, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-primary text-base">{feat.icon}</span>
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-text-main">{feat.title}</h4>
                                        <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">{feat.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — live play-by-play terminal */}
                    <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-[#0d0d0d] shadow-2xl">
                        {/* Window chrome */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800 bg-neutral-900/80">
                            <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                            <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                            <span className="w-3 h-3 rounded-full bg-primary/80"></span>
                            <span className="ml-4 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Live Play-by-Play Feed</span>
                        </div>
                        {/* Feed rows */}
                        <div className="p-5 font-mono text-[11px] space-y-0 divide-y divide-neutral-800/60">
                            {[
                                { q: 'Q4', t: '02:14', type: 'EVENT', typeColor: 'text-primary', desc: 'L. James makes 28-foot three point jumper (A. Davis assists)' },
                                { q: 'Q4', t: '02:40', type: 'ALERT', typeColor: 'text-orange-400', desc: 'LAL Moneyline shifts from -110 to -145 across 4 books.' },
                                { q: 'Q4', t: '03:01', type: 'INJURY', typeColor: 'text-red-400', desc: 'S. Curry (GSW) heading to locker room (Ankle).' },
                                { q: 'Q4', t: '03:15', type: 'EVENT', typeColor: 'text-primary', desc: 'Golden State full timeout.' },
                                { q: 'Q4', t: '03:44', type: 'ALERT', typeColor: 'text-orange-400', desc: 'GSW spread moves from +3 to +5.5 at 3 books.' },
                                { q: 'Q4', t: '04:10', type: 'EVENT', typeColor: 'text-primary', desc: 'A. Davis with the block — turnover GSW.' },
                            ].map((row, i) => (
                                <div key={i} className="flex items-start gap-3 py-3">
                                    <div className="flex flex-col items-end w-12 flex-shrink-0">
                                        <span className="text-slate-600 text-[10px]">{row.q}</span>
                                        <span className="text-slate-500 text-[10px]">{row.t}</span>
                                    </div>
                                    <span className={`text-[9px] font-black uppercase w-12 flex-shrink-0 pt-0.5 ${row.typeColor}`}>{row.type}</span>
                                    <span className="text-slate-300 leading-relaxed text-[10px]">{row.desc}</span>
                                </div>
                            ))}
                            <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-16 mt-1 align-middle"></span>
                        </div>
                    </div>
                </div>
            </section>

            <section id="pricing" className="w-full px-4 sm:px-6 py-32">
                <div className="max-w-[1400px] mx-auto">
                    <PricingSection tiers={PICKLABS_TIERS} />
                </div>
            </section>

            <Footer />
        </div >
    );
};
