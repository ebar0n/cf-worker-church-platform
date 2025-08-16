'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import Image from 'next/image';

interface Question {
  id: number;
  question: string;
  answer: string;
  type: 'text' | 'list' | 'presentation';
  presentationDate?: string;
  visitInfo?: { place: string; date: string };
}

export default function InteligenciaArtificialPage() {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [presentationDates, setPresentationDates] = useState<Record<number, string>>({});
  const [visitInfo, setVisitInfo] = useState<{ place: string; date: string }>({ place: '', date: '' });
  const [completionDate, setCompletionDate] = useState('');
  const [instructor, setInstructor] = useState('');
  const [showHelp, setShowHelp] = useState<Record<number, boolean>>({});

  const questions: Question[] = [
    {
      id: 1,
      question: '¿Qué es la inteligencia artificial?',
      answer: `**Respuesta básica:**
La inteligencia artificial (IA) es una rama de la informática que busca crear sistemas capaces de realizar tareas que normalmente requieren inteligencia humana.

**Para los curiosos - Profundicemos:**

**¿Qué es "inteligencia"?**
La inteligencia es la capacidad de:
• Aprender de la experiencia
• Resolver problemas complejos
• Adaptarse a nuevas situaciones
• Razonar y tomar decisiones
• Comprender conceptos abstractos
• Usar el conocimiento de manera creativa

**¿Qué significa "artificial"?**
Artificial significa "creado por el ser humano", no natural. En este contexto:
• Sistemas creados por programadores e ingenieros
• Algoritmos y código de computadora
• Hardware diseñado para procesar información
• Modelos matemáticos que simulan procesos mentales

**Ejemplos cotidianos de IA:**
• Siri/Alexa que entienden tu voz
• Netflix que recomienda películas
• Google Maps que encuentra la mejor ruta
• Filtros de spam en tu email
• Cámaras que reconocen caras
• Traductores automáticos como Google Translate`,
      type: 'text'
    },
    {
      id: 2,
      question: 'Individualmente o en un grupo, desarrollar un diagrama que muestra en forma breve la historia de la inteligencia artificial. Preparar y dar una presentación oral.',
      answer: `**Línea de tiempo básica:**
1950s → 1956 → 1960s-70s → 1980s → 1990s-2000s → 2010s → 2020s

**Para los curiosos - Historia detallada:**

**🕰️ 1950s - Los Fundamentos**
• Alan Turing propone el famoso "Test de Turing"
• Pregunta clave: "¿Puede una máquina pensar?"
• Primera computadora programable ENIAC (1946)
• Turing publica "Computing Machinery and Intelligence"

**🚀 1956 - Nace la IA**
• Conferencia de Dartmouth (verano de 1956)
• John McCarthy acuña el término "Inteligencia Artificial"
• Se establecen los objetivos principales de la IA
• Participan pioneros como Marvin Minsky y Claude Shannon

**🔬 1960s-70s - Los Sistemas Expertos**
• Desarrollo de programas que imitan expertos humanos
• MYCIN: diagnostica infecciones médicas
• DENDRAL: identifica estructuras químicas
• Primeros robots industriales

**🧠 1980s - Redes Neuronales**
• Inspiradas en el cerebro humano
• Algoritmo de "backpropagation" (retropropagación)
• Máquinas que "aprenden" de los errores
• Boom comercial de la IA

**📊 1990s-2000s - Machine Learning**
• Enfoque estadístico y probabilístico
• Internet proporciona enormes cantidades de datos
• Google PageRank usa IA para rankear páginas web
• 1997: Deep Blue vence al campeón mundial de ajedrez

**🤖 2010s - Deep Learning y Big Data**
• Redes neuronales "profundas" con muchas capas
• 2012: ImageNet revoluciona el reconocimiento de imágenes
• Siri (2011), Alexa (2014) - asistentes virtuales
• AlphaGo vence al campeón mundial de Go (2016)

**🌟 2020s - IA Generativa**
• ChatGPT (2022) - conversaciones naturales
• DALL-E, Midjourney - generación de imágenes
• GitHub Copilot - programación asistida
• IA en todos los aspectos de la vida diaria`,
      type: 'presentation'
    },
    {
      id: 3,
      question: '¿Cuál es la meta final de la investigación de la inteligencia artificial?',
      answer: `**Respuesta básica:**
La meta final es crear una Inteligencia Artificial General (AGI) que pueda igualar o superar la inteligencia humana.

**Para los curiosos - Los diferentes niveles de IA:**

**🎯 Inteligencia Artificial Estrecha (ANI)**
• Lo que tenemos HOY
• IA especializada en tareas específicas
• Ejemplos: Siri, calculadoras, autos autónomos
• Muy buena en UNA cosa, pero no puede hacer otras

**🧠 Inteligencia Artificial General (AGI)**
• La META PRINCIPAL de la investigación
• IA que puede hacer CUALQUIER tarea intelectual humana
• Características:
  - Aprender cualquier habilidad nueva
  - Razonar sobre problemas diversos
  - Transferir conocimiento entre dominios
  - Creatividad y pensamiento abstracto
• Estimaciones: podría lograrse entre 2030-2070

**🚀 Superinteligencia Artificial (ASI)**
• Hipotética IA que SUPERA la inteligencia humana
• Capacidades que los humanos ni siquiera podemos imaginar
• Podría resolver problemas como el cambio climático, enfermedades
• También presenta riesgos existenciales para la humanidad

**🤔 ¿Por qué es importante?**
• Podría revolucionar medicina, educación, ciencia
• Automatizar trabajo intelectual y físico
• Ayudar a resolver problemas globales complejos
• Pero también presenta desafíos éticos y sociales`,
      type: 'text'
    },
    {
      id: 4,
      question: '¿Qué es un androide?',
      answer: `**Respuesta básica:**
Un androide es un robot con apariencia y comportamiento humanoides, diseñado para parecer y actuar como un ser humano.

**Para los curiosos - Explorando la robótica humanoide:**

**📖 Origen del término:**
• Viene del griego "andro" (hombre) + "eidos" (forma)
• Popularizado por la ciencia ficción
• Diferente de "robot" (palabra checa que significa "trabajo")

**🤖 Características de un androide:**
• **Apariencia**: Cara, brazos, piernas como humanos
• **Movimiento**: Camina, gesticula, expresiones faciales
• **Interacción**: Habla, reconoce voces y caras
• **Materiales**: Piel sintética, músculos artificiales
• **Sensores**: Vista, oído, tacto simulados

**🔬 Ejemplos reales actuales:**
• **Sophia** (Hanson Robotics): Robot ciudadana de Arabia Saudita
• **ASIMO** (Honda): Camina, sube escaleras, reconoce personas
• **Pepper** (SoftBank): Robot emocional para atención al cliente
• **Atlas** (Boston Dynamics): Robot atlético que hace parkour

**🎭 Androides vs. otros robots:**
• **Robot industrial**: Brazos mecánicos en fábricas
• **Drone**: Robot volador
• **Roomba**: Robot aspiradora
• **Androide**: Específicamente con forma humana

**🚀 El futuro de los androides:**
• Compañeros para personas mayores
• Trabajadores en servicios peligrosos
• Asistentes personales físicos
• Exploración espacial (Marte, Luna)

**🤖 Valle inquietante:**
• Fenómeno psicológico: robots muy parecidos a humanos nos dan "miedo"
• Desafío: hacer androides que no sean "espeluznantes"`,
      type: 'text'
    },
    {
      id: 5,
      question: 'Respecto al campo de la inteligencia artificial, definir los siguientes términos: Inteligencia general, Inteligencia social, Creatividad, Aprendizaje, Moción, Planificación, Percepción, Heurística, Reconocimiento de patrones, Red neuronal, Procesamiento de lenguaje natural, Ingeniería de inteligencia',
      answer: `**Definiciones básicas:**

**🧠 Inteligencia general:** Capacidad de una IA para realizar cualquier tarea intelectual humana
**👥 Inteligencia social:** Habilidad para interactuar y comunicarse efectivamente con humanos
**🎨 Creatividad:** Capacidad de generar ideas, soluciones o contenido original y útil
**📚 Aprendizaje:** Proceso por el cual una IA mejora su rendimiento basándose en la experiencia
**🏃 Moción:** Capacidad de movimiento y control físico en robots
**📋 Planificación:** Habilidad para crear secuencias de acciones para alcanzar objetivos
**👁️ Percepción:** Capacidad de interpretar información sensorial del entorno
**🔍 Heurística:** Métodos de resolución de problemas basados en experiencia práctica
**🔢 Reconocimiento de patrones:** Identificación de regularidades en datos
**⚡ Red neuronal:** Modelo computacional inspirado en el cerebro humano
**💬 Procesamiento de lenguaje natural:** Capacidad de entender y generar lenguaje humano
**⚙️ Ingeniería de inteligencia:** Diseño y construcción de sistemas inteligentes

**Para los curiosos - Explicaciones detalladas:**

**🧠 Inteligencia General (AGI):**
• Diferente de IA estrecha (especializada)
• Puede transferir aprendizaje entre tareas diferentes
• Ejemplo: Un sistema que puede jugar ajedrez Y conducir un auto Y escribir poesía
• Aún no existe, es la meta principal de la IA

**👥 Inteligencia Social:**
• Entender emociones humanas y contexto social
• Saber cuándo hablar formalmente vs. casualmente  
• Ejemplo: Alexa que detecta si estás triste y ajusta sus respuestas
• Incluye lenguaje corporal, sarcasmo, humor

**🎨 Creatividad en IA:**
• No es "imaginación" como humanos, sino combinación de patrones
• DALL-E crea imágenes nunca vistas antes
• ChatGPT escribe poemas únicos
• Debate: ¿Es verdadera creatividad o imitación sofisticada?

**📚 Aprendizaje Automático (Machine Learning):**
• **Supervisado**: Aprende con ejemplos etiquetados (foto = "gato")
• **No supervisado**: Encuentra patrones sin etiquetas  
• **Por refuerzo**: Aprende por prueba y error (como videojuegos)
• **Deep Learning**: Redes neuronales "profundas" con muchas capas

**🏃 Moción (Robótica):**
• Control de motores, servos, actuadores
• Caminado bípedo (dos piernas) es extremadamente difícil
• Balance dinámico y corrección en tiempo real
• Boston Dynamics: robots que hacen parkour y bailan

**📋 Planificación:**
• GPS calcula la mejor ruta considerando tráfico
• Juegos de estrategia (ajedrez, Go) planifican jugadas futuras
• Robots industriales planifican movimientos para ensamblar autos
• Incluye manejo de recursos y tiempo

**👁️ Percepción:**
• **Visión por computadora**: Analizar imágenes y videos
• **Procesamiento de audio**: Reconocer voces, música, ruidos
• **Sensores**: Tacto, temperatura, presión, químicos
• **Fusión sensorial**: Combinar múltiples sentidos como humanos

**🔍 Heurística:**
• "Atajos mentales" para resolver problemas rápidamente
• No garantiza la solución perfecta, pero es eficiente
• Ejemplo: "En un laberinto, siempre gira a la derecha"
• GPS usa heurísticas para encontrar rutas rápido

**🔢 Reconocimiento de Patrones:**
• Base de casi toda IA moderna
• Spam vs. email legítimo: patrones en palabras
• Diagnóstico médico: patrones en síntomas
• Recomendaciones: patrones en comportamiento de usuarios
• Fraude bancario: patrones inusuales en transacciones

**⚡ Redes Neuronales:**
• Inspiradas en neuronas del cerebro (pero muy simplificadas)
• Múltiples capas de "neuronas artificiales" conectadas
• Cada conexión tiene un "peso" que se ajusta durante el aprendizaje
• **Deep Learning** = redes neuronales muy profundas (100+ capas)
• Ejemplos: GPT, BERT, ResNet, Transformer

**💬 Procesamiento de Lenguaje Natural (NLP):**
• **Entender**: ¿Qué significa esta oración?
• **Generar**: Escribir texto coherente y relevante
• **Traducir**: Entre diferentes idiomas
• **Resumir**: Textos largos en puntos clave
• **Sentiment Analysis**: ¿Este comentario es positivo o negativo?
• Desafíos: Sarcasmo, contexto, ambigüedad

**⚙️ Ingeniería de Inteligencia:**
• Combina ciencias de computación, matemáticas, psicología
• Diseño de algoritmos, arquitecturas, interfaces
• Consideraciones éticas y de seguridad
• Testing y validación de sistemas IA
• Optimización para hardware específico (CPUs, GPUs, TPUs)`,
      type: 'list'
    },
    {
      id: 6,
      question: 'Dar 3 ejemplos reales de cómo se usa la inteligencia artificial para ayudar a la sociedad.',
      answer: `**Respuestas básicas:**
1. **Medicina**: Diagnóstico asistido por IA para detectar cáncer
2. **Transporte**: Vehículos autónomos que reducen accidentes  
3. **Educación**: Sistemas de tutoría personalizada

**Para los curiosos - Casos de uso detallados:**

**🏥 1. MEDICINA - Salvando vidas con precisión**
• **Detección de cáncer**: 
  - Google's DeepMind detecta cáncer de mama con 94.5% precisión
  - IBM Watson analiza tomografías para cáncer de pulmón
  - Detecta tumores que médicos humanos podrían pasar por alto
• **Diagnóstico oftalmológico**:
  - IA detecta retinopatía diabética (principal causa de ceguera)
  - Analiza fotos del ojo en segundos
  - Usado en países con pocos especialistas
• **Descubrimiento de medicamentos**:
  - DeepMind's AlphaFold predice estructura de proteínas
  - Acelera desarrollo de nuevos medicamentos de 10+ años a 2-3 años
  - Ayudó a entender COVID-19 más rápidamente

**🚗 2. TRANSPORTE - Carreteras más seguras**
• **Vehículos autónomos**:
  - Tesla Autopilot ha evitado miles de accidentes
  - Waymo (Google) opera taxis sin conductor en Phoenix
  - Reaccionan más rápido que humanos (milisegundos vs. segundos)
• **Gestión de tráfico**:
  - Semáforos inteligentes que se adaptan al flujo de tráfico
  - Reducen tiempo de espera hasta 40%
  - Apps como Waze predicen tráfico en tiempo real
• **Seguridad aérea**:
  - IA analiza patrones de vuelo para prevenir colisiones
  - Optimiza rutas de vuelo para ahorrar combustible
  - Detecta problemas mecánicos antes de que fallen

**🎓 3. EDUCACIÓN - Aprendizaje personalizado**
• **Tutores virtuales**:
  - Khan Academy usa IA para personalizar ejercicios
  - Duolingo adapta lecciones a tu ritmo de aprendizaje
  - Platzi personaliza rutas de aprendizaje en tecnología
  - Carnegie Learning mejora resultados en matemáticas 38%
• **Accesibilidad**:
  - Transcripción automática para estudiantes sordos
  - Lectura de texto para estudiantes ciegos
  - Traducción en tiempo real para estudiantes internacionales
• **Detección temprana de problemas**:
  - Identifica estudiantes en riesgo de deserción escolar
  - Sugiere intervenciones personalizadas
  - Ayuda a profesores a enfocar su atención

**🌍 Ejemplos adicionales increíbles:**
• **Agricultura**: Drones con IA detectan plagas y optimizan riego
• **Conservación**: IA cuenta animales en peligro de extinción
• **Desastres naturales**: Predice terremotos y tsunamis
• **Energía**: Optimiza redes eléctricas y energías renovables
• **Traducción**: Google Translate conecta personas que hablan diferentes idiomas

**🌎 Casos específicos de América Latina:**
• **Brasil**: IA detecta deforestación del Amazonas en tiempo real
• **Colombia**: Bancolombia usa IA para prevenir fraude financiero  
• **México**: IA optimiza cultivos de aguacate y maíz para exportación
• **Argentina**: Sistemas de IA mejoran diagnósticos en hospitales públicos
• **Chile**: IA predice actividad sísmica en la cordillera de Los Andes`,
      type: 'list'
    },
    {
      id: 7,
      question: '¿Cuáles son algunas de las limitaciones de la inteligencia artificial? Explicar por lo menos 3 de ellas.',
      answer: `**Limitaciones básicas:**
1. **Falta de comprensión contextual**: No entiende verdaderamente el significado
2. **Dependencia de datos**: Necesita enormes cantidades de información
3. **Sesgo algorítmico**: Perpetúa prejuicios de los datos de entrenamiento

**Para los curiosos - Limitaciones profundas:**

**🧠 1. FALTA DE COMPRENSIÓN REAL**
• **No entiende, solo imita**:
  - ChatGPT puede escribir sobre amor, pero nunca lo ha sentido
  - IA puede describir el color azul, pero no sabe cómo se "ve"
  - Procesa patrones en texto, no comprende significado real
• **Sin sentido común**:
  - "El vaso está lleno de agua sólida" - IA no sabe que es hielo
  - No entiende que no puedes caminar a través de paredes
  - Falta intuición básica sobre el mundo físico

**📊 2. DEPENDENCIA EXTREMA DE DATOS**
• **Necesita millones de ejemplos**:
  - Un niño aprende "gato" con 10 ejemplos, IA necesita 100,000+
  - GPT-3 entrenado con 45TB de texto (toda Wikipedia = 20GB)
  - Sin datos suficientes, performance colapsa completamente
• **Datos sesgados = IA sesgada**:
  - Si entrenas solo con fotos de hombres blancos, no reconoce mujeres/otras razas
  - IA de Amazon para contratar favorecía hombres (datos históricos sesgados)
  - Sistemas de justicia criminal muestran sesgo racial

**⚖️ 3. SESGO Y DISCRIMINACIÓN**
• **Perpetúa inequidades sociales**:
  - Algoritmos de préstamos bancarios discriminan minorías
  - Reconocimiento facial funciona peor en personas de piel oscura
  - Búsquedas de empleo muestran trabajos mejor pagados a hombres
• **Imposible eliminar completamente**:
  - Los datos reflejan sesgos históricos de la sociedad
  - Programadores humanos también tienen sesgos inconscientes
  - "Sesgo del sesgo": intentar corregir puede crear nuevos problemas

**🤖 4. LIMITACIONES ADICIONALES IMPORTANTES**

**Falta de creatividad genuina**:
• Solo recombina patrones existentes
• No puede tener ideas verdaderamente revolucionarias
• "Creatividad" es estadística, no inspiración

**No puede explicarse**:
• "Caja negra": sabemos input y output, no el proceso interno
• Diagnósticos médicos sin explicación son peligrosos
• Imposible auditar decisiones importantes

**Frágil ante cambios**:
• IA entrenada en fotos diurnas falla de noche
• Sistema de 2019 no funciona bien con datos de 2024
• Pequeños cambios pueden causar fallas catastróficas

**Consumo energético masivo**:
• Entrenar GPT-3 consumió electricidad equivalente a 120 hogares por un año
• Centros de datos de IA generan tanto CO2 como la industria aérea
• No es sostenible escalar indefinidamente

**Falta de sentimientos y emociones**:
• No puede genuinamente preocuparse por humanos
• Simula empatía, pero no la siente
• Decisiones puramente lógicas pueden ser éticamente problemáticas`,
      type: 'list'
    },
    {
      id: 8,
      question: '¿Cuáles son algunas habilidades básicas humanas que la inteligencia artificial no puede exhibir?',
      answer: `**Respuesta básica:**
Empatía genuina, intuición emocional, conciencia moral innata, creatividad original, comprensión del sentido común, experiencias espirituales, amor incondicional y sabiduría de vida.

**Para los curiosos - Lo que nos hace únicamente humanos:**

**❤️ EMOCIONES Y CONEXIONES GENUINAS**

**Empatía real**:
• Los humanos SIENTEN el dolor ajeno, IA solo lo simula
• Podemos ponernos en los zapatos de otros sin programación
• Nuestras lágrimas al ver sufrimiento son auténticas
• IA puede identificar tristeza en una cara, pero no la experimenta

**Amor incondicional**:
• Padres aman a hijos sin condiciones lógicas
• Amistad que trasciende beneficios mutuos
• Compasión por extraños sin expectativas de recompensa
• IA siempre opera bajo parámetros programados

**🧠 INTUICIÓN Y SABIDURÍA**

**Intuición**:
• "Presentimientos" que resultan correctos sin análisis
• Madres que "sienten" cuando algo está mal con sus hijos
• Artistas que "saben" cuándo una obra está completa
• IA solo opera con datos concretos, no "corazonadas"

**Sentido común**:
• Sabemos instintivamente que no debes tocar una estufa caliente
• Entendemos automáticamente que la gente se moja bajo la lluvia
• IA necesita que le enseñen cada detalle obvio
• 2 años de edad > IA más avanzada en sentido común básico

**🎨 CREATIVIDAD VERDADERAMENTE ORIGINAL**

**Innovación revolucionaria**:
• Einstein imaginó la relatividad sin datos previos
• Van Gogh creó un estilo nunca visto antes
• IA solo recombina patrones existentes de manera sofisticada
• Humanos pueden conceptualizar lo que nunca ha existido

**Inspiración espontánea**:
• Ideas que surgen de la nada (eureka moments)
• Sueños que resuelven problemas complejos
• Conexiones inesperadas entre conceptos aparentemente no relacionados
• IA es determinística, humanos somos inspirados

**🙏 DIMENSIÓN ESPIRITUAL Y MORAL**

**Conciencia moral innata**:
• Niños pequeños ya distinguen bien y mal sin enseñanza
• Remordimiento genuino tras hacer algo malo
• Sacrificio personal por principios morales
• IA solo sigue reglas programadas, no tiene "conciencia"

**Experiencias espirituales**:
• Sensación de trascendencia y conexión con lo divino
• Oración, meditación, contemplación
• Fe que va más allá de evidencia empírica
• IA no puede tener experiencias místicas o religiosas

**🌟 EXPERIENCIAS SUBJETIVAS ÚNICAS**

**Conciencia de sí mismo**:
• Sabemos que existimos y que somos únicos
• Experiencia subjetiva del color rojo, sabor dulce, dolor físico
• IA procesa información sobre "rojo", pero no "experimenta" rojez
• Cada humano tiene una perspectiva única del mundo

**Crecimiento através del sufrimiento**:
• Aprendemos más de nuestros fracasos que éxitos
• Dolor emocional nos hace más compasivos
• Pérdidas nos enseñan a valorar lo que tenemos
• IA optimiza para evitar errores, no crece através de ellos

**💭 CAPACIDADES COGNITIVAS ESPECIALES**

**Aprendizaje con pocos ejemplos**:
• Un bebé aprende "mamá" tras pocas repeticiones
• Entendemos conceptos nuevos con explicaciones mínimas
• Generalizamos de experiencias limitadas
• IA necesita millones de ejemplos para patrones simples

**Multitarea cognitiva natural**:
• Podemos escuchar música, caminar, y planear el futuro simultáneamente
• Procesamos múltiples niveles de información inconscientemente
• Mantenemos conversaciones mientras realizamos tareas complejas
• IA especializada excede humanos en UNA tarea, pero no en versatilidad

**🔮 CAPACIDAD DE IMAGINAR FUTUROS**

**Esperanza y aspiraciones**:
• Soñamos con futuros que nunca hemos visto
• Motivación por metas abstractas (justicia, belleza, verdad)
• Capacidad de luchar por ideales impossibles
• IA optimiza para objetivos definidos, no sueña con lo imposible

**Narrativa personal**:
• Creamos historias coherentes sobre nuestras vidas
• Encontramos significado en experiencias aleatorias
• Reinterpretamos el pasado según nuestro crecimiento
• IA procesa eventos como datos independientes, no como historia personal

**En resumen**: Los humanos somos más que la suma de nuestros patrones. Tenemos alma, conciencia, y una chispa divina que la tecnología puede imitar pero nunca replicar verdaderamente.`,
      type: 'text'
    },
    {
      id: 9,
      question: 'Dar una definición básica de un sistema experto.',
      answer: `**Respuesta básica:**
Un sistema experto es un programa de computadora que imita la capacidad de toma de decisiones de un experto humano en un dominio específico.

**Para los curiosos - Desglosando los sistemas expertos:**

**🧠 ¿Qué es exactamente un "sistema experto"?**
• Programa que resuelve problemas como lo haría un especialista humano
• Se enfoca en UN dominio específico (medicina, ingeniería, finanzas)
• Toma decisiones basadas en reglas y conocimiento programado
• Fue una de las primeras aplicaciones exitosas de IA (1970s)

**⚙️ COMPONENTES PRINCIPALES**

**1. Base de conocimientos**:
• Información y reglas del experto humano
• "SI tienes fiebre Y dolor de garganta, ENTONCES considera infección"
• Hechos, reglas, casos históricos
• Creada entrevistando expertos reales

**2. Motor de inferencia**:
• El "cerebro" que procesa las reglas
• Decide qué preguntas hacer al usuario
• Aplica lógica para llegar a conclusiones
• Explica cómo llegó a la respuesta

**3. Interfaz de usuario**:
• Permite comunicación entre humano y sistema
• Hace preguntas en lenguaje natural
• Muestra resultados y explicaciones
• Fácil de usar para no-técnicos

**🔍 ¿CÓMO FUNCIONA?**

**Proceso típico**:
1. Usuario describe el problema
2. Sistema hace preguntas específicas
3. Aplica reglas basadas en respuestas
4. Llega a diagnóstico/recomendación
5. Explica el razonamiento usado

**Ejemplo simple - Diagnóstico de auto**:
• Sistema: "¿El auto enciende?"
• Usuario: "No"
• Sistema: "¿Hay luces en el tablero?"
• Usuario: "No" 
• Sistema: "Problema probable: batería muerta" (98% certeza)

**🏆 VENTAJAS SOBRE IA MODERNA**

**Explicabilidad**:
• Puede explicar exactamente por qué tomó una decisión
• "Recomendé antibióticos porque: fiebre > 38°C + dolor garganta + ganglios inflamados"
• Crítico en medicina, legal, finanzas

**Confiabilidad**:
• Siempre aplica las mismas reglas consistentemente
• No tiene "días malos" como humanos
• Decisiones basadas en lógica, no emociones

**🤖 vs 🧠 SISTEMAS EXPERTOS vs IA MODERNA**

**Sistemas Expertos (1970s-1990s)**:
✅ Explicables, confiables, precisos en dominio estrecho
❌ Rígidos, requieren programación manual de reglas

**IA Moderna (Machine Learning)**:
✅ Aprende automáticamente, maneja datos masivos, más flexible
❌ "Caja negra", difícil explicar decisiones

**🎯 EJEMPLOS MODERNOS**

**TurboTax**:
• Te hace preguntas sobre tu situación fiscal
• Aplica reglas del código tributario
• Recomienda deducciones apropiadas
• Explica por qué puedes aplicar cierta deducción

**Sistemas de configuración**:
• Dell usa sistemas expertos para configurar computadoras
• "Si necesitas gaming, ENTONCES requieres GPU potente"
• Asegura compatibilidad entre componentes

**Diagnóstico industrial**:
• GE usa sistemas expertos para diagnosticar motores de avión
• Analiza síntomas (ruido, vibración, temperatura)
• Recomienda mantenimiento preventivo específico`,
      type: 'text'
    },
    {
      id: 10,
      question: '¿Cuáles son algunas de las ventajas de un sistema experto?',
      answer: `**Respuesta básica:**
Disponibilidad 24/7, consistencia en decisiones, preservación del conocimiento experto, manejo de grandes cantidades de información, reducción de costos y acceso a expertise en áreas remotas.

**Para los curiosos - Ventajas detalladas:**

**⏰ DISPONIBILIDAD Y ACCESIBILIDAD**

**Disponible 24/7/365**:
• No necesita descanso, vacaciones, o días de enfermedad
• Especialmente valioso en emergencias médicas nocturnas
• Consultas instantáneas sin citas
• No tiene límites de tiempo por consulta

**Acceso remoto**:
• Expertos virtuales en zonas rurales sin especialistas
• Telemedicina en áreas con pocos doctores
• Consultoría técnica sin viajes costosos
• Democratización del conocimiento especializado

**⚖️ CONSISTENCIA Y CONFIABILIDAD**

**Decisiones consistentes**:
• Aplica las mismas reglas siempre, sin excepciones emocionales
• No tiene "días malos" que afecten juicio
• Libre de prejuicios personales o cansancio
• Misma calidad de servicio para todos los usuarios

**Memoria perfecta**:
• Nunca "olvida" información importante
• Recuerda todos los casos previos
• Acceso instantáneo a base de conocimientos completa
• No comete errores por lapsos de memoria

**💰 EFICIENCIA ECONÓMICA**

**Reducción de costos**:
• Una vez desarrollado, costo marginal casi cero
• Reemplaza múltiples consultas costosas con expertos
• Reduce errores costosos por diagnósticos incorrectos
• Automatiza procesos que requieren expertise caro

**Escalabilidad**:
• Un sistema puede atender miles de usuarios simultáneamente
• Costo por consulta disminuye con más usuarios
• No requiere contratar más expertos para más demanda
• Deployment instantáneo en múltiples ubicaciones

**📚 PRESERVACIÓN Y TRANSFERENCIA DE CONOCIMIENTO**

**Captura expertise**:
• Preserva conocimiento de expertos que se jubilan
• Evita pérdida de conocimiento institucional crítico
• Documenta procesos de toma de decisiones complejos
• Facilita transferencia de conocimiento entre generaciones

**Entrenamiento**:
• Entrena novatos mostrando razonamiento experto
• Educación interactiva con casos reales
• Permite practicar sin consecuencias costosas
• Estandariza procesos de capacitación

**🔍 CAPACIDADES ANALÍTICAS SUPERIORES**

**Procesamiento de información masiva**:
• Considera simultáneamente cientos de variables
• No se abruma con información compleja
• Identifica patrones que humanos podrían pasar por alto
• Procesa actualizaciones de conocimiento constantemente

**Análisis exhaustivo**:
• Considera TODAS las posibilidades, no solo las obvias
• No se deja llevar por primeras impresiones
• Evaluación sistemática de todas las opciones
• Reduce diagnósticos o decisiones por "corazonada"

**⚡ VELOCIDAD Y PRECISIÓN**

**Respuestas instantáneas**:
• Segundos vs. horas/días para consulta humana
• Crítico en situaciones de emergencia
• Permite iteración rápida de soluciones
• Acelera procesos de toma de decisiones

**Precisión elevada**:
• Elimina errores por transcripción manual
• Aplica cálculos complejos sin errores aritméticos
• Considera todas las reglas relevantes sin omisiones
• Reduce variabilidad en resultados

**🌍 IMPACTO SOCIAL Y DEMOCRATIZACIÓN**

**Acceso equitativo**:
• Mismo nivel de expertise para ricos y pobres
• No discrimina por raza, género, o status social
• Disponible en múltiples idiomas
• Reduce disparidades en acceso a conocimiento especializado

**Educación masiva**:
• Permite que cualquiera aprenda de expertos mundiales
• Educación médica/técnica en países en desarrollo
• Transferencia de mejores prácticas globalmente
• Acelera desarrollo de capacidades locales

**🤖 EJEMPLOS DE VENTAJAS EN ACCIÓN**

**Medicina rural**:
• Sistema experto en clínica rural diagnostica correctamente 95% casos
• Antes: paciente viajaba 6 horas a ciudad para ver especialista
• Ahora: diagnóstico inmediato + tratamiento local cuando apropiado

**Mantenimiento industrial**:
• Planta química usa sistema experto para mantenimiento predictivo
• Reduce paradas no planificadas 60%
• Ahorra $2M anuales en producción perdida
• Mejora seguridad al prevenir fallas catastróficas

**Educación legal**:
• Estudiantes de derecho practican con sistemas expertos
• Aprenden razonamiento legal sin costo de abogados senior
• Casos prácticos ilimitados para práctica
• Preparación más efectiva para casos reales`,
      type: 'text'
    },
    {
      id: 11,
      question: 'Dar un ejemplo real de cómo se usa un sistema experto en la sociedad.',
      answer: `**Respuesta básica:**
MYCIN: Sistema experto médico desarrollado en Stanford (años 70) que diagnostica infecciones bacterianas y recomienda tratamientos antibióticos con efectividad comparable a médicos especialistas.

**Para los curiosos - Casos de estudio detallados:**

**🏥 MYCIN - El pionero médico**

**¿Qué hacía MYCIN?**
• Diagnosticaba infecciones de la sangre (bacteremia) y meningitis
• Recomendaba antibióticos específicos y dosis
• Consideraba factores del paciente (edad, peso, alergias, otros medicamentos)
• Explicaba su razonamiento paso a paso

**¿Por qué fue revolucionario?**
• Primera IA que rivalizó con expertos humanos en medicina
• Blind studies mostraron que MYCIN era TAN bueno como infectólogos
• A veces mejor que médicos generales en casos complejos
• Estableció el template para sistemas expertos médicos

**Impacto histórico**:
• Demostró que IA podía salvar vidas reales
• Inspiró desarrollo de cientos de sistemas expertos médicos
• Mostró importancia de "explicabilidad" en IA médica
• Sentó bases para sistemas de apoyo clínico modernos

**🔧 XCON/R1 - Revolución en manufactura**

**Digital Equipment Corporation (1980s)**:
• Configuraba computadoras VAX (sistemas complejos con miles de componentes)
• Aseguraba compatibilidad entre CPU, memoria, discos, software
• Optimizaba configuraciones para necesidades específicas del cliente
• Generaba instrucciones de ensamblaje para técnicos

**Resultados impresionantes**:
• Redujo tiempo de configuración de semanas a minutos
• Eliminó 95% de errores en configuraciones complejas
• Ahorró $40 millones anuales a DEC
• Permitió personalización masiva de computadoras

**💼 SISTEMAS EXPERTOS MODERNOS EN USO**

**🏦 1. FINANZAS - Detección de fraude**

**American Express**:
• Analiza patrones de compra en tiempo real
• "SI compra gasolina en México Y 2 horas después compra en Nueva York, ENTONCES posible fraude"
• Considera 100+ variables: ubicación, monto, tipo tienda, historial
• Bloquea tarjeta automáticamente si detecta patrón sospechoso

**Impacto**:
• Reduce fraude 60% vs. sistemas previos
• Bloquea transacciones fraudulentas en segundos
• Ahorra millones en pérdidas por fraude
• Mejor experiencia cliente (menos falsos positivos)

**🚗 2. AUTOMOTRIZ - Diagnóstico de vehículos**

**Ford's EEC-V Engine Control**:
• Diagnostica problemas de motor usando sensores
• "SI presión aceite baja Y temperatura alta Y ruido anormal, ENTONCES problema bomba aceite"
• Recomienda reparaciones específicas y urgencia
• Predice fallas antes que ocurran

**Beneficios**:
• Reduce tiempo diagnóstico de horas a minutos
• Mecánicos menos experimentados pueden diagnosticar problemas complejos
• Mantenimiento predictivo previene averías costosas
• Mejora confiabilidad y seguridad vehicular

**⚖️ 3. LEGAL - Análisis contractual**

**Sistemas de revisión legal**:
• Analizan contratos para identificar cláusulas problemáticas
• "SI contrato incluye cláusula X sin protección Y, ENTONCES alto riesgo"
• Sugieren modificaciones basadas en precedentes legales
• Estiman probabilidades de éxito en litigios

**Ventajas**:
• Abogados junior pueden manejar casos más complejos
• Revisión exhaustiva de contratos en fracción del tiempo
• Identifica riesgos que experiencia humana podría pasar por alto
• Democratiza acceso a expertise legal costosa

**🏭 4. MANUFACTURA - Control de calidad**

**Boeing - Inspección de aeronaves**:
• Sistema experto analiza defectos en fuselajes
• Considera ubicación, tamaño, tipo de defecto, historial de la pieza
• Determina si defecto es crítico, reparable, o aceptable
• Recomienda procedimientos específicos de reparación

**Resultados**:
• Mejora consistencia en inspecciones de seguridad
• Reduce subjetividad en decisiones críticas de seguridad
• Entrena inspectores novatos con conocimiento de expertos senior
• Mantiene estándares de seguridad aérea altísimos

**🌾 5. AGRICULTURA - Manejo de cultivos**

**PLANT/ds - Sistema experto agrícola**:
• Diagnostica enfermedades de plantas basado en síntomas
• Considera clima, tipo suelo, historial del campo
• Recomienda tratamientos específicos y timing óptimo
• Predice rendimientos basado en condiciones actuales

**Impacto en agricultura**:
• Pequeños agricultores acceden a expertise de agrónomos
• Reduce uso innecesario de pesticidas (mejor para ambiente)
• Aumenta rendimientos 15-25% con mejor timing
• Preserva conocimiento tradicional + ciencia moderna

**🎯 POR QUÉ ESTOS SISTEMAS SIGUEN SIENDO RELEVANTES**

**En era de Machine Learning**:
• Algunos dominios requieren explicaciones claras (medicina, legal)
• Regulaciones requieren transparencia en decisiones
• Conocimiento experto es limitado y costoso de recolectar
• Combinación: ML para patrones + sistemas expertos para reglas

**Evolución moderna**:
• Sistemas híbridos combinan reglas expertas + aprendizaje automático
• Watson de IBM combina ambos enfoques
• Chatbots usan sistemas expertos para conversaciones estructuradas
• Robótica usa sistemas expertos para toma de decisiones en tiempo real`,
      type: 'text'
    },
    {
      id: 12,
      question: 'Individualmente o en un grupo, discutir la importancia de la inteligencia artificial y su papel en la sociedad. Preparar y dar una presentación oral.',
      answer: `**Guía básica para presentación:**
Cubrir beneficios (automatización, eficiencia), desafíos (desempleo, privacidad, ética), y futuro de la IA en sectores como salud, educación, transporte y medio ambiente.

**Para los curiosos - Estructura completa de presentación:**

**🎯 ESTRUCTURA SUGERIDA (20-30 minutos)**

**INTRODUCCIÓN (5 min)**
• Hook: "¿Sabían que ya usaron IA 10+ veces hoy?"
• Definición simple de IA con ejemplos familiares
• Tesis: "IA transformará sociedad más que internet o electricidad"
• Preview de puntos principales

**📊 PARTE 1: TRANSFORMACIÓN ACTUAL (8-10 min)**

**🏥 Revolución en Salud**:
• DeepMind detecta 50+ enfermedades oculares
• IA diagnostica COVID en rayos-X más rápido que radiólogos
• Drug discovery: IA encontró tratamientos COVID en meses vs. años
• Prótesis controladas por mente usando IA

**🚗 Transporte del futuro**:
• Tesla Autopilot: 10x menos accidentes que conductores humanos
• Uber/Lyft optimizan rutas y precios con IA
• Aviones comerciales usan autopilot IA 99% del vuelo
• Drones de entrega revolutionan logística

**🎓 Educación personalizada**:
• Khan Academy personaliza aprendizaje para millones
• Duolingo adapta dificultad según progreso individual
• Platzi crea rutas personalizadas en tecnología y programación
• IA detecta estudiantes en riesgo de deserción
• Traducción instantánea elimina barreras idiomáticas

**💼 PARTE 2: BENEFICIOS TRANSFORMACIONALES (5-7 min)**

**Automatización inteligente**:
• Libera humanos de trabajo repetitivo/peligroso
• 24/7 availability sin fatiga o errores humanos
• Precisión sobrehumana en tareas específicas
• Escala infinita sin contratar más personal

**Democratización del conocimiento**:
• Expertise de clase mundial accesible para todos
• Países en desarrollo saltan etapas de desarrollo
• Educación de calidad sin importar ubicación geográfica
• Diagnósticos médicos en áreas remotas
• Platzi democratiza educación tech en América Latina
• IA elimina barreras geográficas para acceder a oportunidades globales

**Nuevas capacidades imposibles**:
• Análisis de patrones en datasets masivos
• Predicción de eventos complejos (clima, mercados)
• Personalización a escala (Netflix, Amazon)
• Simulaciones que aceleran investigación científica

**⚠️ PARTE 3: DESAFÍOS Y RIESGOS (8-10 min)**

**🏭 Disrupción del empleo**:
• McKinsey: 800M empleos automatizados para 2030
• Más vulnerable: trabajos rutinarios/predecibles
• Beneficia trabajadores altamente calificados
• Necesidad urgente de re-entrenamiento masivo
• **En América Latina**: Mayor impacto en manufactura y servicios básicos
• **Oportunidad**: Boom de empleos tech si nos preparamos ahora

**🕵️ Privacidad y vigilancia**:
• Reconocimiento facial ubiquo (China's social credit)
• Datos personales usados para manipulación (Cambridge Analytica)
• Algoritmos conocen mejor que nosotros mismos
• Balance entre conveniencia y privacidad

**⚖️ Sesgos y discriminación**:
• IA hereda prejuicios de datos históricos
• Sistemas de contratación discriminan mujeres/minorías
• Reconocimiento facial menos preciso en piel oscura
• Algoritmos de justicia criminal muestran sesgo racial

**🤖 Riesgos existenciales**:
• Superinteligencia podría ser incontrolable
• Sistemas autónomos de defensa (robot killers)
• Concentración de poder en pocas compañías tech
• Dependencia excesiva puede hacernos vulnerables

**🔮 PARTE 4: EL FUTURO QUE VIENE (5-7 min)**

**Próximos 5-10 años**:
• IA generativa en todas las industrias (texto, imágenes, video, código)
• Asistentes virtuales indistinguibles de humanos
• Autos completamente autónomos en ciudades
• Robots domésticos para cuidado de ancianos

**Próximos 10-30 años**:
• Inteligencia Artificial General (AGI)
• Revolución científica acelerada por IA
• Realidad virtual indistinguible de realidad
• Posible fusión humano-IA (brain-computer interfaces)

**🌟 CONCLUSIÓN: NUESTRO PAPEL (3-5 min)**

**Como individuos**:
• Educarse sobre IA para tomar decisiones informadas
• Desarrollar habilidades complementarias (creatividad, empatía)
• Ser críticos sobre información y algoritmos
• Participar en conversaciones sobre ética en IA

**Como sociedad**:
• Regular IA sin frenar innovación beneficiosa
• Asegurar distribución equitativa de beneficios
• Invertir en educación y re-entrenamiento
• Mantener valores humanos en centro de desarrollo tecnológico

**💡 TIPS PARA PRESENTACIÓN EXITOSA**

**Preparación**:
• Practica presentación 3+ veces antes del evento
• Prepara ejemplos locales/relevantes para tu audiencia
• Ten backup slides con más detalles por si hay preguntas
• Cronometra cada sección para no exceder tiempo

**Engagement**:
• Comienza con pregunta interactiva o demo en vivo
• Usa analogías simples para conceptos complejos
• Incluye videos cortos (1-2 min) para ilustrar puntos
• Haz preguntas retóricas para mantener atención

**Materiales visuales**:
• Máximo 20 slides para 20-30 min presentación
• Una idea principal por slide
• Imágenes > texto siempre
• Usa gráficos/charts para datos estadísticos

**Manejo de preguntas**:
• "Gran pregunta, déjame pensar..." (compra tiempo)
• "No sé la respuesta, pero investigaré y te respondo"
• Conecta preguntas de vuelta a tus puntos principales
• Limita preguntas a 5-10 min al final

**🎤 TEMAS DE DISCUSIÓN GRUPAL**

**Preguntas para debate**:
• ¿Deberían los robots tener derechos si alcanzan inteligencia humana?
• ¿Es ético usar IA para influenciar comportamiento humano?
• ¿Cómo balanceamos eficiencia de IA vs. empleos humanos?
• ¿Deberían existir límites en desarrollo de IA militar?
• ¿La IA hará a los humanos más perezosos o más creativos?

**Ejercicio grupal**:
• Dividir en equipos: pros vs. contras de IA en educación
• Cada equipo presenta 5 min, luego debate abierto
• Buscar soluciones que maximicen beneficios y minimicen riesgos
• Votar por propuestas más viables/éticas`,
      type: 'presentation'
    },
    {
      id: 13,
      question: 'Basado en sus observaciones de la pregunta anterior, visitar un lugar que ha utilizado el uso de la inteligencia artificial. Preparar y dar una presentación oral.',
      answer: `**Guía básica:**
Visitar lugares como hospitales, bancos, tiendas, o centros de datos que usen IA. Documentar implementación y resultados para presentación oral.

**Para los curiosos - Guía completa de visita de campo:**

**🎯 LUGARES IDEALES PARA VISITAR**

**🏥 HOSPITALES Y CLÍNICAS**
• **Qué buscar**: Sistemas de diagnóstico por imágenes, registros médicos electrónicos
• **Preguntas para personal médico**:
  - ¿Cómo usa IA el radiólogo para analizar rayos-X?
  - ¿Ha mejorado la precisión diagnóstica?
  - ¿Cuánto tiempo ahorra por paciente?
  - ¿Hay casos donde IA detectó algo que médicos pasaron por alto?

**🏪 TIENDAS Y SUPERMERCADOS**
• **Amazon Go/tiendas sin cajeros**: Cámaras + IA para checkout automático
• **Supermercados regulares**: Sistemas de inventario, recomendaciones de productos
• **Preguntas para gerentes**:
  - ¿Cómo decide qué productos promocionar?
  - ¿Usa IA para predecir demanda y evitar desperdicio?
  - ¿Cámaras detectan robos automáticamente?

**🏦 BANCOS**
• **Chatbots** para atención al cliente
• **Análisis de fraude** en tiempo real
• **Preguntas para ejecutivos bancarios**:
  - ¿Cuántas transacciones fraudulentas bloquean diariamente?
  - ¿Cómo entrenan el sistema para reducir falsos positivos?
  - ¿Chatbot puede resolver qué % de consultas sin humanos?

**🚗 CONCESIONARIOS DE AUTOS**
• **Sistemas de diagnóstico** en talleres de servicio
• **Configuradores online** para personalizar vehículos
• **Preguntas para técnicos**:
  - ¿Cómo ha cambiado el diagnóstico de problemas en 10 años?
  - ¿Pueden predecir fallas antes que ocurran?
  - ¿Autos modernos se diagnostican a sí mismos?

**🏭 FÁBRICAS/INDUSTRIAS**
• **Robots industriales** con IA
• **Control de calidad** automatizado
• **Mantenimiento predictivo**
• **Preguntas para ingenieros**:
  - ¿Qué porcentaje de producción es automatizada?
  - ¿Cómo ha cambiado el rol de trabajadores humanos?
  - ¿IA ha reducido desperdicios/defectos?

**📋 PREPARACIÓN PARA LA VISITA**

**Antes de ir**:
• Contacta con anticipación y explica tu proyecto educativo
• Prepara lista de preguntas específicas (mínimo 10)
• Investiga sobre la empresa/organización previamente
• Lleva cuaderno, cámara (con permiso), grabadora de audio

**Durante la visita (2-3 horas)**:
• Observa procesos en funcionamiento
• Toma fotos/videos (con permiso) de sistemas en acción
• Entrevista a mínimo 2-3 empleados diferentes
• Pregunta por métricas específicas (tiempo ahorrado, precisión mejorada, costos reducidos)
• Solicita demos/demostraciones si es posible

**Preguntas universales que siempre hacer**:
1. ¿Cuándo implementaron IA y por qué?
2. ¿Cuáles fueron los principales desafíos de implementación?
3. ¿Cómo miden el éxito de los sistemas de IA?
4. ¿Qué empleados fueron reentrenados vs. reemplazados?
5. ¿Planean expandir uso de IA en el futuro?

**🎤 ESTRUCTURA DE PRESENTACIÓN POST-VISITA**

**INTRODUCCIÓN (3 min)**
• Lugar visitado y por qué lo escogieron
• Primera impresión al llegar
• Overview de lo que descubrieron

**OBSERVACIONES TÉCNICAS (8-10 min)**
• **Sistemas de IA específicos** que vieron en funcionamiento
• **Cómo funcionan** (explicado en términos simples)
• **Datos/métricas** que obtuvieron (precisión, velocidad, ahorro)
• **Demostración práctica** si pudieron grabar/documentar

**IMPACTO HUMANO (5-7 min)**
• **Empleados entrevistados**: roles, experiencias, opiniones
• **Cambios en trabajo diario** desde implementación de IA
• **Beneficios**: qué les hace la vida más fácil
• **Desafíos**: qué aspectos son difíciles o preocupantes
• **Capacitación**: cómo aprendieron a trabajar con IA

**ANÁLISIS CRÍTICO (5 min)**
• **Ventajas observadas** vs. lo que leyeron en teoría
• **Limitaciones reales** que no esperaban
• **Sorpresas positivas** o negativas
• **Comparación** con otros ejemplos de IA que conocen

**REFLEXIÓN PERSONAL (3-5 min)**
• ¿Cambió su perspectiva sobre IA después de la visita?
• ¿Qué les impresionó más?
• ¿Qué aplicaciones de IA quisieran ver en su comunidad?
• ¿Cómo se imaginan trabajando con IA en el futuro?

**🎯 EJEMPLOS DE HALLAZGOS INTERESANTES**

**Hospital visitado**:
• "Radiólogo usa IA que analiza 1000 imágenes/día, detectó 3 tumores pequeños que habrían sido perdidos"
• "Ahorra 45 min por paciente en diagnósticos complejos"
• "Pero siempre confirma diagnosis con segundo doctor humano"

**Tienda visitada**:
• "Amazon Go usa 1000+ cámaras + sensores de peso para tracking"
• "Funciona 95% del tiempo, pero lluvia intensa confunde las cámaras"
• "Empleados humanos se enfocan ahora en customer service vs. checkout"

**💡 TIPS PARA PRESENTACIÓN EXITOSA**

**Elementos visuales esenciales**:
• Fotos del lugar y sistemas en funcionamiento
• Diagramas simples explicando cómo funciona la IA
• Quotes directas de empleados entrevistados
• Estadísticas/métricas concretas obtenidas

**Hacer presentación interactiva**:
• Demo grabada si lograron capturar sistema funcionando
• Role-play simulando interacción con chatbot/sistema
• Quiz rápido para audiencia: "¿Adivinan cuántos % de precisión tiene?"
• Props/objetos físicos relacionados con la visita`,
      type: 'presentation'
    },
    {
      id: 14,
      question: 'Discutir con un grupo varios pasajes bíblicos que hablan de la inteligencia humana. Comparar y contrastar inteligencia artificial moderna con la inteligencia que Dios dio a Sus criaturas. Algunos textos incluyen: Génesis 1:26 y 27; Salmo 139; y Salmo 8:3-6.',
      answer: `**Reflexión básica:**
La inteligencia humana, creada a imagen de Dios, incluye capacidades espirituales, morales y emocionales únicas que trascienden la inteligencia artificial. La IA es herramienta creada por humanos, pero carece de alma y conexión espiritual.

**Para los curiosos - Estudio bíblico profundo:**

**📖 ANÁLISIS DE TEXTOS BÍBLICOS**

**🌟 Génesis 1:26-27 - "Imagen de Dios"**

*"Entonces dijo Dios: Hagamos al hombre a nuestra imagen, conforme a nuestra semejanza... Y creó Dios al hombre a su imagen, a imagen de Dios lo creó"*

**¿Qué significa "imagen de Dios"?**
• **Capacidad creativa**: Podemos crear arte, música, tecnología (¡incluyendo IA!)
• **Razonamiento moral**: Distinguimos bien del mal intuitivamente
• **Relación personal**: Podemos conectar profundamente con Dios y otros
• **Dominio responsable**: Administramos la creación con sabiduría
• **Libre albedrío**: Tomamos decisiones con consecuencias morales

**IA vs. Imagen de Dios**:
✅ **IA puede**: Imitar creatividad, procesar moral como reglas
❌ **IA NO puede**: Tener relación personal con Dios, sentir culpa/redención, amar genuinamente

**🔍 Salmo 139 - "Conocimiento maravilloso"**

*"Tal conocimiento es demasiado maravilloso para mí; Alto es, no lo puedo comprender"*

**Conocimiento divino vs. IA**:
• **Dios conoce** nuestros pensamientos antes que los tengamos
• **Dios conoce** nuestras motivaciones más profundas
• **IA conoce** patrones en nuestro comportamiento, pero no nuestro corazón
• **Diferencia clave**: Conocimiento estadístico vs. conocimiento íntimo/personal

**Ejemplo práctico**:
• **Google sabe** que buscaste "síntomas depresión" → te muestra anuncios
• **Dios sabe** que estás deprimido → te envía un amigo justo cuando lo necesitas
• **IA predice** comportamiento basado en datos
• **Dios conoce** el alma basado en amor infinito

**👑 Salmo 8:3-6 - "Poco menor que los ángeles"**

*"Cuando veo tus cielos... ¿qué es el hombre, para que tengas de él memoria?... Le has hecho poco menor que los ángeles, y lo coronaste de gloria y de honra"*

**Posición única de la humanidad**:
• **Físicos**: como animales (cuerpo, necesidades básicas)
• **Espirituales**: "poco menor que ángeles" (alma, conexión divina)
• **IA**: Solo procesamiento de información, sin dimensión espiritual
• **Humanos**: Únicos en combinar materia y espíritu

**🤖 vs 👤 COMPARACIÓN DETALLADA**

**INTELIGENCIA ARTIFICIAL:**

**Fortalezas**:
• Procesamiento masivo de datos
• Memoria perfecta y acceso instantáneo
• Cálculos complejos sin errores
• Funciona 24/7 sin fatiga
• Precisión sobrehumana en tareas específicas

**Limitaciones fundamentales**:
• No comprende significado real, solo patrones
• No tiene experiencias subjetivas
• No puede amar, odiar, esperar, o temer genuinamente
• No tiene propósito propio, solo objetivos programados
• No puede conectar con lo divino

**INTELIGENCIA HUMANA:**

**Capacidades únicas dadas por Dios**:

**💝 DIMENSIÓN EMOCIONAL/RELACIONAL**
• **Amor incondicional**: Padres que aman hijos pese a errores
• **Empatía genuina**: Lloramos por sufrimiento ajeno sin beneficio personal
• **Perdón**: Liberamos resentimientos contra nuestra "lógica"
• **Esperanza**: Creemos en futuros mejores sin evidencia empírica
• **Sacrificio**: Damos la vida por otros voluntariamente

**🙏 DIMENSIÓN ESPIRITUAL**
• **Oración**: Comunicación directa con lo divino
• **Fe**: Creencia que trasciende evidencia material
• **Conciencia moral**: Voz interna que nos guía éticamente
• **Búsqueda de significado**: "¿Para qué existo?" (IA nunca se pregunta esto)
• **Experiencia de lo sagrado**: Sentir la presencia de Dios

**🎨 CREATIVIDAD INSPIRADA**
• **Inspiración divina**: Ideas que "vienen de la nada"
• **Arte que trasciende**: Música que mueve el alma
• **Innovación con propósito**: Inventos para servir a la humanidad
• **Belleza por la belleza**: Apreciamos atardeceres sin razón evolutiva

**🧠 SABIDURÍA vs. CONOCIMIENTO**
• **Conocimiento**: Saber que tomate es fruta (IA puede)
• **Sabiduría**: Saber no ponerlo en ensalada de frutas (requiere experiencia/contexto)
• **IA tiene**: Acceso a todo conocimiento humano registrado
• **Humanos tenemos**: Sabiduría que viene de vivir, sufrir, y crecer

**⚖️ REFLEXIONES TEOLÓGICAS PROFUNDAS**

**¿IA amenaza la singularidad humana?**
• **NO**: Somos únicos no por inteligencia, sino por ser imagen de Dios
• **Analogía**: Calculadora es mejor que humanos en matemáticas, pero no nos hace menos especiales
• **IA amplifica** capacidades humanas, no las reemplaza
• **Nuestro valor** viene de ser amados por Dios, no de nuestras habilidades

**¿Deberíamos temer a la IA?**
• **Precaución sí**, pero no terror paralizante
• **Dios nos dio** dominio y responsabilidad sobre la creación (Génesis 1:28)
• **IA es herramienta** creada por inteligencia dada por Dios
• **Usar sabiduría** para dirigir IA hacia propósitos que honran a Dios

**¿IA puede acercarnos a Dios?**
• **IA en medicina** salva vidas → reflejamos el carácter sanador de Cristo
• **IA en educación** extiende conocimiento → cumplimos mandato de enseñar
• **IA en comunicación** conecta culturas → avanza la Gran Comisión
• **Pero**: Solo cuando usamos IA para amar y servir como Cristo lo haría

**🤔 PREGUNTAS PARA DISCUSIÓN GRUPAL**

**Preguntas teológicas**:
1. Si humanos creamos IA, ¿eso nos hace "pequeños dioses"? ¿Por qué sí/no?
2. ¿Puede una máquina tener alma? ¿Qué dice la Biblia sobre el alma?
3. ¿IA súper-inteligente sería rival de Dios o demostración de Su sabiduría en nosotros?
4. ¿Cómo podemos usar IA para cumplir mejor la Gran Comisión?

**Preguntas éticas**:
1. ¿Está bien crear IA que imite personalidad humana (como chatbots románticos)?
2. ¿Debería IA tomar decisiones de vida o muerte (autos autónomos, medicina)?
3. ¿Cómo mantenemos humildad si IA nos hace sentir "como dioses"?
4. ¿Qué responsabilidad tenemos hacia futuras generaciones con IA?

**📚 PASAJES BÍBLICOS ADICIONALES RELEVANTES**

**Sobre sabiduría vs. conocimiento**:
• Proverbios 9:10: "El temor de Jehová es el principio de la sabiduría"
• 1 Corintios 8:1: "El conocimiento envanece, pero el amor edifica"

**Sobre creatividad humana**:
• Éxodo 31:3: "Lo he llenado del Espíritu de Dios, en sabiduría y en inteligencia"
• Colosenses 3:23: "Todo lo que hagáis, hacedlo de corazón, como para el Señor"

**Sobre mayordomía/responsabilidad**:
• Lucas 12:48: "A todo aquel a quien se haya dado mucho, mucho se le demandará"
• Mateo 25:14-30: Parábola de los talentos (usar dones responsablemente)

**🎯 CONCLUSIÓN PRÁCTICA**

**La IA nos recuerda que**:
• Somos más que la suma de nuestros procesos cognitivos
• Nuestro valor viene de ser amados por Dios, no de nuestras capacidades
• Tenemos responsabilidad única como imagen de Dios en la creación
• La inteligencia sin sabiduría divina es limitada e incompleta

**Como cristianos, podemos**:
• Usar IA para aliviar sufrimiento y extender amor
• Mantener humildad reconociendo que toda inteligencia viene de Dios
• Asegurar que la IA sirve propósitos que honran a Dios y bendicen a la humanidad
• Recordar que ninguna tecnología puede reemplazar nuestra necesidad de relación con nuestro Creator`,
      type: 'text'
    }
  ];

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handlePresentationDateChange = (questionId: number, date: string) => {
    setPresentationDates(prev => ({ ...prev, [questionId]: date }));
  };

  const toggleHelp = (questionId: number) => {
    setShowHelp(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        .no-print { display: none !important; }
        .print-only { display: block !important; }
        body { font-size: 12pt; }
        .container { max-width: 100%; margin: 0; padding: 0; }
        .page-break { page-break-before: always; }
        .question-block { break-inside: avoid; margin-bottom: 1.5rem; }
        h1 { font-size: 18pt; margin-bottom: 1rem; }
        h3 { font-size: 14pt; margin-bottom: 0.5rem; }
        input, textarea { border: 1px solid #000; }
        .form-field { margin-bottom: 0.8rem; }
        .signature-section { margin-top: 2rem; display: flex; justify-content: space-between; }
      }
      @media screen {
        .print-only { display: none; }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
        <div className="no-print">
          <Header />
        </div>

        <div className="container mx-auto px-4 py-8">
        {/* Título para impresión */}
        <div className="print-only text-center mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Image
              src="/departments/clubes/especialidades/Inteligencia-Artificial.jpg"
              alt="Logo Especialidad IA"
              width={60}
              height={60}
              className="rounded-full object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold">Especialidad: Inteligencia Artificial</h1>
              <p className="text-sm">Nivel de destreza 2 • Actividades vocacionales • División Norteamericana</p>
            </div>
          </div>
          <div className="form-field">
            <label>Nombre: ________________________________</label>
          </div>
        </div>

        {/* Encabezado de la especialidad - Solo pantalla */}
        <div className="mb-12 text-center no-print">
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#4b207f] to-[#6b46c1] rounded-full p-1 shadow-xl">
                <div className="bg-white rounded-full p-1">
                  <Image
                    src="/departments/clubes/especialidades/Inteligencia-Artificial.jpg"
                    alt="Logo Especialidad Inteligencia Artificial"
                    width={120}
                    height={120}
                    className="rounded-full shadow-lg object-cover"
                    priority
                  />
                </div>
              </div>
              <div className="w-[132px] h-[132px]"></div> {/* Spacer for absolute positioning */}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-4xl font-bold text-[#4b207f] mb-3">Especialidad: Inteligencia Artificial</h1>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">Nivel de destreza 2</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">Actividades vocacionales</span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">División Norteamericana</span>
              </div>
            </div>
          </div>

          {/* Enlace de descarga del PDF - Mejorado */}
          <div className="mb-6">
            <div className="inline-block bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-1 shadow-lg">
              <a
                href="/departments/clubes/especialidades/inteligencia_artificial.pdf"
                download
                className="flex items-center gap-3 bg-white rounded-xl px-8 py-4 text-red-600 font-semibold transition-all hover:bg-red-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-6a3.375 3.375 0 00-3.375 3.375v2.625M12 6v6m0 0l3-3m-3 3l-3-3" />
                </svg>
                <span>Descargar documento PDF oficial</span>
                <span className="text-sm bg-red-100 px-2 py-1 rounded-full">PDF</span>
              </a>
            </div>
          </div>
        </div>

        {/* Información sobre la especialidad - MOVIDO AL INICIO - Solo pantalla */}
        <div className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
          {/* Información general */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-blue-900">Sobre esta especialidad</h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="leading-relaxed">
                La especialidad de <strong>Inteligencia Artificial</strong> te introduce al fascinante mundo de la IA, 
                desde sus fundamentos históricos hasta sus aplicaciones modernas en la sociedad.
              </p>
              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                <h3 className="font-semibold text-blue-900 mb-2">¿Qué aprenderás?</h3>
                <ul className="text-sm space-y-1">
                  <li>• Historia y evolución de la inteligencia artificial</li>
                  <li>• Conceptos fundamentales y terminología técnica</li>
                  <li>• Aplicaciones reales de IA en la sociedad actual</li>
                  <li>• Limitaciones y consideraciones éticas de la IA</li>
                  <li>• Reflexión cristiana sobre la inteligencia humana</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Objetivos y recursos */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border border-green-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-900">Objetivos y recursos</h2>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                <h3 className="font-semibold text-green-900 mb-3">Objetivos de aprendizaje:</h3>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Comprender los fundamentos de la inteligencia artificial</li>
                  <li>• Conocer la historia y evolución de la IA</li>
                  <li>• Identificar aplicaciones reales de la IA en la sociedad</li>
                  <li>• Analizar las limitaciones y desafíos éticos de la IA</li>
                  <li>• Reflexionar sobre la inteligencia humana desde una perspectiva cristiana</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-4 border-l-4 border-emerald-500">
                <h3 className="font-semibold text-emerald-900 mb-3">Recursos recomendados:</h3>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>• Documentales sobre historia de la inteligencia artificial</li>
                  <li>• Visitas a centros de tecnología o universidades</li>
                  <li>• Entrevistas con profesionales en IA</li>
                  <li>• Demostraciones prácticas de sistemas de IA</li>
                  <li>• Estudio bíblico sobre la inteligencia humana</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario interactivo */}
        <div className="mx-auto max-w-4xl">
          <form className="space-y-8">
            {/* Campo para nombre - Solo pantalla */}
            <div className="rounded-lg border border-gray-200 p-4 no-print">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nombre del participante:
              </label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#4b207f] focus:outline-none focus:ring-1 focus:ring-[#4b207f]"
              />
            </div>

            {/* Preguntas */}
            {questions.map((q) => (
              <div key={q.id} className="question-block rounded-lg border border-gray-200 p-4">
                <h3 className="mb-3 text-lg font-semibold text-[#4b207f]">
                  {q.id}. {q.question}
                </h3>

                {/* Botón de ayuda interactivo - Solo pantalla */}
                <div className="mb-3 no-print">
                  <button
                    type="button"
                    onClick={() => toggleHelp(q.id)}
                    className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {showHelp[q.id] ? 'Ocultar ayuda' : 'Ver ayuda'}
                  </button>
                </div>

                {/* Respuesta de referencia interactiva - Solo pantalla */}
                {showHelp[q.id] && (
                  <div className="mb-4 rounded-lg bg-blue-50 p-4 no-print">
                    <h4 className="mb-2 font-medium text-blue-800">Respuesta de referencia:</h4>
                    <div className="text-sm text-blue-700 whitespace-pre-line">{q.answer}</div>
                  </div>
                )}

                {/* Campo para respuesta del usuario */}
                <div className="form-field">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Tu respuesta:
                  </label>
                  <textarea
                    rows={q.type === 'list' ? 6 : 4}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#4b207f] focus:outline-none focus:ring-1 focus:ring-[#4b207f] print:border-black"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  />
                </div>

                {/* Campos adicionales para presentaciones */}
                {q.type === 'presentation' && (
                  <div className="mt-3 form-field">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Fecha de presentación:
                    </label>
                    <input
                      type="date"
                      className="rounded-md border border-gray-300 px-3 py-2 focus:border-[#4b207f] focus:outline-none focus:ring-1 focus:ring-[#4b207f] print:border-black"
                      value={presentationDates[q.id] || ''}
                      onChange={(e) => handlePresentationDateChange(q.id, e.target.value)}
                    />
                  </div>
                )}

                {/* Campos especiales para pregunta 13 */}
                {q.id === 13 && (
                  <div className="mt-3 space-y-3">
                    <div className="form-field">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Lugar de visita:
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#4b207f] focus:outline-none focus:ring-1 focus:ring-[#4b207f] print:border-black"
                        value={visitInfo.place}
                        onChange={(e) => setVisitInfo(prev => ({ ...prev, place: e.target.value }))}
                      />
                    </div>
                    <div className="form-field">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Fecha de visita:
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#4b207f] focus:outline-none focus:ring-1 focus:ring-[#4b207f] print:border-black"
                        value={visitInfo.date}
                        onChange={(e) => setVisitInfo(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Sección final */}
            <div className="question-block rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 text-lg font-semibold text-[#4b207f]">
                Finalización de la especialidad
              </h3>
              <div className="signature-section space-y-3">
                <div className="form-field">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Fecha completada:
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#4b207f] focus:outline-none focus:ring-1 focus:ring-[#4b207f] print:border-black"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Instructor/asesor:
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-[#4b207f] focus:outline-none focus:ring-1 focus:ring-[#4b207f] print:border-black"
                    value={instructor}
                    onChange={(e) => setInstructor(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción - Solo pantalla */}
            <div className="flex justify-center no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg bg-green-600 px-8 py-3 text-white transition-colors hover:bg-green-700 flex items-center gap-2 font-semibold"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir formulario completado
              </button>
            </div>
          </form>
        </div>

      </div>

      <div className="no-print">
        <Footer />
      </div>
    </div>
  );
}