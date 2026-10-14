import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Kit buttons: default = primary (warm), outline = secondary, dark = on
// warm-soft surfaces only, destructive for irreversible admin actions.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-denim disabled:pointer-events-none disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-warm text-ink hover:bg-warm-hover',
        dark: 'bg-ink text-paper hover:bg-gray-800',
        destructive: 'bg-[#b3261e] text-white hover:bg-[#9a1f19]',
        outline: 'border border-ink bg-white text-ink hover:bg-[#f0ece5]',
        secondary: 'border border-line bg-white text-ink hover:bg-gray-100',
        ghost: 'text-ink hover:bg-gray-100',
        link: 'text-denim underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 px-3 text-sm',
        lg: 'h-[52px] px-6 text-base',
        icon: 'h-10 w-10',
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
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
