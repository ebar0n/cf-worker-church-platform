import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import ServiceWorkerRegistrar from './components/ServiceWorkerRegistrar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

// Headings: Advent Sans, the church's official typeface (adventist.design),
// subset to Latin. It ships one weight; the full range stops the browser
// from faking bold on font-semibold/font-bold headings.
const adventSans = localFont({
  src: '../../public/fonts/advent-sans-logo.woff2',
  weight: '100 900',
  variable: '--font-advent',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Iglesia Jordan Ibagué',
  description: 'Un lugar para encontrar paz, esperanza y comunidad',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  // PWA: volunteers install the site from Safari and use it offline
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Iglesia Jordán',
    statusBarStyle: 'default',
  },
  openGraph: {
    title: 'Iglesia Jordan Ibagué',
    description: 'Un lugar para encontrar paz, esperanza y comunidad',
    images: ['/church-social.jpg'],
    type: 'website',
    locale: 'es_CO',
    siteName: 'Iglesia Jordan Ibagué',
  },
  metadataBase: new URL('https://iglesiajordanibague.org'),
  alternates: {
    canonical: '/',
    languages: {
      'es-ES': '/es-ES',
    },
  },
};

// themeColor lives in the viewport export in Next 15+, not in metadata
export const viewport: Viewport = {
  themeColor: '#faf8f4',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${adventSans.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
