import React from 'react';
import Header from '@/app/components/Header';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#f8f6f2]">
      <Header />
      <div className="mx-auto my-8 max-w-4xl px-4">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="mb-8 text-center text-3xl font-bold text-[#4b207f]">
            Política de Privacidad
          </h1>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#4b207f]">1. Información que Recopilamos</h2>
              <p className="mt-4 text-gray-700">
                Recopilamos información que usted nos proporciona directamente a través de nuestros formularios
                y servicios, incluyendo datos personales necesarios para brindarle el servicio solicitado.
                La información específica que recopilamos puede variar según el servicio o formulario que utilice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#4b207f]">2. Uso de la Información</h2>
              <p className="mt-4 text-gray-700">
                Utilizamos la información recopilada para:
              </p>
              <ul className="mt-2 list-disc pl-6 text-gray-700">
                <li>Contactarlo para responder a su solicitud</li>
                <li>Brindarle el servicio o información solicitada</li>
                <li>Mantener un registro de las solicitudes recibidas</li>
                <li>Mejorar nuestros servicios</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#4b207f]">3. Protección de Datos</h2>
              <p className="mt-4 text-gray-700">
                Nos comprometemos a proteger su información personal. Implementamos medidas de seguridad
                técnicas y organizativas para proteger sus datos contra acceso no autorizado,
                alteración, divulgación o destrucción.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#4b207f]">4. Compartición de Información</h2>
              <p className="mt-4 text-gray-700">
                No compartimos su información personal con terceros, excepto cuando:
              </p>
              <ul className="mt-2 list-disc pl-6 text-gray-700">
                <li>Es necesario para brindarle el servicio solicitado</li>
                <li>Estamos legalmente obligados a hacerlo</li>
                <li>Usted nos da su consentimiento explícito</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#4b207f]">5. Sus Derechos</h2>
              <p className="mt-4 text-gray-700">
                Usted tiene derecho a:
              </p>
              <ul className="mt-2 list-disc pl-6 text-gray-700">
                <li>Acceder a sus datos personales</li>
                <li>Rectificar sus datos personales</li>
                <li>Solicitar la eliminación de sus datos</li>
                <li>Oponerse al procesamiento de sus datos</li>
                <li>Solicitar la limitación del procesamiento</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#4b207f]">6. Contacto</h2>
              <p className="mt-4 text-gray-700">
                Si tiene preguntas sobre esta política de privacidad o sobre cómo manejamos sus datos,
                puede contactarnos a través de:
              </p>
              <ul className="mt-2 list-disc pl-6 text-gray-700">
                <li>Email: jordan.jordan.asurcol@gmail.com</li>
                <li>Pastor Sergio Sana: +57 320 854 0929</li>
                <li>Dirección: Mza 3 Casa 12 Jordan 4 Etapa, Ibagué, Tolima, Colombia</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-[#4b207f]">7. Cambios en la Política</h2>
              <p className="mt-4 text-gray-700">
                Nos reservamos el derecho de modificar esta política de privacidad en cualquier momento.
                Cualquier cambio será publicado en esta página y, si los cambios son significativos,
                le notificaremos por correo electrónico.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-[#4b207f]">8. Consentimiento</h2>
              <p className="mt-4 text-gray-700">
                Al utilizar nuestros servicios y proporcionar su información, usted acepta los términos
                de esta política de privacidad. Si no está de acuerdo con esta política, por favor no
                utilice nuestros servicios.
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