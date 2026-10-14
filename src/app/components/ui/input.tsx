import * as React from 'react';
import { cn } from '@/lib/utils';

// Kit field: 48px, 12px radius, denim focus, red border when aria-invalid
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'text-ink focus-visible:border-denim focus-visible:outline-denim/25 flex h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500 aria-[invalid=true]:border-[#b3261e]',
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
