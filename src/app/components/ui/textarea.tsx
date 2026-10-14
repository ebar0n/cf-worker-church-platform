import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        'text-ink focus-visible:border-denim focus-visible:outline-denim/25 flex min-h-28 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base leading-relaxed transition-colors placeholder:text-gray-500 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500 aria-[invalid=true]:border-[#b3261e]',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
