import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
    // Read initial state from <html> class or localStorage
    const [isDark, setIsDark] = useState(() => {
        if (typeof window === 'undefined') return true;
        return document.documentElement.classList.contains('dark') ||
            localStorage.getItem('theme') !== 'light';
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    return (
        <div
            className={cn(
                'flex w-16 h-8 p-1 rounded-full cursor-pointer transition-all duration-300',
                isDark
                    ? 'bg-zinc-950 border border-zinc-700'
                    : 'bg-white border border-zinc-300',
                className
            )}
            onClick={() => setIsDark(!isDark)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setIsDark(!isDark)}
            aria-label="Toggle theme"
        >
            <div className="flex justify-between items-center w-full">
                {/* Left icon — active side */}
                <div
                    className={cn(
                        'flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300',
                        isDark ? 'translate-x-0 bg-zinc-800' : 'translate-x-8 bg-gray-200'
                    )}
                >
                    {isDark ? (
                        <Moon className="w-4 h-4 text-white" strokeWidth={1.5} />
                    ) : (
                        <Sun className="w-4 h-4 text-gray-700" strokeWidth={1.5} />
                    )}
                </div>
                {/* Right icon — inactive side */}
                <div
                    className={cn(
                        'flex justify-center items-center w-6 h-6 rounded-full transition-transform duration-300',
                        isDark ? 'bg-transparent' : '-translate-x-8'
                    )}
                >
                    {isDark ? (
                        <Sun className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                    ) : (
                        <Moon className="w-4 h-4 text-black" strokeWidth={1.5} />
                    )}
                </div>
            </div>
        </div>
    );
}
