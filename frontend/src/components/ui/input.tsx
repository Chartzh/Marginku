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
          'flex h-[52px] min-h-[52px] w-full rounded-xl border border-[#262830] bg-[#131417] px-3.5 py-2 text-xs text-[#f3f4f6] placeholder:text-[#9ca3af] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#16a34a] focus-visible:border-[#16a34a] disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
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
