'use client';

import { useEffect, useState } from 'react';
import { nextService } from '@/lib/services';

// The home is static and CDN-cached, so "next service" can only be worked out
// in the browser; until then a placeholder keeps the card's height.
export default function NextService() {
  const [next, setNext] = useState<ReturnType<typeof nextService> | null>(null);

  useEffect(() => {
    setNext(nextService());
  }, []);

  if (!next) {
    return (
      <div aria-hidden className="flex flex-col gap-2.5 lg:gap-3.5">
        <span className="bg-ink/10 block h-9 w-44 rounded-lg lg:h-11" />
        <span className="bg-ink/10 block h-5 w-32 rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 lg:gap-3.5">
      <p className="font-heading m-0 text-4xl font-bold leading-none tracking-[-0.02em] lg:text-[44px]">
        {next.when}
      </p>
      <p className="m-0 text-[15px] font-medium leading-snug lg:text-base">{next.name}</p>
    </div>
  );
}
