import { ArrowRight, Clock, MapPin, Phone } from 'lucide-react';
import { CHURCH_CONTACT } from '@/lib/constants';

const MAP_EMBED =
  'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d4610.009238907434!2d-75.19363153228265!3d4.43726144745299!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e38c51b91b9a5b3%3A0x733a569dee0ddf36!2sIglesia%20Adventista%20del%207%C2%B0%20D%C3%ADa%20El%20Jord%C3%A1n!5e0!3m2!1ses!2sco!4v1746830988052!5m2!1ses!2sco';
const DIRECTIONS = 'https://maps.google.com/?q=Iglesia+Adventista+El+Jordan+Ibague';

export default function Contact() {
  const phoneHref = `tel:${CHURCH_CONTACT.pastorPhone.replace(/\s/g, '')}`;

  return (
    <section
      id="contacto"
      className="mx-auto grid w-full max-w-[75rem] scroll-mt-6 gap-3 px-5 py-14 md:px-8 lg:grid-cols-[5fr_7fr] lg:gap-6 lg:py-32 xl:px-0"
    >
      <iframe
        src={MAP_EMBED}
        title="Mapa de la Iglesia Adventista El Jordán"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block h-[300px] w-full rounded-[18px] border-0 bg-[#2a2825] lg:order-2 lg:h-full lg:min-h-[600px] lg:rounded-3xl"
      />

      <div
        data-reveal
        className="border-line flex flex-col justify-center rounded-[18px] border bg-white p-6 lg:order-1 lg:gap-1 lg:rounded-3xl lg:p-10"
      >
        <h2 className="font-heading m-0 mb-2 text-[32px] font-bold leading-none tracking-[-0.02em] lg:mb-3 lg:text-[44px]">
          Visítanos
        </h2>
        <div className="border-line flex gap-3.5 border-t py-3.5 lg:gap-4 lg:py-4">
          <MapPin className="mt-0.5 h-5 w-5 flex-none lg:h-[22px] lg:w-[22px]" strokeWidth={1.5} />
          <div>
            <p className="text-ink-soft m-0 text-[13px]">Dirección</p>
            <p className="m-0 text-[15px] leading-normal lg:text-base">{CHURCH_CONTACT.address}</p>
          </div>
        </div>
        <div className="border-line flex gap-3.5 border-t py-3.5 lg:gap-4 lg:py-4">
          <Phone className="mt-0.5 h-5 w-5 flex-none lg:h-[22px] lg:w-[22px]" strokeWidth={1.5} />
          <div>
            <p className="text-ink-soft m-0 text-[13px]">{CHURCH_CONTACT.pastorName}</p>
            <a href={phoneHref} className="text-denim text-[15px] leading-normal lg:text-base">
              {CHURCH_CONTACT.pastorPhone}
            </a>
          </div>
        </div>
        <div className="border-line flex gap-3.5 border-t py-3.5 lg:gap-4 lg:py-4">
          <Clock className="mt-0.5 h-5 w-5 flex-none lg:h-[22px] lg:w-[22px]" strokeWidth={1.5} />
          <div className="text-[15px] leading-normal lg:text-base">
            <p className="text-ink-soft m-0 text-[13px]">Horario de servicios</p>
            <p className="m-0">Sábados: 9:30 AM – 1:00 PM</p>
            <p className="m-0">Miércoles: 7:00 PM – 9:00 PM</p>
          </div>
        </div>
        <a
          href={DIRECTIONS}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-warm text-ink hover:bg-warm-hover mt-1.5 flex h-[52px] items-center justify-between rounded-xl px-5 text-base font-medium no-underline transition-colors duration-200 lg:mt-2 lg:px-[22px]"
        >
          Cómo llegar
          <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </a>
      </div>
    </section>
  );
}
