'use client';
import React from 'react';
import { Button } from './button';
import { cn } from '../../lib/utils';
import { MenuToggleIcon } from './menu-toggle-icon';
import { useScroll } from './use-scroll';
import { ViewType } from '../shared/PremiumLockView';

interface HeaderProps {
    onNavigate?: (view: ViewType) => void;
}

export function Header({ onNavigate }: HeaderProps) {
    const [open, setOpen] = React.useState(false);
    const scrolled = useScroll(10);

    const links = [
        {
            label: 'Features',
            href: '#',
        },
        {
            label: 'Pricing',
            href: '#',
        },
        {
            label: 'About',
            href: '#',
        },
    ];

    React.useEffect(() => {
        if (open) {
            // Disable scroll
            document.body.style.overflow = 'hidden';
        } else {
            // Re-enable scroll
            document.body.style.overflow = '';
        }

        // Cleanup when component unmounts (important for Next.js)
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    return (
        <header
            className={cn(
                'sticky top-0 z-50 mx-auto w-full max-w-7xl border-b border-transparent md:border md:transition-all md:ease-out text-slate-100',
                {
                    'bg-[#0a0a0a]/95 supports-[backdrop-filter]:bg-[#0a0a0a]/80 border-border-muted backdrop-blur-lg md:top-4 md:shadow-lg':
                        scrolled && !open,
                    'bg-[#0a0a0a]/90': open,
                },
            )}
        >
            <nav
                className={cn(
                    'flex h-16 w-full items-center justify-between px-6 md:transition-all md:ease-out',
                    {
                        'md:px-6': scrolled,
                    },
                )}
            >
                <a className="brand-logo flex items-center gap-3 w-fit group" href="#" onClick={(e) => { e.preventDefault(); onNavigate?.('landing-page'); }}>
                    <img
                        src="/picklabs-full-logo.svg"
                        alt="PickLabs Logo"
                        className="h-10 md:h-12 w-auto transition-transform duration-300 drop-shadow-[0_0_15px_rgba(13,242,13,0.3)] hover:scale-105"
                    />
                </a>
                <div className="hidden items-center gap-6 md:flex">
                    {links.map((link, i) => (
                        <a key={i} className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-colors" href={link.href}>
                            {link.label}
                        </a>
                    ))}
                    <div className="flex items-center gap-2 ml-4">
                        <button onClick={() => onNavigate?.('login-page')} className="px-6 py-2 bg-neutral-800 border border-border-muted rounded-full text-[10px] font-black uppercase tracking-widest text-text-main hover:border-primary/50 transition-all">Log In</button>
                        <button onClick={() => onNavigate?.('live-board')} className="px-6 py-2 bg-primary border border-primary rounded-full text-[10px] font-black uppercase tracking-widest text-black hover:bg-primary/80 transition-all">Enter</button>
                    </div>
                </div>
                <Button size="icon" variant="outline" onClick={() => setOpen(!open)} className="md:hidden bg-neutral-800 border-neutral-700 hover:bg-neutral-700">
                    <MenuToggleIcon open={open} className="size-5" duration={300} />
                </Button>
            </nav>

            <div
                className={cn(
                    'bg-[#0a0a0a]/95 fixed top-16 right-0 bottom-0 left-0 z-50 flex flex-col overflow-hidden border-y border-neutral-800 md:hidden backdrop-blur-xl',
                    open ? 'block' : 'hidden',
                )}
            >
                <div
                    data-slot={open ? 'open' : 'closed'}
                    className={cn(
                        'data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95 ease-out',
                        'flex h-full w-full flex-col justify-between gap-y-2 p-6',
                    )}
                >
                    <div className="grid gap-y-2">
                        {links.map((link) => (
                            <a
                                key={link.label}
                                className="text-lg font-black uppercase tracking-widest text-white hover:text-primary py-4 border-b border-neutral-800"
                                href={link.href}
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                    <div className="flex flex-col gap-4 mb-8">
                        <button onClick={() => onNavigate?.('login-page')} className="w-full py-4 bg-neutral-800 border border-neutral-700 rounded-full text-xs font-black uppercase tracking-widest text-white hover:border-primary/50 transition-all">Log In</button>
                        <button onClick={() => onNavigate?.('live-board')} className="w-full py-4 bg-primary border border-primary rounded-full text-xs font-black uppercase tracking-widest text-black hover:bg-primary/80 transition-all">Enter</button>
                    </div>
                </div>
            </div>
        </header>
    );
}


