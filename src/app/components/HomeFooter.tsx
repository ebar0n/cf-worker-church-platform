import Link from 'next/link';
import { Github, Instagram, Phone } from 'lucide-react';
import { CHURCH_CONTACT } from '@/lib/constants';

const LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/announcements', label: 'Anuncios' },
  { href: '#horarios', label: 'Horarios' },
  { href: '#contacto', label: 'Contacto' },
  { href: '/member', label: 'Actualizar mis datos' },
];

// Home v2 footer. Interior pages keep the shared Footer until their redesign.
export default function HomeFooter() {
  return (
    <footer className="bg-ink text-paper px-5 pb-8 pt-14 md:px-8 lg:px-0 lg:pb-10 lg:pt-[72px]">
      <div className="mx-auto flex w-full max-w-[75rem] flex-col gap-8 lg:gap-14">
        <div className="grid grid-cols-2 gap-6 text-[15px] lg:grid-cols-12">
          <div className="col-span-2 flex flex-col gap-5 lg:col-span-5">
            <div className="flex items-center gap-3">
              <img
                src="/church-logo.png"
                alt=""
                className="h-9 w-9 rounded-full object-cover lg:h-12 lg:w-12"
              />
              <span className="font-heading text-[22px] font-bold lg:text-[26px]">El Jordán</span>
            </div>
            <p className="text-ink-muted m-0 max-w-[340px] leading-relaxed">
              Iglesia Adventista del Séptimo Día en Ibagué, Tolima.
            </p>
          </div>
          <nav aria-label="Enlaces" className="flex flex-col gap-3.5 lg:col-span-3 lg:col-start-7">
            <p className="text-ink-muted m-0 text-[13px]">Enlaces</p>
            {LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="text-paper hover:text-warm no-underline">
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-3.5 lg:col-span-3 lg:col-start-10">
            <p className="text-ink-muted m-0 text-[13px]">Redes</p>
            <a
              href="https://www.instagram.com/iglesia.jordan.ibague/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-paper hover:text-warm flex items-center gap-2 no-underline"
            >
              <Instagram className="h-[18px] w-[18px]" strokeWidth={1.5} />
              Instagram
            </a>
            <a
              href={`tel:${CHURCH_CONTACT.pastorPhone.replace(/\s/g, '')}`}
              className="text-paper hover:text-warm flex items-center gap-2 no-underline"
            >
              <Phone className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {CHURCH_CONTACT.pastorPhone}
            </a>
          </div>
        </div>

        <div className="border-ink-line text-ink-muted flex flex-col gap-3 border-t pt-6 text-sm lg:flex-row-reverse lg:items-center lg:justify-between">
          <a
            href="https://github.com/ebar0n/cf-worker-church-platform"
            target="_blank"
            rel="noopener noreferrer"
            className="text-warm flex items-center gap-2 font-medium no-underline"
          >
            <Github className="h-[18px] w-[18px]" strokeWidth={1.5} />
            Código abierto en GitHub
          </a>
          <span>
            © {new Date().getFullYear()} Iglesia Adventista del Séptimo Día El Jordán · Ibagué
          </span>
        </div>
      </div>
    </footer>
  );
}
