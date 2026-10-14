'use client';

import React from 'react';
import { ImageOff } from 'lucide-react';

export type MarkdownImageSize = 'sm' | 'md' | 'lg';

const SIZES: Record<
  MarkdownImageSize,
  {
    wrapper: string;
    fallback: string;
    fallbackIcon: string;
    spinner: string;
    radius: string;
    maxHeight: string;
  }
> = {
  sm: {
    wrapper: 'mb-2',
    fallback: 'p-3 text-xs',
    fallbackIcon: 'h-3.5 w-3.5',
    spinner: 'h-4 w-4',
    radius: 'rounded-lg',
    maxHeight: '200px',
  },
  md: {
    wrapper: 'mb-2',
    fallback: 'p-4 text-sm',
    fallbackIcon: 'h-4 w-4',
    spinner: 'h-6 w-6',
    radius: 'rounded-xl',
    maxHeight: '300px',
  },
  lg: {
    wrapper: 'mb-4',
    fallback: 'p-6 text-[15px]',
    fallbackIcon: 'h-5 w-5',
    spinner: 'h-8 w-8',
    radius: 'rounded-2xl',
    maxHeight: '500px',
  },
};

type MarkdownImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  // react-markdown passes the mdast node alongside the HTML props
  node?: unknown;
  size?: MarkdownImageSize;
};

/**
 * `img` renderer for react-markdown: shows a spinner while loading and a
 * placeholder when the image fails. It has to be a named component (not an
 * inline `img: () => {...}` override) because it uses hooks. Spans, not divs:
 * markdown images sit inside a <p>.
 */
export function MarkdownImage({ node, size = 'md', alt, ...props }: MarkdownImageProps) {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);
  const styles = SIZES[size];

  if (imageError) {
    return (
      <span
        className={`${styles.wrapper} ${styles.radius} ${styles.fallback} flex items-center justify-center gap-2 border border-dashed border-gray-300 bg-gray-100 text-gray-500`}
      >
        <ImageOff className={styles.fallbackIcon} strokeWidth={1.5} />
        Imagen no disponible
      </span>
    );
  }

  return (
    <span className={`relative block ${styles.wrapper}`}>
      {imageLoading && (
        <span
          className={`absolute inset-0 flex items-center justify-center bg-[#efebe4] ${styles.radius}`}
        >
          <span
            className={`${styles.spinner} border-ink animate-spin rounded-full border-2 border-t-transparent`}
          />
        </span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- markdown images are arbitrary remote URLs */}
      <img
        {...props}
        alt={alt ?? ''}
        className={`block max-w-full ${styles.radius} transition-opacity duration-200 ${
          imageLoading ? 'opacity-0' : 'opacity-100'
        }`}
        loading="lazy"
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageLoading(false);
          setImageError(true);
        }}
        style={{ maxHeight: styles.maxHeight, objectFit: 'contain' }}
      />
    </span>
  );
}
