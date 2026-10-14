import React from 'react';
import Footer from '@/app/components/Footer';
import Header from '@/app/components/Header';
import { CHURCH_CONTACT } from '@/lib/constants';

export default function PrivacyPolicy() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[880px] flex-1 px-5 py-14 md:px-8 lg:py-24">
        <h1 className="m-0 mb-10 text-[40px] leading-[1.04] lg:mb-14 lg:text-[56px]">
          Política de Tratamiento de Datos Personales
        </h1>

        <div className="flex flex-col gap-10 text-[17px] leading-[1.7] lg:text-lg">
          <section>
            <h2 className="m-0 text-[28px] leading-[1.15] lg:text-[32px]">
              1. Información que Recopilamos
            </h2>
            <p className="m-0 mt-4">
              En cumplimiento de la normativa vigente en materia de protección de datos personales,
              le informamos que la información proporcionada a través de nuestros formularios será
              incorporada a nuestros sistemas de información. La recopilación de datos se realiza
              con el propósito de mantener una relación pastoral efectiva y brindar los servicios
              solicitados.
            </p>
            <p className="m-0 mt-4">
              La información recopilada será la estrictamente necesaria para el cumplimiento de los
              fines establecidos en esta política.
            </p>
          </section>

          <section>
            <h2 className="m-0 text-[28px] leading-[1.15] lg:text-[32px]">
              2. Finalidad del Tratamiento
            </h2>
            <p className="m-0 mt-4">
              Los datos personales proporcionados serán utilizados para las siguientes finalidades:
            </p>
            <ul className="m-0 mt-3 flex list-disc flex-col gap-2 pl-[22px]">
              <li>Gestión administrativa y pastoral de la membresía</li>
              <li>Mantenimiento del registro de miembros y visitantes</li>
              <li>Comunicación y contacto pastoral</li>
              <li>Coordinación de actividades y ministerios</li>
              <li>Atención de solicitudes y consultas</li>
              <li>Mejora continua de nuestros servicios</li>
            </ul>
          </section>

          <section>
            <h2 className="m-0 text-[28px] leading-[1.15] lg:text-[32px]">
              3. Protección de Datos
            </h2>
            <p className="m-0 mt-4">
              Nos comprometemos a manejar sus datos personales con responsabilidad y cuidado.
            </p>
          </section>

          <section>
            <h2 className="m-0 text-[28px] leading-[1.15] lg:text-[32px]">
              4. Compartición de Información
            </h2>
            <p className="m-0 mt-4">
              La información proporcionada será tratada con absoluta confidencialidad y solo podrá
              ser compartida en los siguientes supuestos:
            </p>
            <ul className="m-0 mt-3 flex list-disc flex-col gap-2 pl-[22px]">
              <li>Con el equipo pastoral para el cumplimiento de sus funciones</li>
              <li>
                Con líderes de ministerios específicos cuando sea necesario para el desarrollo de
                sus actividades
              </li>
              <li>Cuando exista una obligación legal que así lo requiera</li>
              <li>Con su consentimiento previo y expreso</li>
            </ul>
          </section>

          <section>
            <h2 className="m-0 text-[28px] leading-[1.15] lg:text-[32px]">
              5. Derechos del Titular
            </h2>
            <p className="m-0 mt-4">Como titular de los datos personales, usted tiene derecho a:</p>
            <ul className="m-0 mt-3 flex list-disc flex-col gap-2 pl-[22px]">
              <li>Conocer y acceder a sus datos personales</li>
              <li>Actualizar o rectificar sus datos personales</li>
              <li>Solicitar la eliminación de sus datos personales</li>
            </ul>
          </section>

          <section>
            <h2 className="m-0 text-[28px] leading-[1.15] lg:text-[32px]">6. Contacto</h2>
            <p className="m-0 mt-4">
              Para ejercer sus derechos o realizar consultas sobre el tratamiento de sus datos
              personales, puede contactarnos a través de los siguientes medios:
            </p>
            <ul className="m-0 mt-3 flex list-disc flex-col gap-2 pl-[22px]">
              <li>Correo electrónico: {CHURCH_CONTACT.email}</li>
              <li>
                {CHURCH_CONTACT.pastorName}: {CHURCH_CONTACT.pastorPhone}
              </li>
              <li>Dirección: {CHURCH_CONTACT.address}</li>
            </ul>
          </section>

          <section>
            <h2 className="m-0 text-[28px] leading-[1.15] lg:text-[32px]">7. Modificaciones</h2>
            <p className="m-0 mt-4">
              Nos reservamos el derecho de modificar esta política de tratamiento de datos
              personales en cualquier momento. Las modificaciones entrarán en vigor desde su
              publicación en esta página. Se recomienda consultar periódicamente esta política para
              estar al tanto de cualquier cambio.
            </p>
          </section>

          <section>
            <h2 className="m-0 text-[28px] leading-[1.15] lg:text-[32px]">8. Consentimiento</h2>
            <p className="m-0 mt-4">
              Al proporcionar sus datos personales a través de nuestros formularios, usted
              manifiesta su consentimiento expreso para el tratamiento de sus datos conforme a lo
              establecido en esta política. Si no está de acuerdo con estos términos, le
              recomendamos abstenerse de proporcionar sus datos personales.
            </p>
          </section>
        </div>

        <div className="border-line text-ink-soft mt-12 border-t pt-6 text-sm">
          <p className="m-0">Última actualización: {new Date().toLocaleDateString()}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
