import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-[48px] min-h-[48px] w-full rounded-2xl border border-[#E5E7EB] bg-[#F4F6F5] px-4 py-2 text-xs font-medium text-[#1A1D1E] placeholder:text-[#9CA3AF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B6440]/20 focus-visible:border-[#1B6440] disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
