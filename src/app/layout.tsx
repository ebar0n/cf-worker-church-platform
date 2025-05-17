import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Iglesia Jordan Ibagué',
  description: 'Un lugar para encontrar paz, esperanza y comunidad',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
