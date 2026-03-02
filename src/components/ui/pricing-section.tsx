import { useState } from 'react';
import { Button } from './button';
import { Badge } from './badge';
import { ArrowRightIcon, CheckIcon } from '@radix-ui/react-icons';
import { cn } from '../../lib/utils';
import { GlowingEffect } from './glowing-effect';

interface Feature {
    name: string;
    description: string;
    included: boolean;
}

export interface PricingTier {
    name: string;
    price: { monthly: number | string; yearly: number | string };
    description: string;
    features: Feature[];
    highlight?: boolean;
    badge?: string;
    accentColor?: 'green' | 'purple' | 'blue' | 'default';
    ctaLabel?: string;
    icon: React.ReactNode;
    onCta?: () => void;
}

interface PricingSectionProps {
    tiers: PricingTier[];
    className?: string;
    title?: string;
    subtitle?: string;
}

export function PricingSection({ tiers, className, title = 'Choose Your Edge', subtitle }: PricingSectionProps) {
    const [isYearly, setIsYearly] = useState(false);

    return (
        <div className={cn('w-full', className)}>
            {/* Header */}
            <div className="text-center mb-16 space-y-4">
                <h3 className="text-3xl md:text-5xl font-black italic uppercase text-text-main tracking-tight">
                    {title}
                </h3>
                {subtitle && (
                    <p className="text-text-muted text-sm max-w-xl mx-auto">{subtitle}</p>
                )}

                {/* Toggle */}
                <div className="flex items-center justify-center gap-4 mt-6">
                    <span className={cn(
                        'text-[10px] font-black uppercase tracking-widest transition-colors',
                        !isYearly ? 'text-primary' : 'text-slate-500'
                    )}>
                        Monthly
                    </span>
                    <button
                        onClick={() => setIsYearly(!isYearly)}
                        className={cn(
                            'relative w-12 h-6 rounded-full border transition-all duration-300',
                            isYearly
                                ? 'bg-primary border-primary'
                                : 'bg-neutral-800 border-neutral-700'
                        )}
                    >
                        <span className={cn(
                            'absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300',
                            isYearly
                                ? 'left-[calc(100%-1.375rem)] bg-black'
                                : 'left-0.5 bg-slate-400'
                        )} />
                    </button>
                    <span className={cn(
                        'text-[10px] font-black uppercase tracking-widest transition-colors',
                        isYearly ? 'text-primary' : 'text-slate-500'
                    )}>
                        Yearly <span className="text-accent-purple">(Save 20%)</span>
                    </span>
                </div>
            </div>

            {/* Cards grid — uniform height via items-stretch on the grid */}
            <div className={cn(
                'grid gap-6 items-stretch',
                tiers.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto' :
                    tiers.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                        'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
            )}>
                {tiers.map((tier) => {
                    const glowColor = tier.highlight
                        ? tier.accentColor === 'purple' ? 'purple' : 'green'
                        : 'green';

                    const price = isYearly ? tier.price.yearly : tier.price.monthly;

                    return (
                        /* Outer wrapper: pt-5 reserves space so the badge sitting above the card is never clipped */
                        <div key={tier.name} className="relative pt-5 flex flex-col">

                            {/* Badge — rendered OUTSIDE the card div so it flows properly and sits perfectly centered on the top card border */}
                            {tier.badge && (
                                <div className="absolute top-5 left-6 -translate-y-1/2 z-20 bg-background-dark p-1 rounded-full flex items-center justify-center">
                                    <Badge className={cn(
                                        'px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] border-none shadow-[0_0_15px_rgba(0,0,0,0.5)]',
                                        tier.accentColor === 'purple'
                                            ? 'bg-accent-purple text-white'
                                            : 'bg-primary text-black'
                                    )}>
                                        {tier.badge}
                                    </Badge>
                                </div>
                            )}

                            {/* Card — flex-1 ensures all cards in the row grow to the same height */}
                            <div
                                className={cn(
                                    'pricing-card flex flex-col flex-1 relative transition-all duration-300 p-6',
                                    tier.highlight && tier.accentColor === 'purple' && 'border-accent-purple/50 bg-neutral-900 shadow-[0_0_30px_rgba(168,85,247,0.15)]',
                                    tier.highlight && tier.accentColor !== 'purple' && 'border-primary/40 bg-neutral-900 shadow-[0_0_30px_rgba(13,242,13,0.1)]',
                                    !tier.highlight && 'border-border-muted/50 bg-neutral-900/40',
                                )}
                            >
                                <GlowingEffect
                                    spread={40}
                                    glow={true}
                                    disabled={false}
                                    proximity={64}
                                    inactiveZone={0.01}
                                    borderWidth={2}
                                    variant={glowColor as 'green'}
                                />

                                {/* Icon + Name */}
                                <div className="flex items-center justify-between mb-5">
                                    <div className={cn(
                                        'w-11 h-11 rounded-xl flex items-center justify-center',
                                        tier.accentColor === 'purple' ? 'bg-accent-purple/10 text-accent-purple' : 'bg-primary/10 text-primary'
                                    )}>
                                        {tier.icon}
                                    </div>
                                    <h4 className="text-xl font-black italic uppercase text-text-main">{tier.name}</h4>
                                </div>

                                {/* Price */}
                                <div className="mb-6">
                                    <div className="flex items-baseline gap-2">
                                        <span className={cn(
                                            'text-5xl font-black italic tracking-tighter',
                                            tier.highlight && tier.accentColor !== 'purple' ? 'text-primary' : 'text-text-main'
                                        )}>
                                            ${price}
                                        </span>
                                        <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">
                                            /{isYearly ? 'yr' : 'mo'}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
                                        {tier.description}
                                    </p>
                                </div>

                                {/* Features — flex-grow pushes CTA to the bottom */}
                                <div className="space-y-3 flex-grow mb-8">
                                    {tier.features.map((feature) => (
                                        <div key={feature.name} className="flex gap-3">
                                            <div className={cn(
                                                'mt-0.5 flex-shrink-0 transition-colors duration-200',
                                                feature.included
                                                    ? tier.accentColor === 'purple' ? 'text-accent-purple' : 'text-primary'
                                                    : 'text-slate-700'
                                            )}>
                                                <CheckIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className={cn(
                                                    'text-[11px] font-bold uppercase tracking-wide',
                                                    feature.included ? 'text-text-muted' : 'text-slate-700'
                                                )}>
                                                    {feature.name}
                                                </div>
                                                {feature.description && (
                                                    <div className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">
                                                        {feature.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA Button — always at the bottom */}
                                <div className="space-y-3 mt-auto">
                                    <Button
                                        onClick={tier.onCta}
                                        className={cn(
                                            'w-full h-12 text-xs font-black uppercase tracking-[0.2em] italic rounded-xl transition-all duration-300',
                                            tier.highlight && tier.accentColor === 'purple'
                                                ? 'bg-accent-purple text-white hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-[1.02]'
                                                : tier.highlight
                                                    ? 'bg-primary text-black hover:scale-[1.02] shadow-[0_0_20px_rgba(13,242,13,0.3)] hover:shadow-[0_0_25px_rgba(13,242,13,0.5)]'
                                                    : 'border-2 border-border-muted bg-neutral-900/60 text-text-muted hover:border-primary/40 hover:text-text-main'
                                        )}
                                    >
                                        <span className="flex items-center justify-center gap-2">
                                            {tier.ctaLabel ?? 'Get Started'}
                                            <ArrowRightIcon className="w-4 h-4" />
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
