// Monochrome Warm v3 — design tokens para uso programático
// Los CSS vars están en globals.css; esto es para JS cuando necesites valores raw

export const theme = {
  surfaces: {
    0: "#0C0B09",
    1: "#13120F",
    2: "#1A1915",
    3: "#23221D",
    4: "#2D2C26",
  },
  text: {
    100: "#EDE8DF",
    70: "#A8A196",
    45: "#6B665D",
    25: "#3F3B35",
  },
  accent: {
    DEFAULT: "#A89680",
    soft: "rgba(168,150,128,0.10)",
    mid: "rgba(168,150,128,0.18)",
  },
  status: {
    ok: "#6B9B74",
    warn: "#B09A5C",
    err: "#A86060",
    info: "#6888A0",
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
  },
} as const;
