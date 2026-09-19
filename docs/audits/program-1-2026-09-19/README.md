# Auditoría local de inscripción familiar — 19 de septiembre de 2026

Prueba realizada en `http://localhost:3000/program/1`, con el programa local
«Aventureros 2025 2», D1 y R2 locales y claves de prueba de Turnstile.
No se visitó el dominio productivo ni se desplegaron cambios.

Todos los nombres, documentos, teléfonos, datos de salud e imágenes usados en
esta evidencia son ficticios. Los PDF son descargas sin modificar del servicio
local: sirven para comprobar el resultado, no como autorizaciones reales.

## Familia y formatos descargados

| Persona                              | Documento ficticio | Nacimiento | Formato                                  |
| ------------------------------------ | ------------------ | ---------- | ---------------------------------------- |
| Andrés Muñoz QA, padre               | 9900192601         | 1988-04-12 | [PDF del padre](prueba-padre.pdf)        |
| María Pérez QA, madre                | 9900192602         | 1991-06-15 | [PDF de la madre](prueba-madre.pdf)      |
| José Muñoz Pérez QA, hijo de 2 años  | 9900192603         | 2024-03-05 | [PDF del hijo](prueba-hijo-2-anos.pdf)   |
| Lucía Muñoz Pérez QA, hija de 5 años | 9900192604         | 2021-02-10 | [PDF de la hija](prueba-hija-5-anos.pdf) |

Los adultos tienen un formato de una página para su firma manuscrita. Cada
menor tiene dos páginas: datos y autorización, más una hoja identificada con
el nombre/documento del menor y espacios separados para las firmas de ambos
padres. Los espacios de firma están deliberadamente en blanco.

## Recorrido verificado

1. Entrar como padre; guardar datos básicos y completar su salud, foto y copia
   del documento mediante el formulario.
2. Registrar al hijo de 2 años con salud y archivos PNG reales de prueba.
3. Agregar a la madre con su información, foto y documento.
4. Registrar a la hija de 5 años después de agregar a la madre. Ambos padres
   recuperan los dos hijos al consultar su grupo.
5. Entrar como madre, registrar el contacto de emergencia «Ángela Torres QA»,
   teléfono ficticio `3000001905`, y comprobar que también lo recibe el padre.
6. Intentar cerrar un formulario modificado: aparece «Cambios sin guardar».
   Elegir «Seguir editando» conserva los campos; guardar muestra confirmación.
7. Marcar las dos casillas: aún no aparecen descargas. Pulsar «Confirmar y
   habilitar descargas»: se persiste la aceptación de la madre y aparecen los
   cuatro formatos. No se atribuye esa aceptación al padre.
8. Descargar los cuatro PDF desde los enlaces del navegador. Recargar y entrar
   de nuevo como madre: las cuatro descargas siguen disponibles.
9. Reabrir la edición de la madre: alergias, medicamentos y archivos siguen
   presentes. Comprobar por API local los ocho adjuntos contra los archivos
   originales, byte por byte.
10. Extraer texto de los cuatro PDF y cotejar nombres, documentos, salud y
    contacto de emergencia. Renderizar e inspeccionar las seis páginas;
    comprobar márgenes y los bloques de firma de ambos padres. La alergia larga
    del niño se ajusta a varias líneas sin perder texto.

## Fallos corregidos

- La finalización solo cambiaba estado visual; ahora guarda la aceptación
  explícita y la recupera al volver a entrar.
- Editar al responsable principal enviaba consentimientos sin haber marcado
  casillas. La edición ahora guarda únicamente sus datos.
- La consulta de responsables omitía alergias, condiciones y medicamentos;
  abrir y guardar el modal podía sobrescribirlos con `n/a`.
- El PDF del menor incluía un solo responsable. Ahora incluye los padres/tutores
  inscritos vinculados al menor y sus respectivos bloques de firma.
- Campos largos se salían del PDF y no había paginación. Ahora se ajustan al
  ancho, continúan en nuevas páginas y llevan número de página/documento.
- Un hijo agregado después del otro padre podía no aparecer al entrar con ese
  padre. Ahora se vincula a los responsables existentes de la familia.
- Salud incompleta del segundo responsable podía aceptarse sin guardarse;
  ahora se rechaza antes de modificar identidad o almacenar archivos.
- Los archivos se validan ambos antes de subirlos, evitando una foto huérfana
  cuando el documento adjunto es inválido.
- Se añaden etiquetas accesibles, errores visibles dentro del modal, avisos de
  guardado y protección al cerrar/recargar con cambios pendientes.

## Verificación automatizada

- 127 pruebas unitarias y de componentes.
- 135 pruebas de integración sobre el Worker compilado en workerd, D1/R2 local.
- Compilación OpenNext/Cloudflare y TypeScript sin errores.
- ESLint sin errores; conserva advertencias previas del repositorio.
- Formato comprobado en archivos versionados y archivos nuevos del PR. El
  comando global también encuentra una configuración local no versionada de
  `.claude`; no se modifica esa configuración personal.

Las pruebas de regresión cubren consentimiento explícito, restauración de
las descargas, conservación de salud, cierre sin perder cambios, segundo hijo
vinculado a ambos padres, archivos PNG reales, firma de ambos padres y textos
largos en PDF.

## Alcance y límites

- No requiere migraciones ni nuevas dependencias.
- El modelo existente une a los responsables mediante un niño compartido.
  Por eso la interfaz pide guardar primero un niño antes de añadir al otro
  padre/tutor, evitando crear un adulto que luego desaparezca del grupo.
- La aceptación digital registrada no sustituye las firmas manuscritas.
  Cada adulto firma su formato y ambos padres firman el de cada menor.
- La consulta por documento y Turnstile conserva el mecanismo de acceso
  existente. Turnstile comprueba bots, no la identidad del responsable; esta
  auditoría funcional no implementa verificación por OTP ni una cuenta de usuario.
- Se comprobó la subida de imágenes; no se usó la cámara física del equipo.
- El merge y el despliegue a producción quedan a cargo del propietario.
