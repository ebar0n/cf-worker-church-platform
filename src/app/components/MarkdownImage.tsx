'use client';

import React from 'react';

export type MarkdownImageSize = 'sm' | 'md' | 'lg';

const SIZES: Record<
  MarkdownImageSize,
  {
    wrapper: string;
    fallback: string;
    fallbackIcon: string;
    spinner: string;
    shadow: string;
    maxHeight: string;
  }
> = {
  sm: {
    wrapper: 'mb-2',
    fallback: 'p-3 text-xs',
    fallbackIcon: 'mr-1 h-3 w-3',
    spinner: 'h-4 w-4',
    shadow: 'shadow-sm',
    maxHeight: '200px',
  },
  md: {
    wrapper: 'mb-2',
    fallback: 'p-4 text-sm',
    fallbackIcon: 'mr-2 h-4 w-4',
    spinner: 'h-6 w-6',
    shadow: 'shadow-sm',
    maxHeight: '300px',
  },
  lg: {
    wrapper: 'mb-4',
    fallback: 'p-6',
    fallbackIcon: 'mr-2 h-6 w-6',
    spinner: 'h-8 w-8',
    shadow: 'shadow-lg',
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
 * inline `img: () => {...}` override) because it uses hooks.
 */
export function MarkdownImage({ node, size = 'md', alt, ...props }: MarkdownImageProps) {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);
  const styles = SIZES[size];

  if (imageError) {
    return (
      <div
        className={`${styles.wrapper} flex items-center justify-center rounded bg-gray-100 ${styles.fallback} text-gray-500`}
      >
        <svg className={styles.fallbackIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Imagen no disponible
      </div>
    );
  }

  return (
    <div className={`relative ${styles.wrapper}`}>
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded bg-gray-100">
          <div
            className={`${styles.spinner} animate-spin rounded-full border-2 border-[#4b207f] border-t-transparent`}
          ></div>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- markdown images are arbitrary remote URLs */}
      <img
        {...props}
        alt={alt ?? ''}
        className={`max-w-full rounded ${styles.shadow} transition-opacity duration-200 ${
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
    </div>
  );
}
