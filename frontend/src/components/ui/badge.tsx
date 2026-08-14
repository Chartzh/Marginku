import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold transition-colors select-none tabular-nums',
  {
    variants: {
      variant: {
        default: 'border-[#262830] bg-[#18191e] text-[#f3f4f6]',
        secondary: 'border-[#262830] bg-[#131417] text-[#9ca3af]',
        outline: 'border-[#262830] text-[#f3f4f6]',
        safe: 'border-[#166534] bg-[#142e1f] text-[#22c55e]',
        warning: 'border-[#b45309] bg-[#3d2612] text-[#fbbf24]',
        danger: 'border-[#b91c1c] bg-[#3b181b] text-[#f87171]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
