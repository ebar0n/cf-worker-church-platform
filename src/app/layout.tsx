import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegistrar from './components/ServiceWorkerRegistrar';

const inter = Inter({ subsets: ['latin'] });

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
  themeColor: '#4b207f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
