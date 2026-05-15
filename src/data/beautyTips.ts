export type BeautyCategoria =
  | "rutina-diaria"
  | "rostro"
  | "cabello"
  | "caida-cabello"
  | "fortalecimiento-cabello"
  | "ojos-y-ojeras"
  | "acne-y-granos"
  | "labios-y-manos";

export type BeautyTip = {
  id: string;
  categoria: BeautyCategoria;
  titulo: string;
  descripcion: string;
  ingredientes: string[];
  precaucion?: string;
  /** Palabras clave para búsqueda de vídeo (YouTube / Gemini). */
  videoQuery?: string;
};

export const ORDEN_CATEGORIAS: { id: BeautyCategoria; titulo: string; intro: string }[] = [
  {
    id: "rutina-diaria",
    titulo: "Rutina diaria",
    intro: "Limpia → hidrata → SPF (día). Por la noche, retira bien antes de humectar. Ajusta a tu piel."
  },
  {
    id: "rostro",
    titulo: "Rostro e hidratación",
    intro: "Mascarillas suaves para luminosidad y barrera."
  },
  {
    id: "cabello",
    titulo: "Cabello",
    intro: "Menos calor al secar y nutrición puntual."
  },
  {
    id: "caida-cabello",
    titulo: "Caída de cabello",
    intro: "Apoyo suave en cuero cabelludo y hábitos; caída abundante o parches: valoración médica."
  },
  {
    id: "fortalecimiento-cabello",
    titulo: "Fortalecimiento capilar",
    intro: "Nutrición tópica y cuidados que reducen rotura; no sustituyen tratamiento si hay alopecia."
  },
  {
    id: "ojos-y-ojeras",
    titulo: "Ojos y ojeras",
    intro: "Frío suave, descanso y SPF diario ayudan a la zona."
  },
  {
    id: "acne-y-granos",
    titulo: "Acné y granos",
    intro: "Apoyo muy suave; acné persistente: dermatología."
  },
  {
    id: "labios-y-manos",
    titulo: "Labios y manos",
    intro: "Hidrata tras lavarte las manos y antes de dormir."
  }
];

