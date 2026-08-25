import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B6440] disabled:pointer-events-none disabled:opacity-50 select-none tracking-tight cursor-pointer active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-[#1B6440] hover:bg-[#154E30] text-white shadow-sm hover:shadow',
        destructive: 'bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-sm',
        outline: 'border border-[#E5E7EB] bg-white hover:bg-[#F4F6F5] text-[#1A1D1E]',
        secondary: 'bg-[#F4F6F5] hover:bg-[#EAECEB] text-[#1A1D1E]',
        soft: 'bg-[#EBF5F0] hover:bg-[#DEEDE6] text-[#1B6440] font-bold',
        ghost: 'hover:bg-[#F4F6F5] text-[#1A1D1E]',
      },
      size: {
        default: 'h-[48px] min-h-[48px] px-4 py-2',
        sm: 'h-[40px] min-h-[40px] px-3.5 rounded-xl text-xs',
        lg: 'h-[54px] min-h-[54px] px-6 text-sm rounded-full',
        pill: 'h-[48px] min-h-[48px] px-5 rounded-full text-xs',
        icon: 'h-[44px] w-[44px] min-h-[44px] min-w-[44px] rounded-full',
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
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
