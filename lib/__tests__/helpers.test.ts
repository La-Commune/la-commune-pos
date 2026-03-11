import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getInitials,
  formatOrigen,
  tiempoTranscurrido,
  tiempoPreparacion,
  timerColor,
  esUrgente,
  formatNombreUsuario,
  proximoNivel,
  getNivelPorPuntos,
  getNivelConfig,
  getCatColor,
} from "../helpers";

describe("getInitials", () => {
  it("extrae iniciales de nombre completo", () => {
    expect(getInitials("David López")).toBe("DL");
  });

  it("extrae inicial de nombre simple", () => {
    expect(getInitials("María")).toBe("M");
  });

  it("maneja tres nombres", () => {
    expect(getInitials("Juan Carlos Pérez")).toBe("JCP");
  });
});

describe("formatOrigen", () => {
  it("formatea 'mesa' a 'Mesa'", () => {
    expect(formatOrigen("mesa")).toBe("Mesa");
  });

  it("formatea 'para_llevar' a 'Para llevar'", () => {
    expect(formatOrigen("para_llevar")).toBe("Para llevar");
  });

  it("formatea 'delivery' a 'Delivery'", () => {
    expect(formatOrigen("delivery")).toBe("Delivery");
  });

  it("retorna el valor original si no se reconoce", () => {
    expect(formatOrigen("desconocido")).toBe("desconocido");
  });
});

describe("tiempoTranscurrido", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retorna 'ahora' para menos de 1 minuto", () => {
    const now = new Date("2026-03-11T12:00:00Z");
    vi.setSystemTime(now);
    expect(tiempoTranscurrido("2026-03-11T12:00:00Z")).toBe("ahora");
  });

  it("retorna minutos para menos de 1 hora", () => {
    const now = new Date("2026-03-11T12:30:00Z");
    vi.setSystemTime(now);
    expect(tiempoTranscurrido("2026-03-11T12:00:00Z")).toBe("30m");
  });

  it("retorna horas y minutos para más de 1 hora", () => {
    const now = new Date("2026-03-11T13:30:00Z");
    vi.setSystemTime(now);
    expect(tiempoTranscurrido("2026-03-11T12:00:00Z")).toBe("1h 30m");
  });
});

describe("tiempoPreparacion", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retorna null si inicio es null", () => {
    expect(tiempoPreparacion(null, null)).toBe(null);
  });

  it("calcula minutos entre inicio y fin", () => {
    expect(
      tiempoPreparacion("2026-03-11T12:00:00Z", "2026-03-11T12:15:00Z")
    ).toBe(15);
  });

  it("usa Date.now() si fin es null", () => {
    vi.setSystemTime(new Date("2026-03-11T12:10:00Z"));
    expect(tiempoPreparacion("2026-03-11T12:00:00Z", null)).toBe(10);
  });
});

describe("timerColor", () => {
  it("retorna color tenue para null", () => {
    expect(timerColor(null)).toBe("text-text-25");
  });

  it("retorna verde para <= 5 minutos", () => {
    expect(timerColor(3)).toBe("text-status-ok");
    expect(timerColor(5)).toBe("text-status-ok");
  });

  it("retorna naranja para 6-10 minutos", () => {
    expect(timerColor(6)).toBe("text-status-warn");
    expect(timerColor(10)).toBe("text-status-warn");
  });

  it("retorna rojo para > 10 minutos", () => {
    expect(timerColor(11)).toBe("text-status-err");
    expect(timerColor(30)).toBe("text-status-err");
  });
});

describe("esUrgente", () => {
  it("es urgente si estado=preparando y >10 min", () => {
    expect(esUrgente("preparando", 15)).toBe(true);
  });

  it("no es urgente si estado no es preparando", () => {
    expect(esUrgente("lista", 15)).toBe(false);
  });

  it("no es urgente si tiempo <= 10", () => {
    expect(esUrgente("preparando", 10)).toBe(false);
  });

  it("no es urgente si tiempo es null", () => {
    expect(esUrgente("preparando", null)).toBe(false);
  });
});

describe("formatNombreUsuario", () => {
  it("capitaliza cada palabra", () => {
    expect(formatNombreUsuario("david lópez")).toBe("David López");
  });

  it("maneja nombre en mayúsculas", () => {
    expect(formatNombreUsuario("MARÍA GARCÍA")).toBe("María García");
  });
});

describe("proximoNivel", () => {
  it("retorna plata si está en bronce", () => {
    expect(proximoNivel("bronce")).toEqual({
      nivel: "plata",
      puntosFaltantes: 500,
    });
  });

  it("retorna oro si está en plata", () => {
    expect(proximoNivel("plata")).toEqual({
      nivel: "oro",
      puntosFaltantes: 1000,
    });
  });

  it("retorna null si ya está en oro", () => {
    expect(proximoNivel("oro")).toBe(null);
  });
});

describe("getNivelPorPuntos", () => {
  it("retorna bronce para < 500 puntos", () => {
    expect(getNivelPorPuntos(0)).toBe("bronce");
    expect(getNivelPorPuntos(499)).toBe("bronce");
  });

  it("retorna plata para 500-999 puntos", () => {
    expect(getNivelPorPuntos(500)).toBe("plata");
    expect(getNivelPorPuntos(999)).toBe("plata");
  });

  it("retorna oro para >= 1000 puntos", () => {
    expect(getNivelPorPuntos(1000)).toBe("oro");
    expect(getNivelPorPuntos(5000)).toBe("oro");
  });
});

describe("getNivelConfig", () => {
  it("retorna config de bronce", () => {
    const config = getNivelConfig("bronce");
    expect(config.label).toBe("Bronce");
  });

  it("retorna config de oro", () => {
    const config = getNivelConfig("oro");
    expect(config.label).toBe("Oro");
  });

  it("retorna bronce por defecto para nivel desconocido", () => {
    const config = getNivelConfig("desconocido");
    expect(config.label).toBe("Bronce");
  });
});

describe("getCatColor", () => {
  it("retorna variable CSS de categoría", () => {
    expect(getCatColor(0)).toBe("var(--cat-1)");
    expect(getCatColor(7)).toBe("var(--cat-8)");
  });

  it("cicla si hay más de 8 categorías", () => {
    expect(getCatColor(8)).toBe("var(--cat-1)");
    expect(getCatColor(15)).toBe("var(--cat-8)");
  });
});
