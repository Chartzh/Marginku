import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] disabled:pointer-events-none disabled:opacity-50 select-none tracking-normal cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-[#16a34a] hover:bg-[#15803d] text-white',
        destructive: 'bg-[#dc2626] hover:bg-[#b91c1c] text-white',
        outline: 'border border-[#262830] bg-[#18191e] hover:bg-[#262830] text-[#f3f4f6]',
        secondary: 'bg-[#262830] hover:bg-[#323540] text-[#f3f4f6]',
        ghost: 'hover:bg-[#262830] text-[#f3f4f6]',
      },
      size: {
        default: 'h-[52px] min-h-[52px] px-4 py-2',
        sm: 'h-[44px] min-h-[44px] px-3 rounded-lg',
        lg: 'h-[56px] min-h-[56px] px-6 text-sm',
        icon: 'h-[52px] w-[52px] min-h-[52px] min-w-[52px]',
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
