import React from 'react';
import { ChevronDown } from 'lucide-react';

// Kit select: the native <select> in the field box, with a chevron on the right
export default function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="text-ink focus-visible:border-denim focus-visible:outline-denim/25 h-12 w-full appearance-none rounded-xl border border-gray-300 bg-white pl-4 pr-11 text-base focus-visible:outline-2 focus-visible:outline-offset-2"
      />
      <ChevronDown
        className="text-ink-soft pointer-events-none absolute right-3.5 top-3.5 h-5 w-5"
        strokeWidth={1.5}
      />
    </div>
  );
}
