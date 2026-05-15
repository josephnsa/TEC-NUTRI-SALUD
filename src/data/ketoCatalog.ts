export type KetoItem = {
  id: string;
  nombre: string;
  unidad: string;
  /** cantidad base por persona por día (referencia mercado) */
  basePorPersonaDia: number;
  categoria: "proteina" | "grasa" | "verdura" | "lacteo" | "extras" | "cereal" | "fruta" | "legumbre";
  nota?: string;
  /** Tipos de dieta a los que aplica este ítem (vacío = todos) */
  dietas?: string[];
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

/** Ítems mediterráneos que no están en el catálogo keto */
export const mediterraneoCatalog: KetoItem[] = [
  { id: "med_pollo", nombre: "Pechuga de pollo", unidad: "g", basePorPersonaDia: 160, categoria: "proteina" },
  { id: "med_pescado", nombre: "Pescado (salmón, atún, merluza)", unidad: "g", basePorPersonaDia: 150, categoria: "proteina" },
  { id: "med_huevo", nombre: "Huevos", unidad: "unidades", basePorPersonaDia: 1.5, categoria: "proteina", nota: "Orgánicos si es posible" },
  { id: "med_aceite", nombre: "Aceite de oliva extra virgen", unidad: "ml", basePorPersonaDia: 25, categoria: "grasa" },
  { id: "med_aguacate", nombre: "Aguacate", unidad: "unidades", basePorPersonaDia: 0.3, categoria: "grasa" },
  { id: "med_nueces", nombre: "Nueces / almendras", unidad: "g", basePorPersonaDia: 25, categoria: "grasa" },
  { id: "med_tomate", nombre: "Tomates frescos", unidad: "g", basePorPersonaDia: 150, categoria: "verdura" },
  { id: "med_pimiento", nombre: "Pimientos (rojo, verde)", unidad: "g", basePorPersonaDia: 100, categoria: "verdura" },
  { id: "med_pepino", nombre: "Pepino", unidad: "g", basePorPersonaDia: 100, categoria: "verdura" },
  { id: "med_espinaca", nombre: "Espinaca / lechuga / rúcula", unidad: "g", basePorPersonaDia: 100, categoria: "verdura" },
  { id: "med_cebolla", nombre: "Cebolla / ajo", unidad: "g", basePorPersonaDia: 40, categoria: "verdura" },
  { id: "med_berenjena", nombre: "Berenjena / calabacín", unidad: "g", basePorPersonaDia: 120, categoria: "verdura" },
  { id: "med_lentejas", nombre: "Lentejas", unidad: "g", basePorPersonaDia: 80, categoria: "legumbre" },
  { id: "med_garbanzos", nombre: "Garbanzos (cocidos o secos)", unidad: "g", basePorPersonaDia: 80, categoria: "legumbre" },
  { id: "med_arroz", nombre: "Arroz integral", unidad: "g", basePorPersonaDia: 70, categoria: "cereal" },
  { id: "med_pasta", nombre: "Pasta integral", unidad: "g", basePorPersonaDia: 70, categoria: "cereal" },
  { id: "med_pan", nombre: "Pan integral de masa madre", unidad: "g", basePorPersonaDia: 60, categoria: "cereal" },
  { id: "med_yogur", nombre: "Yogur griego natural", unidad: "g", basePorPersonaDia: 120, categoria: "lacteo" },
  { id: "med_feta", nombre: "Queso feta / ricotta", unidad: "g", basePorPersonaDia: 40, categoria: "lacteo" },
  { id: "med_naranja", nombre: "Naranja / mandarina", unidad: "unidades", basePorPersonaDia: 0.5, categoria: "fruta" },
  { id: "med_manzana", nombre: "Manzana / pera", unidad: "unidades", basePorPersonaDia: 0.5, categoria: "fruta" },
  { id: "med_frutos_rojos", nombre: "Frutos rojos (fresas, arándanos)", unidad: "g", basePorPersonaDia: 80, categoria: "fruta" },
  { id: "med_limon", nombre: "Limón (zumo y ralladura)", unidad: "unidades", basePorPersonaDia: 0.3, categoria: "fruta" },
  { id: "med_hierbas", nombre: "Hierbas frescas (albahaca, orégano, perejil)", unidad: "porciones", basePorPersonaDia: 0.5, categoria: "extras" },
  { id: "med_cafe", nombre: "Café / té (sin azúcar)", unidad: "porciones", basePorPersonaDia: 1, categoria: "extras" }
];

/** Ítems dieta equilibrada/balanceada */
export const balanceadoCatalog: KetoItem[] = [
  { id: "bal_pollo", nombre: "Pechuga de pollo", unidad: "g", basePorPersonaDia: 150, categoria: "proteina" },
  { id: "bal_pescado", nombre: "Pescado (merluza, tilapia, salmón)", unidad: "g", basePorPersonaDia: 120, categoria: "proteina" },
  { id: "bal_carne", nombre: "Carne magra (res, cerdo)", unidad: "g", basePorPersonaDia: 100, categoria: "proteina" },
  { id: "bal_huevo", nombre: "Huevos", unidad: "unidades", basePorPersonaDia: 1.5, categoria: "proteina" },
  { id: "bal_aceite", nombre: "Aceite de oliva extra virgen", unidad: "ml", basePorPersonaDia: 20, categoria: "grasa" },
  { id: "bal_aguacate", nombre: "Aguacate", unidad: "unidades", basePorPersonaDia: 0.25, categoria: "grasa" },
  { id: "bal_nueces", nombre: "Nueces / almendras / semillas", unidad: "g", basePorPersonaDia: 20, categoria: "grasa" },
  { id: "bal_verdura_hoja", nombre: "Verduras de hoja (espinaca, lechuga)", unidad: "g", basePorPersonaDia: 100, categoria: "verdura" },
  { id: "bal_brocoli", nombre: "Brócoli / coliflor / zanahoria", unidad: "g", basePorPersonaDia: 150, categoria: "verdura" },
  { id: "bal_tomate", nombre: "Tomates / pepinos / pimientos", unidad: "g", basePorPersonaDia: 120, categoria: "verdura" },
  { id: "bal_cebolla", nombre: "Cebolla / ajo", unidad: "g", basePorPersonaDia: 40, categoria: "verdura" },
  { id: "bal_arroz", nombre: "Arroz (preferiblemente integral)", unidad: "g", basePorPersonaDia: 80, categoria: "cereal" },
  { id: "bal_pasta", nombre: "Pasta / fideos", unidad: "g", basePorPersonaDia: 70, categoria: "cereal" },
  { id: "bal_pan", nombre: "Pan integral", unidad: "g", basePorPersonaDia: 60, categoria: "cereal" },
  { id: "bal_avena", nombre: "Avena en hojuelas", unidad: "g", basePorPersonaDia: 50, categoria: "cereal" },
  { id: "bal_frijoles", nombre: "Frijoles / lentejas / garbanzos", unidad: "g", basePorPersonaDia: 70, categoria: "legumbre" },
  { id: "bal_leche", nombre: "Leche (entera o descremada)", unidad: "ml", basePorPersonaDia: 200, categoria: "lacteo" },
  { id: "bal_yogur", nombre: "Yogur natural", unidad: "g", basePorPersonaDia: 120, categoria: "lacteo" },
  { id: "bal_queso", nombre: "Queso fresco / mozzarella", unidad: "g", basePorPersonaDia: 40, categoria: "lacteo" },
  { id: "bal_platano", nombre: "Plátano / banano", unidad: "unidades", basePorPersonaDia: 0.5, categoria: "fruta" },
  { id: "bal_manzana", nombre: "Manzana / pera / naranja", unidad: "unidades", basePorPersonaDia: 0.5, categoria: "fruta" },
  { id: "bal_frutos_rojos", nombre: "Frutos rojos (fresas, arándanos)", unidad: "g", basePorPersonaDia: 80, categoria: "fruta" },
  { id: "bal_cafe", nombre: "Café / té / agua con limón", unidad: "porciones", basePorPersonaDia: 1, categoria: "extras" },
  { id: "bal_condimentos", nombre: "Condimentos y especias variadas", unidad: "porciones", basePorPersonaDia: 0.5, categoria: "extras" }
];
