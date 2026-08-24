import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors select-none tabular-nums',
  {
    variants: {
      variant: {
        default: 'bg-[#F4F6F5] text-[#1A1D1E] border border-[#E5E7EB]',
        secondary: 'bg-[#F8F9FA] text-[#6B7280] border border-[#E5E7EB]',
        outline: 'border border-[#E5E7EB] bg-white text-[#1A1D1E]',
        safe: 'bg-[#EBF5F0] text-[#1B6440] border border-[#D1E7DD]',
        warning: 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]',
        danger: 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]',
        brand: 'bg-[#1B6440] text-white',
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
