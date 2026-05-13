export type BeautyCategoria =
  | "rutina-diaria"
  | "rostro"
  | "cabello"
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
};

export const ORDEN_CATEGORIAS: { id: BeautyCategoria; titulo: string; intro: string }[] = [
  {
    id: "rutina-diaria",
    titulo: "Rutina diaria",
    intro:
      "Orden sugerido: limpiar → hidratar → proteger (día). Por la noche, retira bien protector/suciedad antes de humectar. Ajusta a tu piel y clima."
  },
  {
    id: "rostro",
    titulo: "Rostro e hidratación",
    intro: "Mascarillas y cuidados suaves para luminosidad y barrera cutánea."
  },
  {
    id: "cabello",
    titulo: "Cabello",
    intro: "Nutrición puntual y hábitos suaves; el cabello sano combina corte, menos calor y buen lavado."
  },
  {
    id: "ojos-y-ojeras",
    titulo: "Ojos y ojeras",
    intro: "Frío, descanso y suavidad: la ojera mejora mucho con sueño regular y protección solar diaria."
  },
  {
    id: "acne-y-granos",
    titulo: "Acné y granos",
    intro: "Ideas muy suaves de apoyo; el acné persistente merece valoración dermatológica."
  },
  {
    id: "labios-y-manos",
    titulo: "Labios y manos",
    intro: "Zonas que delatan sequedad; hidratar después de lavar manos y antes de dormir."
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
      "Retira maquillaje o SPF con limpiador o aceite suave; segunda pasada con gel leve si lo necesitas. Humectante un poco más nutritivo que por el día. Evita pantallas 20 min antes de dormir para mejor descanso (y menos ojera).",
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
  }
];
