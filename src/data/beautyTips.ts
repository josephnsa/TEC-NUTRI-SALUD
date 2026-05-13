export type BeautyTip = {
  id: string;
  titulo: string;
  descripcion: string;
  ingredientes: string[];
  precaucion?: string;
};

export const beautyTips: BeautyTip[] = [
  {
    id: "miel-avena",
    titulo: "Mascarilla suavizante de avena y miel",
    descripcion:
      "Mezcla avena fina con un poco de miel y agua tibia hasta formar pasta. Aplica 10 minutos y enjuaga. Hidrata sin agredir la barrera cutánea.",
    ingredientes: ["2 cucharadas de avena en polvo", "1 cucharadita de miel", "Agua tibia"],
    precaucion: "No usar si eres alérgico a la miel o al polen."
  },
  {
    id: "aguacate",
    titulo: "Mascarilla nutritiva de aguacate",
    descripcion:
      "Machaca medio aguacate maduro y aplica sobre rostro limpio 10–15 minutos. Rico en ácidos grasos naturales.",
    ingredientes: ["Medio aguacate maduro"],
    precaucion: "Prueba en antebrazo si tienes piel muy reactiva."
  },
  {
    id: "te-verde",
    titulo: "Tónico frío de té verde",
    descripcion:
      "Prepara té verde, deja enfriar y guarda en atomizador en nevera máximo 48 h. Rocía antes del hidratante (no sustituye limpiador).",
    ingredientes: ["1 bolsita de té verde", "250 ml de agua"],
    precaucion: "Contiene cafeína; evita contacto con ojos."
  },
  {
    id: "azucar-cafe",
    titulo: "Exfoliante labial de café y azúcar moreno",
    descripcion:
      "Mezcla 1:1 azúcar moreno molido fino con unas gotas de aceite de coco. Masaje suave en labios 20 segundos y retira.",
    ingredientes: ["1 cucharadita azúcar moreno", "Aceite de coco (unas gotas)"],
    precaucion: "Exfoliación suave; no más de 2 veces por semana."
  },
  {
    id: "aloe",
    titulo: "Gel refrescante de aloe",
    descripcion:
      "Si tienes planta de sábila, usa gel puro en zonas irritadas por sol o rozaduras ligeras. Alternativa: gel certificado sin alcohol.",
    ingredientes: ["Gel de aloe vera puro"],
    precaucion: "Si aparece enrojecimiento, suspende el uso."
  }
];
