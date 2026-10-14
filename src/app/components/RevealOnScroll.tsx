'use client';

import { useEffect } from 'react';

// Fades [data-reveal] blocks in as they scroll into view. Runs after
// hydration and only hides what is still below the fold, so the server HTML
// is fully visible without JS and nothing already on screen flashes.
export default function RevealOnScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.reveal = 'shown';
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
      if (element.getBoundingClientRect().top < window.innerHeight) return;
      element.dataset.reveal = 'hidden';
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
