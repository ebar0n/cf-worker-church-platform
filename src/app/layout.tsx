import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Iglesia Jordan Ibagué',
  description: 'Un lugar para encontrar paz, esperanza y comunidad',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Iglesia Jordan Ibagué',
    description: 'Un lugar para encontrar paz, esperanza y comunidad',
    images: [
      {
        url: '/church-social.jpg',
        width: 1200,
        height: 630,
        alt: 'Iglesia Jordan Ibagué',
      },
    ],
    type: 'website',
    locale: 'es_CO',
    siteName: 'Iglesia Jordan Ibagué',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Iglesia Jordan Ibagué',
    description: 'Un lugar para encontrar paz, esperanza y comunidad',
    images: ['/church-social.jpg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
