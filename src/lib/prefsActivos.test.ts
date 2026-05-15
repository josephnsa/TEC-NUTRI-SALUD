/** @vitest-environment happy-dom */
import { beforeEach, describe, expect, it } from "vitest";
import type { ListaItem } from "./ketoMercado";
import { getMercadoActivoParaPlan, getMercadoRealizado, guardarMercadoRealizado } from "./mercadoHistorial";
import { getSnapshotActivoId, guardarSnapshotCronograma } from "./cronogramaHistorial";
import { restaurarActivosLocalesDesdeEstado } from "./prefsActivos";
import type { EstadoPerfiles } from "./perfilStorage";

const PERFILES_KEY = "tec_nutri_salud_perfiles_v1";

function item(comprado: boolean): ListaItem {
  return {
    id: "i1",
    nombre: "Huevos",
    categoria: "proteina",
    cantidad: 12,
    unidad: "ud",
    basePorPersonaDia: 2,
    comprado
  };
}

describe("prefsActivos.restaurarActivosLocalesDesdeEstado", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("restaura mercado y plan activos desde activosModulo", () => {
    const perfilId = "perfil-a";
    const estado: EstadoPerfiles = {
      perfiles: [
        {
          id: perfilId,
          creadoEn: "2026-05-01T00:00:00.000Z",
          nombre: "Test",
          edad: 30,
          pesoKg: 70,
          tallaCm: 170,
          sexo: "o",
          enfermedades: "",
          alimentosEvitar: "",
          estiloDieta: "keto",
          fechaInicioPlan: null
        }
      ],
      activoId: perfilId,
      activosModulo: {}
    };
    localStorage.setItem(PERFILES_KEY, JSON.stringify(estado));

    const mercado = guardarMercadoRealizado(7, 2, [item(true)]);
    localStorage.removeItem(`tec_nutri_salud_mercado_activo_plan_id_v1__${perfilId}`);

    const plan = guardarSnapshotCronograma({
      perfilId,
      fechaInicioPlan: "2026-05-13",
      dias: 3,
      modo: "mixto",
      fuente: "plantillas",
      mercadoActivoId: mercado.id,
      claveVariedad: null,
      diasPlan: [
        {
          dia: 1,
          comidas: {
            desayuno: { titulo: "T", receta: "R", videoQuery: "t" },
            almuerzo: { titulo: "A", receta: "R", videoQuery: "a" },
            cena: { titulo: "C", receta: "R", videoQuery: "c" }
          }
        }
      ]
    });
    expect(plan).not.toBeNull();
    localStorage.removeItem(`tec_nutri_salud_cronograma_activo_v1__${perfilId}`);

    restaurarActivosLocalesDesdeEstado({
      ...estado,
      activosModulo: {
        mercadoPorPerfil: { [perfilId]: mercado.id },
        planPorPerfil: { [perfilId]: plan!.id }
      }
    });

    expect(getMercadoActivoParaPlan()).toBe(mercado.id);
    expect(getMercadoRealizado(mercado.id)?.items[0]?.comprado).toBe(true);
    expect(getSnapshotActivoId(perfilId)).toBe(plan!.id);
  });
});
