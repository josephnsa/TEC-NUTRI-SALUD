import { describe, expect, it } from "vitest";
import { generarListaBase, generarListaKeto } from "./ketoMercado";
import { ketoCatalog, mediterraneoCatalog, balanceadoCatalog } from "../data/ketoCatalog";

describe("generarListaBase", () => {
  it("acota dias y personas y marca origen generador", () => {
    const lista = generarListaBase(0, 99, "keto");
    expect(lista.length).toBe(ketoCatalog.length);
    expect(lista.every((i) => i.origen === "generador" && !i.comprado)).toBe(true);
    const huevo = lista.find((i) => i.id === "huevo");
    expect(huevo?.cantidad).toBeGreaterThanOrEqual(1);
  });

  it("elige catalogo por estilo de dieta", () => {
    expect(generarListaBase(7, 2, "mediterranea").length).toBe(mediterraneoCatalog.length);
    expect(generarListaBase(7, 2, "balanceada").length).toBe(balanceadoCatalog.length);
    expect(generarListaBase(7, 2, "keto").length).toBe(ketoCatalog.length);
  });

  it("generarListaKeto es alias de keto", () => {
    const a = generarListaKeto(7, 2);
    const b = generarListaBase(7, 2, "keto");
    expect(a.map((i) => i.id)).toEqual(b.map((i) => i.id));
    expect(a[0]?.cantidad).toBe(b[0]?.cantidad);
  });
});
