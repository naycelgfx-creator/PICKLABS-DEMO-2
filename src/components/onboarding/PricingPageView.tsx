import React from "react";
import { PricingSection } from "../ui/pricing-section";
import { Sparkles, Zap, Shield, Star } from "lucide-react";
import { ViewType } from "../shared/PremiumLockView";
import { redirectToStripeCheckout } from "../../data/stripeCheckout";

interface PricingPageViewProps {
  onNavigate: (view: ViewType) => void;
}

export const PricingPageView: React.FC<PricingPageViewProps> = ({
  onNavigate,
}) => {

  const TIERS = [
    {
      name: "7-Day Free Trial",
      price: { monthly: "0", yearly: "0" },
      description: "START YOUR JOURNEY ON PICKLABS FREE",
      ctaLabel: "Start Free Trial",
      onCta: () => onNavigate("sport-selection"),
      icon: <Zap className="w-5 h-5" />,
      features: [
        {
          name: "7-Day Free Trial",
          description: "Today's top sharp public picks",
          included: true,
        },
        {
          name: "20 Free AI Tokens",
          description: "All major sports & leagues",
          included: true,
        },
        {
          name: "No Credit Card Required",
          description: "Charts, heatmaps & team stats",
          included: true,
        },
        {
          name: "Injury Reports",
          description: "Real-time roster updates",
          included: true,
        },
        {
          name: "Odds Comparison",
          description: "Line shopping across books",
          included: false,
        },
        {
          name: "Real Time Betting Alerts",
          description: "Sharp money & line move alerts",
          included: false,
        },
        {
          name: "EV+ Bet Indicators",
          description: "Positive expected value tags",
          included: false,
        },
        {
          name: "Arbitrage Feed",
          description: "Guaranteed profit opportunities",
          included: false,
        },
      ],
    },
    {
      name: "Premium",
      price: { monthly: "19.99", yearly: "199.99" },
      description: "Core analytics suite",
      accentColor: "default" as const,
      ctaLabel: "Get Premium",
      onCta: (isYearly: boolean) => redirectToStripeCheckout('premium', isYearly),
      icon: <Shield className="w-5 h-5" />,
      features: [
        {
          name: "Trending Insights",
          description: "Today's top sharp public picks",
          included: true,
        },
        {
          name: "Thousands of Props & Games",
          description: "All major sports & leagues",
          included: true,
        },
        {
          name: "Advanced Visuals",
          description: "Charts, heatmaps & team stats",
          included: true,
        },
        {
          name: "Injury Reports",
          description: "Real-time roster updates",
          included: true,
        },
        {
          name: "Odds Comparison",
          description: "Line shopping across books",
          included: true,
        },
        {
          name: "Real Time Betting Alerts",
          description: "Sharp money & line move alerts",
          included: true,
        },
        {
          name: "EV+ Bet Indicators",
          description: "Positive expected value tags",
          included: false,
        },
        {
          name: "Arbitrage Feed",
          description: "Guaranteed profit opportunities",
          included: false,
        },
      ],
    },
    {
      name: "Premium+",
      price: { monthly: "29.99", yearly: "299.99" },
      description: "Early bird: 50% off · Best value",
      highlight: true,
      badge: "Best Value",
      accentColor: "purple" as const,
      ctaLabel: "Get Premium+",
      onCta: (isYearly: boolean) => redirectToStripeCheckout('premium_plus', isYearly),
      icon: <Sparkles className="w-5 h-5" />,
      features: [
        {
          name: "Everything in Premium",
          description: "All Premium features included",
          included: true,
        },
        {
          name: "Odds Movement Charts",
          description: "Real-time line history visualization",
          included: true,
        },
        {
          name: "EV+ Bet Indicators",
          description: "Positive expected value tags",
          included: true,
        },
        {
          name: "Positive EV Power Feed",
          description: "Live +EV opportunity stream",
          included: true,
        },
        {
          name: "Sharp Book Odds",
          description: "Pinnacle & sharp book comparisons",
          included: true,
        },
        {
          name: "Boost Index",
          description: "Promo value scoring",
          included: true,
        },
        {
          name: "Arbitrage Feed",
          description: "Guaranteed profit opportunities",
          included: false,
        },
        {
          name: "Middle Betting",
          description: "Two-way market gap detection",
          included: false,
        },
      ],
    },
    {
      name: "Pro",
      price: { monthly: "79.99", yearly: "359.99" },
      description: "Get Pro for 38% off · Full access",
      highlight: true,
      badge: "All Access",
      accentColor: "green" as const,
      ctaLabel: "Get Pro",
      onCta: (isYearly: boolean) => redirectToStripeCheckout('pro', isYearly),
      icon: <Star className="w-5 h-5" />,
      features: [
        {
          name: "Everything in Premium+",
          description: "All Premium+ features included",
          included: true,
        },
        {
          name: "Arbitrage Feed",
          description: "Guaranteed profit opportunities",
          included: true,
        },
        {
          name: "Middle Betting",
          description: "Two-way market gap detection",
          included: true,
        },
        {
          name: "Unlimited API Access",
          description: "Full REST & WebSocket endpoints",
          included: true,
        },
        {
          name: "Priority Support",
          description: "24/7 dedicated support channel",
          included: true,
        },
        {
          name: "Early Feature Access",
          description: "Beta features before public release",
          included: true,
        },
        {
          name: "Custom Alerts",
          description: "Build personalized betting triggers",
          included: true,
        },
        {
          name: "Export & Reporting",
          description: "Download your full bet history & stats",
          included: true,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background-dark text-slate-100 flex flex-col font-display selection:bg-primary selection:text-black">
      {/* Top Navigation */}
      <header className="px-6 py-6 flex items-center justify-between border-b border-border-muted/30 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <img
            src="/picklabs-full-logo.svg"
            alt="PickLabs Logo"
            className="h-16 md:h-24 w-auto cursor-pointer"
            onClick={() => onNavigate("landing-page")}
          />
        </div>
        {/* SKIP FOR NOW BUTTON */}
        <button
          onClick={() => onNavigate("live-board")}
          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors flex items-center gap-1 hover:bg-white/5 px-3 py-1.5 rounded-full"
        >
          Skip for now{" "}
          <span className="material-symbols-outlined text-sm">
            chevron_right
          </span>
        </button>
      </header>

      <main className="flex-1 flex flex-col justify-center py-16 px-4">
        <div className="max-w-[1400px] mx-auto w-full">
          <PricingSection
            tiers={TIERS}
            title="CHOOSE YOUR PLAN"
            subtitle="Experience the ultimate sports analytics platform risk-free for 7 days. Choose your edge below."
          />
        </div>
      </main>
    </div>
  );
};
