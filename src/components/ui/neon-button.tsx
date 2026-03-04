import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

function cn(...classes: (string | undefined | false | null)[]) {
    return classes.filter(Boolean).join(' ');
}

const buttonVariants = cva(
    'relative group border rounded-full',
    {
        variants: {
            variant: {
                default: 'bg-black border-white/10 text-white',
                solid: 'bg-primary text-black border-transparent hover:brightness-110 transition-all duration-200',
                ghost: 'border-transparent bg-transparent hover:border-white/20 text-white',
            },
            size: {
                default: 'px-7 py-1.5',
                sm: 'px-4 py-0.5',
                lg: 'px-10 py-2.5',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    neon?: boolean;
}

const NeonButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, neon = true, size, variant, children, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size }), className)}
                ref={ref}
                {...props}
            >
                {/* Top white neon line — flashes in on hover */}
                <span className={cn(
                    'absolute h-px opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out',
                    'inset-x-0 top-0 bg-gradient-to-r w-3/4 mx-auto',
                    'from-transparent via-white to-transparent',
                    !neon && 'hidden'
                )} style={{ filter: 'blur(1px)' }} />

                {children}

                {/* Bottom white neon glow */}
                <span className={cn(
                    'absolute opacity-20 group-hover:opacity-60 transition-all duration-500 ease-in-out',
                    'inset-x-0 h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto',
                    'from-transparent via-white to-transparent',
                    !neon && 'hidden'
                )} style={{ filter: 'blur(1px)' }} />

                {/* White bloom drop below on hover */}
                {neon && (
                    <span className="absolute -bottom-4 inset-x-0 mx-auto w-1/2 h-4 opacity-0 group-hover:opacity-30 transition-all duration-500 blur-md bg-white rounded-full pointer-events-none" />
                )}
            </button>
        );
    }
);

NeonButton.displayName = 'NeonButton';

export { NeonButton, buttonVariants };
