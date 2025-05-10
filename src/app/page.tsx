import InstagramFeed from '@/app/components/InstagramFeed';
import Header from '@/app/components/Header';
import Hero from '@/app/components/Hero';
import Welcome from '@/app/components/Welcome';
import Services from '@/app/components/Services';
import Contact from '@/app/components/Contact';

export default async function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Welcome />
      <Services />
      <InstagramFeed />
      <Contact />
    </div>
  );
}
