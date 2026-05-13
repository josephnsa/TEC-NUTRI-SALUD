export type KetoItem = {
  id: string;
  nombre: string;
  unidad: string;
  /** cantidad base por persona por día (referencia mercado) */
  basePorPersonaDia: number;
  categoria: "proteina" | "grasa" | "verdura" | "lacteo" | "extras";
  nota?: string;
};

export const ketoCatalog: KetoItem[] = [
  {
    id: "huevo",
    nombre: "Huevos",
    unidad: "unidades",
    basePorPersonaDia: 2,
    categoria: "proteina",
    nota: "Orgánicos si es posible"
  },
  {
    id: "pollo",
    nombre: "Pechuga o muslo de pollo",
    unidad: "g",
    basePorPersonaDia: 180,
    categoria: "proteina"
  },
  {
    id: "pescado",
    nombre: "Pescado blanco o salmón",
    unidad: "g",
    basePorPersonaDia: 150,
    categoria: "proteina"
  },
  {
    id: "carne",
    nombre: "Carne magra (res/cerdo)",
    unidad: "g",
    basePorPersonaDia: 150,
    categoria: "proteina"
  },
  {
    id: "tocino",
    nombre: "Tocino sin azúcar",
    unidad: "g",
    basePorPersonaDia: 40,
    categoria: "proteina",
    nota: "Revisar etiqueta (sin miel/azúcar)"
  },
  {
    id: "queso",
    nombre: "Quesos enteros (mozzarella, cheddar)",
    unidad: "g",
    basePorPersonaDia: 60,
    categoria: "lacteo"
  },
  {
    id: "mantequilla",
    nombre: "Mantequilla / ghee",
    unidad: "g",
    basePorPersonaDia: 25,
    categoria: "grasa"
  },
  {
    id: "aceite",
    nombre: "Aceite de oliva extra virgen",
    unidad: "ml",
    basePorPersonaDia: 20,
    categoria: "grasa"
  },
  {
    id: "aguacate",
    nombre: "Aguacate",
    unidad: "unidades",
    basePorPersonaDia: 0.5,
    categoria: "grasa"
  },
  {
    id: "nueces",
    nombre: "Nueces / almendras",
    unidad: "g",
    basePorPersonaDia: 30,
    categoria: "extras"
  },
  {
    id: "verdura_hoja",
    nombre: "Verduras de hoja (lechuga, espinaca)",
    unidad: "g",
    basePorPersonaDia: 120,
    categoria: "verdura"
  },
  {
    id: "verdura_baja",
    nombre: "Brócoli, coliflor, calabacín",
    unidad: "g",
    basePorPersonaDia: 200,
    categoria: "verdura"
  },
  {
    id: "champinon",
    nombre: "Champiñones",
    unidad: "g",
    basePorPersonaDia: 80,
    categoria: "verdura"
  },
  {
    id: "crema",
    nombre: "Crema para cocinar (alta grasa)",
    unidad: "ml",
    basePorPersonaDia: 40,
    categoria: "lacteo"
  },
  {
    id: "mayo",
    nombre: "Mayonesa sin azúcar",
    unidad: "g",
    basePorPersonaDia: 25,
    categoria: "extras"
  },
  {
    id: "cafe",
    nombre: "Café / té (sin azúcar)",
    unidad: "porciones",
    basePorPersonaDia: 1,
    categoria: "extras"
  }
];
