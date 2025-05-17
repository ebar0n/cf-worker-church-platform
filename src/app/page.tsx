import InstagramFeed from '@/app/components/InstagramFeed';
import Header from '@/app/components/Header';
import Hero from '@/app/components/Hero';
import Welcome from '@/app/components/Welcome';
import Services from '@/app/components/Services';
import Contact from '@/app/components/Contact';
import Footer from '@/app/components/Footer';
import Link from 'next/link';

export default async function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Welcome />
      <div className="bg-[#f5f0ff] py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#4b207f] mb-4">¿Eres miembro de nuestra iglesia?</h2>
            <p className="text-gray-600 mb-6">Mantén tus datos actualizados para estar al día con nuestras actividades y ministerios.</p>
            <Link
              href="/member"
              className="inline-flex items-center gap-2 rounded-lg bg-[#4b207f] px-6 py-3 text-white hover:bg-[#4b207f]/90 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Actualizar mis datos
            </Link>
          </div>
        </div>
      </div>
      <Services />
      <InstagramFeed />
      <Contact />
      <Footer />
    </div>
  );
}
