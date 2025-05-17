import React from 'react';
import Header from '@/app/components/Header';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <Header />
      <div className="mx-auto my-8 max-w-4xl px-4">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="mb-8 text-center text-3xl font-bold text-[#4b207f]">
            Política de Tratamiento de Datos Personales
          </h1>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#4b207f]">
                1. Información que Recopilamos
              </h2>
              <p className="mt-4 text-gray-700">
                En cumplimiento de la normativa vigente en materia de protección de datos
                personales, le informamos que la información proporcionada a través de nuestros
                formularios será incorporada a nuestros sistemas de información. La recopilación de
                datos se realiza con el propósito de mantener una relación pastoral efectiva y
                brindar los servicios solicitados.
              </p>
              <p className="mt-4 text-gray-700">
                La información recopilada será la estrictamente necesaria para el cumplimiento de
                los fines establecidos en esta política.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#4b207f]">
                2. Finalidad del Tratamiento
              </h2>
              <p className="mt-4 text-gray-700">
                Los datos personales proporcionados serán utilizados para las siguientes
                finalidades:
              </p>
              <ul className="mt-2 list-disc pl-6 text-gray-700">
                <li>Gestión administrativa y pastoral de la membresía</li>
                <li>Mantenimiento del registro de miembros y visitantes</li>
                <li>Comunicación y contacto pastoral</li>
                <li>Coordinación de actividades y ministerios</li>
                <li>Atención de solicitudes y consultas</li>
                <li>Mejora continua de nuestros servicios</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#4b207f]">3. Protección de Datos</h2>
              <p className="mt-4 text-gray-700">
                Nos comprometemos a manejar sus datos personales con responsabilidad y cuidado.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#4b207f]">
                4. Compartición de Información
              </h2>
              <p className="mt-4 text-gray-700">
                La información proporcionada será tratada con absoluta confidencialidad y solo podrá
                ser compartida en los siguientes supuestos:
              </p>
              <ul className="mt-2 list-disc pl-6 text-gray-700">
                <li>Con el equipo pastoral para el cumplimiento de sus funciones</li>
                <li>
                  Con líderes de ministerios específicos cuando sea necesario para el desarrollo de
                  sus actividades
                </li>
                <li>Cuando exista una obligación legal que así lo requiera</li>
                <li>Con su consentimiento previo y expreso</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#4b207f]">5. Derechos del Titular</h2>
              <p className="mt-4 text-gray-700">
                Como titular de los datos personales, usted tiene derecho a:
              </p>
              <ul className="mt-2 list-disc pl-6 text-gray-700">
                <li>Conocer y acceder a sus datos personales</li>
                <li>Actualizar o rectificar sus datos personales</li>
                <li>Solicitar la eliminación de sus datos personales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#4b207f]">6. Contacto</h2>
              <p className="mt-4 text-gray-700">
                Para ejercer sus derechos o realizar consultas sobre el tratamiento de sus datos
                personales, puede contactarnos a través de los siguientes medios:
              </p>
              <ul className="mt-2 list-disc pl-6 text-gray-700">
                <li>Correo electrónico: jordan.jordan.asurcol@gmail.com</li>
                <li>Pastor Sergio Sana: +57 320 854 0929</li>
                <li>Dirección: Mza 3 Casa 12 Jordan 4 Etapa, Ibagué, Tolima, Colombia</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#4b207f]">7. Modificaciones</h2>
              <p className="mt-4 text-gray-700">
                Nos reservamos el derecho de modificar esta política de tratamiento de datos
                personales en cualquier momento. Las modificaciones entrarán en vigor desde su
                publicación en esta página. Se recomienda consultar periódicamente esta política
                para estar al tanto de cualquier cambio.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#4b207f]">8. Consentimiento</h2>
              <p className="mt-4 text-gray-700">
                Al proporcionar sus datos personales a través de nuestros formularios, usted
                manifiesta su consentimiento expreso para el tratamiento de sus datos conforme a lo
                establecido en esta política. Si no está de acuerdo con estos términos, le
                recomendamos abstenerse de proporcionar sus datos personales.
              </p>
            </section>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
            <p>Última actualización: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