export const beautyTips: BeautyTip[] = [
  {
    id: "rutina-manana",
    categoria: "rutina-diaria",
    titulo: "Rutina de mañana (5 minutos)",
    descripcion:
      "1) Lava con agua tibia y limpiador suave (sin frotar fuerte). 2) Seca con toalla limpia sin arrastrar. 3) Hidratante ligero en rostro y cuello. 4) Si hay sol, SPF en rostro (y manos si van al sol).",
    ingredientes: ["Limpiador suave", "Toalla limpia", "Hidratante", "Protector solar facial (SPF)"],
    precaucion: "Si usas medicamentos tópicos, pregunta a tu dermatóloga cómo combinarlos con SPF."
  },
  {
    id: "rutina-noche",
    categoria: "rutina-diaria",
    titulo: "Rutina de noche (relajación + piel)",
    descripcion:
      "Retira maquillaje o SPF con limpiador o aceite suave; segunda pasada con gel leve si hace falta. Humectante un poco más nutritivo que por el día.",
    ingredientes: ["Limpiador o bálsamo desmaquillante", "Gel limpiador suave (opcional)", "Crema de noche"],
    precaucion: "No combines muchos activos fuertes la misma noche sin orientación."
  },
  {
    id: "miel-avena",
    categoria: "rostro",
    titulo: "Mascarilla suavizante de avena y miel",
    descripcion:
      "Mezcla avena fina con un poco de miel y agua tibia hasta formar pasta. Aplica 10 minutos y enjuaga. Hidrata sin agredir la barrera cutánea.",
    ingredientes: ["2 cucharadas de avena en polvo", "1 cucharadita de miel", "Agua tibia"],
    videoQuery: "mascarilla avena miel facial casera",
    precaucion: "No usar si eres alérgico a la miel o al polen."
  },
  {
    id: "aguacate",
    categoria: "rostro",
    titulo: "Mascarilla nutritiva de aguacate",
    descripcion:
      "Machaca medio aguacate maduro y aplica sobre rostro limpio 10–15 minutos. Rico en ácidos grasos naturales.",
    ingredientes: ["Medio aguacate maduro"],
    precaucion: "Prueba en antebrazo si tienes piel muy reactiva."
  },
  {
    id: "te-verde",
    categoria: "rostro",
    titulo: "Tónico frío de té verde",
    descripcion:
      "Prepara té verde, deja enfriar y guarda en atomizador en nevera máximo 48 h. Rocía antes del hidratante (no sustituye limpiador).",
    ingredientes: ["1 bolsita de té verde", "250 ml de agua"],
    precaucion: "Contiene cafeína; evita contacto con ojos."
  },
  {
    id: "mascarilla-puntas",
    categoria: "cabello",
    titulo: "Aceite en puntas (15–30 min)",
    descripcion:
      "Aplica poco aceite de coco o argán solo de medios a puntas en pelo seco o húmedo. Deja actuar y lava con champú suave. No en raíz si tiendes a grasa.",
    ingredientes: ["1–2 cucharaditas de aceite de coco o argán", "Champú suave"],
    videoQuery: "aceite coco argan puntas cabello tratamiento",
    precaucion: "Poco producto: demasiado aceite cuesta enjuagar."
  },
  {
    id: "enjuague-suave",
    categoria: "cabello",
    titulo: "Aclarado suave post-champú",
    descripcion:
      "Último enjuagado con agua fría ayuda a cerrar cutícula (brillo aparente). Seca sin frotar: envuelve en toalla y deja absorber.",
    ingredientes: ["Agua fría (solo enjuague final)", "Toalla limpia"],
    precaucion: "No restriegues el cabello mojado: se rompe más fácil."
  },
  {
    id: "ojeras-te",
    categoria: "ojos-y-ojeras",
    titulo: "Bolsitas de té frías para párpados",
    descripcion:
      "Prepara dos bolsitas de té negro o manzanilla, escurre y enfría en nevera 15 min. Cierra ojos y aplica 5–8 minutos. Combina con buen descanso.",
    ingredientes: ["2 bolsitas de té", "Agua caliente para infusionar", "Nevera"],
    precaucion: "No debe escurrir té fuerte hacia el ojo; presión suave."
  },
  {
    id: "ojeras-descanso",
    categoria: "ojos-y-ojeras",
    titulo: "Hábito clave: ritmo de sueño",
    descripcion:
      "Fija hora de acostarse similar cada día; luz tenue 1 h antes; habitación fresca. La ojera violeta/gris mejora mucho con sueño regular y hidratación.",
    ingredientes: ["Rutina de sueño constante", "Agua durante el día"],
    precaucion: "Ojeras persistentes o hinchazón matutina: valoración médica si hay dudas."
  },
  {
    id: "acne-compresa",
    categoria: "acne-y-granos",
    titulo: "Compresa tibia de manzanilla (calma superficial)",
    descripcion:
      "Infusión de manzanilla, empapa gasa limpia y aplica tibia (no caliente) sobre zona 5 minutos. Limpia después y humecta ligero.",
    ingredientes: ["1 bolsita de manzanilla", "Agua", "Gasa o paño limpio"],
    precaucion: "No exprimir granos: riesgo de mancha e infección. Acné severo: dermatología."
  },
  {
    id: "acne-arroz",
    categoria: "acne-y-granos",
    titulo: "Agua de arroz como tónico muy suave",
    descripcion:
      "Enjuaga arroz, remoja 30 min, cuela el agua y guarda en frío máximo 48 h. Aplica con algodón en zona grasa 1 vez al día como complemento (no sustituye tratamiento).",
    ingredientes: ["3 cucharadas de arroz", "Agua filtrada"],
    precaucion: "Si irrita, suspende. No mezcles con retinoides sin consejo profesional."
  },
  {
    id: "azucar-cafe",
    categoria: "labios-y-manos",
    titulo: "Exfoliante labial de café y azúcar moreno",
    descripcion:
      "Mezcla 1:1 azúcar moreno molido fino con unas gotas de aceite de coco. Masaje suave en labios 20 segundos y retira.",
    ingredientes: ["1 cucharadita azúcar moreno", "Aceite de coco (unas gotas)"],
    precaucion: "Exfoliación suave; no más de 2 veces por semana."
  },
  {
    id: "aloe",
    categoria: "labios-y-manos",
    titulo: "Gel refrescante de aloe (manos o rostro)",
    descripcion:
      "Si tienes planta de sábila, usa gel puro en zonas irritadas por sol o rozaduras ligeras. Alternativa: gel certificado sin alcohol.",
    ingredientes: ["Gel de aloe vera puro"],
    precaucion: "Si aparece enrojecimiento, suspende el uso."
  },
  {
    id: "masaje-cuero-cabelludo",
    categoria: "caida-cabello",
    titulo: "Masaje suave del cuero cabelludo con aceite",
    descripcion:
      "Mezcla 1 cucharadita de aceite de ricino o coco con 2 de aceite de oliva. Masajea 3–5 minutos con yemas de dedos (sin uñas) y deja 20–30 min antes del champú.",
    ingredientes: ["Aceite de coco o ricino", "Aceite de oliva", "Champú suave"],
    videoQuery: "masaje cuero cabelludo caida cabello aceite casero",
    precaucion: "Caída repentina o parches sin pelo: consulta médica; esto no sustituye tratamiento."
  },
  {
    id: "te-ortiga-tonico",
    categoria: "caida-cabello",
    titulo: "Tónico frío de ortiga o romero (enjuague)",
    descripcion:
      "Infusiona 2 cucharadas de ortiga seca o ramita de romero en 300 ml de agua, deja enfriar y usa como último enjuague tras champú 1–2 veces por semana.",
    ingredientes: ["Ortiga seca o romero fresco", "Agua", "Colador"],
    videoQuery: "enjuague romero ortiga caida cabello casero",
    precaucion: "No uses si estás embarazada o tomas anticoagulantes sin orientación."
  },
  {
    id: "habitos-caida",
    categoria: "caida-cabello",
    titulo: "Hábitos que reducen tensión en la raíz",
    descripcion:
      "Evita coletas muy apretadas en pelo húmedo, reduce calor alto al secar y cepilla desde puntas hacia raíz con peine de púas anchas.",
    ingredientes: ["Peine de púas anchas", "Toalla de microfibra o algodón"],
    videoQuery: "como evitar caida cabello habitos cuidado",
    precaucion: "Más de 100 hebras al día de forma sostenida: valoración dermatológica."
  },
  {
    id: "mascarilla-huevo-fortalecer",
    categoria: "fortalecimiento-cabello",
    titulo: "Mascarilla de huevo y aceite de oliva",
    descripcion:
      "Bate 1 huevo con 1 cucharada de aceite de oliva. Aplica de medios a puntas 15–20 minutos y enjuaga con agua tibia, luego champú suave.",
    ingredientes: ["1 huevo", "1 cucharada aceite de oliva", "Champú suave"],
    videoQuery: "mascarilla huevo aceite fortalecer cabello casero",
    precaucion: "Enjuaga bien con agua tibia (no caliente) para no cocer el huevo en el pelo."
  },
  {
    id: "vinagre-brillo",
    categoria: "fortalecimiento-cabello",
    titulo: "Aclarado de vinagre de manzana diluido",
    descripcion:
      "Mezcla 1 parte de vinagre de manzana con 3 de agua. Tras champú, vierte sobre medios y puntas, deja 2 min y enjuaga. Cierra cutícula y aporta brillo.",
    ingredientes: ["Vinagre de manzana", "Agua"],
    videoQuery: "vinagre manzana cabello brillo fortalecer enjuague",
    precaucion: "No uses si tienes cuero cabelludo irritado o heridas."
  },
  {
    id: "aloe-cuero-cabelludo",
    categoria: "fortalecimiento-cabello",
    titulo: "Gel de aloe en cuero cabelludo",
    descripcion:
      "Aplica gel puro de aloe en raíz con masaje suave, deja 30 min y lava. Puede calmar y hidratar la zona.",
    ingredientes: ["Gel de aloe vera puro"],
    videoQuery: "aloe vera cuero cabelludo fortalecer cabello",
    precaucion: "Si pica o enrojece, suspende. Prueba en antebrazo antes."
  }
];
