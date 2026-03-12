// ── Mock data para desarrollo sin Supabase ──
// Interfaces de mock incluyen campos extra de display (mesa_numero, _count, etc.)
// que en producción se obtienen via JOINs o computed fields.

export interface MockCategoria {
  id: string;
  nombre: string;
  tipo: "drink" | "food" | "other";
  orden: number;
  activo: boolean;
  _count?: number; // computed: productos en esta categoría
}

export interface MockTamano {
  id: string;
  producto_id: string;
  nombre: string;
  precio_adicional: number;
  orden: number;
}

export interface MockProducto {
  id: string;
  categoria_id: string;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  ingredientes: string[];
  disponible: boolean;
  etiquetas: string[];
  imagen_url: string | null;
  orden: number;
  // En DB es tabla separada opciones_tamano, en mock lo embebemos por conveniencia
  tamanos?: Omit<MockTamano, "producto_id">[];
}

export interface MockItemOrden {
  id: string;
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  tamano?: string;
  notas?: string;
}

export interface MockOrden {
  id: string;
  mesa_id: string | null;
  mesa_numero: number | null; // computed via JOIN en producción
  usuario_nombre: string;     // computed via JOIN en producción
  items: MockItemOrden[];
  subtotal: number;
  impuesto: number;
  descuento: number;
  propina: number;
  total: number;
  estado: "nueva" | "confirmada" | "preparando" | "lista" | "completada" | "cancelada";
  origen: "mesa" | "delivery" | "para_llevar" | "online";
  notas: string | null;
  cliente_firebase_id?: string | null;
  creado_en: string;
}

export interface MockTicketKDS {
  id: string;
  orden_id: string;
  mesa_numero: number | null; // computed via JOIN en producción
  origen: string;             // computed via JOIN en producción
  items_kds: { nombre: string; cantidad: number; notas?: string }[];
  estado: "nueva" | "preparando" | "lista";
  prioridad: number;
  tiempo_inicio: string | null;
  tiempo_fin: string | null;
  creado_en: string;
}

// ── CATEGORÍAS ──
export const MOCK_CATEGORIAS: MockCategoria[] = [
  { id: "cat-1", nombre: "Café Caliente", tipo: "drink", orden: 0, activo: true, _count: 6 },
  { id: "cat-2", nombre: "Café Frío", tipo: "drink", orden: 1, activo: true, _count: 4 },
  { id: "cat-3", nombre: "Té & Infusiones", tipo: "drink", orden: 2, activo: true, _count: 3 },
  { id: "cat-4", nombre: "Bebidas Especiales", tipo: "drink", orden: 3, activo: true, _count: 3 },
  { id: "cat-5", nombre: "Panadería", tipo: "food", orden: 4, activo: true, _count: 5 },
  { id: "cat-6", nombre: "Alimentos", tipo: "food", orden: 5, activo: true, _count: 4 },
  { id: "cat-7", nombre: "Postres", tipo: "food", orden: 6, activo: true, _count: 3 },
  { id: "cat-8", nombre: "Extras", tipo: "other", orden: 7, activo: true, _count: 3 },
];

// ── PRODUCTOS ──
export const MOCK_PRODUCTOS: MockProducto[] = [
  // Café Caliente
  {
    id: "prod-1", categoria_id: "cat-1", nombre: "Americano", descripcion: "Espresso con agua caliente",
    precio_base: 45, ingredientes: ["espresso", "agua"], disponible: true, etiquetas: ["popular"],
    imagen_url: null, orden: 0,
    tamanos: [
      { id: "t-1", nombre: "10 oz", precio_adicional: 0, orden: 0 },
      { id: "t-2", nombre: "12 oz", precio_adicional: 10, orden: 1 },
      { id: "t-3", nombre: "16 oz", precio_adicional: 20, orden: 2 },
    ],
  },
  {
    id: "prod-2", categoria_id: "cat-1", nombre: "Latte", descripcion: "Espresso con leche vaporizada",
    precio_base: 55, ingredientes: ["espresso", "leche"], disponible: true, etiquetas: ["popular"],
    imagen_url: null, orden: 1,
    tamanos: [
      { id: "t-4", nombre: "12 oz", precio_adicional: 0, orden: 0 },
      { id: "t-5", nombre: "16 oz", precio_adicional: 15, orden: 1 },
    ],
  },
  {
    id: "prod-3", categoria_id: "cat-1", nombre: "Cappuccino", descripcion: "Espresso, leche vaporizada y espuma",
    precio_base: 55, ingredientes: ["espresso", "leche", "espuma"], disponible: true, etiquetas: [],
    imagen_url: null, orden: 2,
    tamanos: [
      { id: "t-6", nombre: "10 oz", precio_adicional: 0, orden: 0 },
      { id: "t-7", nombre: "12 oz", precio_adicional: 10, orden: 1 },
    ],
  },
  {
    id: "prod-4", categoria_id: "cat-1", nombre: "Mocha", descripcion: "Espresso con chocolate y leche",
    precio_base: 65, ingredientes: ["espresso", "chocolate", "leche"], disponible: true, etiquetas: [],
    imagen_url: null, orden: 3,
  },
  {
    id: "prod-5", categoria_id: "cat-1", nombre: "Espresso Doble", descripcion: "Doble shot de espresso",
    precio_base: 40, ingredientes: ["espresso"], disponible: true, etiquetas: [],
    imagen_url: null, orden: 4,
  },
  {
    id: "prod-6", categoria_id: "cat-1", nombre: "Cortado", descripcion: "Espresso con un toque de leche",
    precio_base: 45, ingredientes: ["espresso", "leche"], disponible: false, etiquetas: [],
    imagen_url: null, orden: 5,
  },

  // Café Frío
  {
    id: "prod-7", categoria_id: "cat-2", nombre: "Cold Brew", descripcion: "Café infusionado en frío 16h",
    precio_base: 60, ingredientes: ["café"], disponible: true, etiquetas: ["popular"],
    imagen_url: null, orden: 0,
    tamanos: [
      { id: "t-8", nombre: "12 oz", precio_adicional: 0, orden: 0 },
      { id: "t-9", nombre: "16 oz", precio_adicional: 15, orden: 1 },
    ],
  },
  {
    id: "prod-8", categoria_id: "cat-2", nombre: "Iced Latte", descripcion: "Latte frío con hielo",
    precio_base: 60, ingredientes: ["espresso", "leche", "hielo"], disponible: true, etiquetas: [],
    imagen_url: null, orden: 1,
  },
  {
    id: "prod-9", categoria_id: "cat-2", nombre: "Frappé Mocha", descripcion: "Café frío mezclado con chocolate y hielo",
    precio_base: 75, ingredientes: ["espresso", "chocolate", "leche", "hielo"], disponible: true, etiquetas: [],
    imagen_url: null, orden: 2,
  },
  {
    id: "prod-10", categoria_id: "cat-2", nombre: "Affogato", descripcion: "Helado de vainilla con espresso",
    precio_base: 70, ingredientes: ["espresso", "helado"], disponible: true, etiquetas: ["nuevo"],
    imagen_url: null, orden: 3,
  },

  // Té & Infusiones
  {
    id: "prod-11", categoria_id: "cat-3", nombre: "Matcha Latte", descripcion: "Matcha japonés con leche",
    precio_base: 65, ingredientes: ["matcha", "leche"], disponible: true, etiquetas: ["popular"],
    imagen_url: null, orden: 0,
  },
  {
    id: "prod-12", categoria_id: "cat-3", nombre: "Chai Latte", descripcion: "Té con especias y leche",
    precio_base: 55, ingredientes: ["té chai", "leche", "especias"], disponible: true, etiquetas: [],
    imagen_url: null, orden: 1,
  },
  {
    id: "prod-13", categoria_id: "cat-3", nombre: "Té Verde", descripcion: "Té verde orgánico",
    precio_base: 35, ingredientes: ["té verde"], disponible: true, etiquetas: [],
    imagen_url: null, orden: 2,
  },

  // Bebidas Especiales
  {
    id: "prod-14", categoria_id: "cat-4", nombre: "Horchata Latte", descripcion: "Latte con horchata artesanal",
    precio_base: 70, ingredientes: ["espresso", "horchata", "canela"], disponible: true, etiquetas: ["nuevo", "especial"],
    imagen_url: null, orden: 0,
  },
  {
    id: "prod-15", categoria_id: "cat-4", nombre: "Mazapán Latte", descripcion: "Latte con mazapán y canela",
    precio_base: 70, ingredientes: ["espresso", "leche", "mazapán", "canela"], disponible: true, etiquetas: ["especial"],
    imagen_url: null, orden: 1,
  },
  {
    id: "prod-16", categoria_id: "cat-4", nombre: "Lavender Latte", descripcion: "Latte con jarabe de lavanda",
    precio_base: 70, ingredientes: ["espresso", "leche", "lavanda"], disponible: true, etiquetas: [],
    imagen_url: null, orden: 2,
  },

  // Panadería
  {
    id: "prod-17", categoria_id: "cat-5", nombre: "Croissant", descripcion: "Croissant de mantequilla",
    precio_base: 45, ingredientes: ["harina", "mantequilla"], disponible: true, etiquetas: ["popular"],
    imagen_url: null, orden: 0,
  },
  {
    id: "prod-18", categoria_id: "cat-5", nombre: "Pan de Chocolate", descripcion: "Pain au chocolat",
    precio_base: 50, ingredientes: ["harina", "chocolate", "mantequilla"], disponible: true, etiquetas: [],
    imagen_url: null, orden: 1,
  },
  {
    id: "prod-19", categoria_id: "cat-5", nombre: "Muffin de Arándano", descripcion: null,
    precio_base: 40, ingredientes: ["harina", "arándano"], disponible: true, etiquetas: [],
    imagen_url: null, orden: 2,
  },
  {
    id: "prod-20", categoria_id: "cat-5", nombre: "Banana Bread", descripcion: "Rebanada de pan de plátano",
    precio_base: 45, ingredientes: ["plátano", "harina", "nuez"], disponible: true, etiquetas: [],
    imagen_url: null, orden: 3,
  },
  {
    id: "prod-21", categoria_id: "cat-5", nombre: "Galleta de Avena", descripcion: null,
    precio_base: 30, ingredientes: ["avena", "mantequilla"], disponible: false, etiquetas: [],
    imagen_url: null, orden: 4,
  },

  // Alimentos
  {
    id: "prod-22", categoria_id: "cat-6", nombre: "Panini Caprese", descripcion: "Mozzarella, tomate, albahaca y pesto",
    precio_base: 95, ingredientes: ["pan", "mozzarella", "tomate", "albahaca", "pesto"], disponible: true, etiquetas: ["popular"],
    imagen_url: null, orden: 0,
  },
  {
    id: "prod-23", categoria_id: "cat-6", nombre: "Avocado Toast", descripcion: "Pan artesanal con aguacate y huevo",
    precio_base: 85, ingredientes: ["pan", "aguacate", "huevo"], disponible: true, etiquetas: [],
    imagen_url: null, orden: 1,
  },
  {
    id: "prod-24", categoria_id: "cat-6", nombre: "Bowl de Açaí", descripcion: "Açaí con granola y fruta fresca",
    precio_base: 90, ingredientes: ["açaí", "granola", "fresa", "plátano"], disponible: true, etiquetas: ["nuevo"],
    imagen_url: null, orden: 2,
  },
  {
    id: "prod-25", categoria_id: "cat-6", nombre: "Ensalada César", descripcion: "Lechuga, pollo, crutones, parmesano",
    precio_base: 95, ingredientes: ["lechuga", "pollo", "crutones", "parmesano"], disponible: true, etiquetas: [],
    imagen_url: null, orden: 3,
  },

  // Postres
  {
    id: "prod-26", categoria_id: "cat-7", nombre: "Cheesecake", descripcion: "New York style",
    precio_base: 75, ingredientes: ["queso crema", "galleta"], disponible: true, etiquetas: ["popular"],
    imagen_url: null, orden: 0,
  },
  {
    id: "prod-27", categoria_id: "cat-7", nombre: "Brownie", descripcion: "Brownie de chocolate con nuez",
    precio_base: 55, ingredientes: ["chocolate", "nuez"], disponible: true, etiquetas: [],
    imagen_url: null, orden: 1,
  },
  {
    id: "prod-28", categoria_id: "cat-7", nombre: "Tiramisú", descripcion: "Tiramisú clásico italiano",
    precio_base: 80, ingredientes: ["mascarpone", "café", "galleta"], disponible: true, etiquetas: ["especial"],
    imagen_url: null, orden: 2,
  },

  // Extras
  {
    id: "prod-29", categoria_id: "cat-8", nombre: "Shot Extra", descripcion: "Shot adicional de espresso",
    precio_base: 15, ingredientes: ["espresso"], disponible: true, etiquetas: [],
    imagen_url: null, orden: 0,
  },
  {
    id: "prod-30", categoria_id: "cat-8", nombre: "Leche de Almendra", descripcion: "Sustituto de leche",
    precio_base: 15, ingredientes: ["almendra"], disponible: true, etiquetas: [],
    imagen_url: null, orden: 1,
  },
  {
    id: "prod-31", categoria_id: "cat-8", nombre: "Leche de Avena", descripcion: "Sustituto de leche",
    precio_base: 15, ingredientes: ["avena"], disponible: true, etiquetas: [],
    imagen_url: null, orden: 2,
  },
];

// ── ÓRDENES ──
export const MOCK_ORDENES: MockOrden[] = [
  {
    id: "ord-1", mesa_id: "mesa-2", mesa_numero: 2, usuario_nombre: "David",
    items: [
      { id: "i-1", producto_id: "prod-2", nombre: "Latte", cantidad: 2, precio_unitario: 55, tamano: "12 oz" },
      { id: "i-2", producto_id: "prod-17", nombre: "Croissant", cantidad: 1, precio_unitario: 45 },
    ],
    subtotal: 133.62, impuesto: 21.38, descuento: 0, propina: 0, total: 155,
    estado: "confirmada", origen: "mesa", notas: null,
    creado_en: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: "ord-2", mesa_id: "mesa-3", mesa_numero: 3, usuario_nombre: "David",
    items: [
      { id: "i-3", producto_id: "prod-22", nombre: "Panini Caprese", cantidad: 2, precio_unitario: 95 },
      { id: "i-4", producto_id: "prod-1", nombre: "Americano", cantidad: 2, precio_unitario: 45, tamano: "12 oz" },
      { id: "i-5", producto_id: "prod-26", nombre: "Cheesecake", cantidad: 1, precio_unitario: 75 },
    ],
    subtotal: 306.03, impuesto: 48.97, descuento: 0, propina: 0, total: 355,
    estado: "preparando", origen: "mesa", notas: "Sin cebolla en los paninis",
    creado_en: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "ord-3", mesa_id: "mesa-6", mesa_numero: 6, usuario_nombre: "David",
    items: [
      { id: "i-6", producto_id: "prod-11", nombre: "Matcha Latte", cantidad: 1, precio_unitario: 65 },
      { id: "i-7", producto_id: "prod-18", nombre: "Pan de Chocolate", cantidad: 2, precio_unitario: 50 },
    ],
    subtotal: 142.24, impuesto: 22.76, descuento: 0, propina: 0, total: 165,
    estado: "nueva", origen: "mesa", notas: null,
    creado_en: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "ord-4", mesa_id: null, mesa_numero: null, usuario_nombre: "David",
    items: [
      { id: "i-8", producto_id: "prod-7", nombre: "Cold Brew", cantidad: 1, precio_unitario: 75, tamano: "16 oz" },
    ],
    subtotal: 64.66, impuesto: 10.34, descuento: 0, propina: 0, total: 75,
    estado: "lista", origen: "para_llevar", notas: null,
    creado_en: new Date(Date.now() - 35 * 60000).toISOString(),
  },
];

// ── TICKETS KDS ──
export const MOCK_TICKETS_KDS: MockTicketKDS[] = [
  {
    id: "tk-1", orden_id: "ord-3", mesa_numero: 6, origen: "mesa",
    items_kds: [
      { nombre: "Matcha Latte", cantidad: 1 },
      { nombre: "Pan de Chocolate", cantidad: 2 },
    ],
    estado: "nueva", prioridad: 0, tiempo_inicio: null, tiempo_fin: null,
    creado_en: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "tk-2", orden_id: "ord-2", mesa_numero: 3, origen: "mesa",
    items_kds: [
      { nombre: "Panini Caprese", cantidad: 2, notas: "Sin cebolla" },
      { nombre: "Cheesecake", cantidad: 1 },
    ],
    estado: "preparando", prioridad: 1, tiempo_inicio: new Date(Date.now() - 10 * 60000).toISOString(), tiempo_fin: null,
    creado_en: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "tk-3", orden_id: "ord-2", mesa_numero: 3, origen: "mesa",
    items_kds: [
      { nombre: "Americano 12oz", cantidad: 2 },
    ],
    estado: "preparando", prioridad: 0, tiempo_inicio: new Date(Date.now() - 12 * 60000).toISOString(), tiempo_fin: null,
    creado_en: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "tk-4", orden_id: "ord-1", mesa_numero: 2, origen: "mesa",
    items_kds: [
      { nombre: "Latte 12oz", cantidad: 2 },
      { nombre: "Croissant", cantidad: 1 },
    ],
    estado: "lista", prioridad: 0,
    tiempo_inicio: new Date(Date.now() - 20 * 60000).toISOString(),
    tiempo_fin: new Date(Date.now() - 2 * 60000).toISOString(),
    creado_en: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: "tk-5", orden_id: "ord-4", mesa_numero: null, origen: "para_llevar",
    items_kds: [
      { nombre: "Cold Brew 16oz", cantidad: 1 },
    ],
    estado: "lista", prioridad: 0,
    tiempo_inicio: new Date(Date.now() - 30 * 60000).toISOString(),
    tiempo_fin: new Date(Date.now() - 1 * 60000).toISOString(),
    creado_en: new Date(Date.now() - 35 * 60000).toISOString(),
  },
];

// ── REPORTES ──

export interface MockStatReporte {
  ventasHoy: number;
  ventasAyer: number;
  ordenesHoy: number;
  ordenesAyer: number;
  ticketPromedio: number;
  ticketPromedioAyer: number;
  clientesHoy: number;
  clientesAyer: number;
  tiempoPromedioPrep: number;
}

export interface MockVentasDia {
  dia: string;
  ventas: number;
  ordenes: number;
}

export interface MockVentasHora {
  hora: string;
  ventas: number;
}

export interface MockProductoTop {
  nombre: string;
  cantidad: number;
  ingresos: number;
}

export interface MockMetodoPago {
  metodo: string;
  porcentaje: number;
  monto: number;
}

export const MOCK_STATS_REPORTES: MockStatReporte = {
  ventasHoy: 8_450.60,
  ventasAyer: 7_230.40,
  ordenesHoy: 42,
  ordenesAyer: 38,
  ticketPromedio: 201.20,
  ticketPromedioAyer: 190.27,
  clientesHoy: 35,
  clientesAyer: 31,
  tiempoPromedioPrep: 8.5,
};

export const MOCK_VENTAS_SEMANA: MockVentasDia[] = [
  { dia: "Lun", ventas: 6_200, ordenes: 32 },
  { dia: "Mar", ventas: 5_800, ordenes: 28 },
  { dia: "Mié", ventas: 7_100, ordenes: 36 },
  { dia: "Jue", ventas: 6_900, ordenes: 34 },
  { dia: "Vie", ventas: 9_200, ordenes: 48 },
  { dia: "Sáb", ventas: 11_500, ordenes: 58 },
  { dia: "Dom", ventas: 8_450, ordenes: 42 },
];

export const MOCK_VENTAS_HORA: MockVentasHora[] = [
  { hora: "8am", ventas: 420 },
  { hora: "9am", ventas: 890 },
  { hora: "10am", ventas: 1_200 },
  { hora: "11am", ventas: 980 },
  { hora: "12pm", ventas: 1_450 },
  { hora: "1pm", ventas: 1_680 },
  { hora: "2pm", ventas: 1_320 },
  { hora: "3pm", ventas: 780 },
  { hora: "4pm", ventas: 650 },
  { hora: "5pm", ventas: 520 },
  { hora: "6pm", ventas: 380 },
  { hora: "7pm", ventas: 180 },
];

export const MOCK_TOP_PRODUCTOS: MockProductoTop[] = [
  { nombre: "Americano", cantidad: 68, ingresos: 3_060 },
  { nombre: "Latte", cantidad: 54, ingresos: 2_970 },
  { nombre: "Croissant", cantidad: 42, ingresos: 1_890 },
  { nombre: "Cold Brew", cantidad: 38, ingresos: 2_280 },
  { nombre: "Panini Caprese", cantidad: 28, ingresos: 2_660 },
  { nombre: "Matcha Latte", cantidad: 24, ingresos: 1_560 },
  { nombre: "Cheesecake", cantidad: 22, ingresos: 1_650 },
  { nombre: "Cappuccino", cantidad: 20, ingresos: 1_100 },
];

export const MOCK_METODOS_PAGO: MockMetodoPago[] = [
  { metodo: "Efectivo", porcentaje: 42, monto: 23_540 },
  { metodo: "Tarjeta", porcentaje: 45, monto: 25_220 },
  { metodo: "Transferencia", porcentaje: 13, monto: 7_290 },
];

// ── FIDELIDAD ──

export interface MockCliente {
  id: string;
  nombre: string;
  telefono: string;
  puntos: number;
  nivel: "bronce" | "plata" | "oro";
  visitas: number;
  gasto_total: number;
  ultima_visita: string;
  miembro_desde: string;
}

export interface MockRecompensa {
  nombre: string;
  puntos: number;
  icon: string;
}

export interface MockStatFidelidad {
  totalClientes: number;
  clientesActivos: number;
  puntosEmitidos: number;
  canjesEsteMes: number;
}

export const MOCK_CLIENTES: MockCliente[] = [
  { id: "c-1", nombre: "Sofía Ramírez", telefono: "771-123-4567", puntos: 1250, nivel: "oro", visitas: 48, gasto_total: 12_400, ultima_visita: new Date(Date.now() - 1 * 86400000).toISOString(), miembro_desde: "2024-06-15" },
  { id: "c-2", nombre: "Miguel Torres", telefono: "771-234-5678", puntos: 680, nivel: "plata", visitas: 25, gasto_total: 6_800, ultima_visita: new Date(Date.now() - 3 * 86400000).toISOString(), miembro_desde: "2024-09-01" },
  { id: "c-3", nombre: "Valentina Cruz", telefono: "771-345-6789", puntos: 320, nivel: "bronce", visitas: 12, gasto_total: 3_200, ultima_visita: new Date(Date.now() - 7 * 86400000).toISOString(), miembro_desde: "2025-01-10" },
  { id: "c-4", nombre: "Andrés Vega", telefono: "771-456-7890", puntos: 890, nivel: "plata", visitas: 32, gasto_total: 8_900, ultima_visita: new Date(Date.now() - 2 * 86400000).toISOString(), miembro_desde: "2024-08-20" },
  { id: "c-5", nombre: "Camila Herrera", telefono: "771-567-8901", puntos: 2100, nivel: "oro", visitas: 72, gasto_total: 21_000, ultima_visita: new Date(Date.now() - 0.5 * 86400000).toISOString(), miembro_desde: "2024-03-01" },
  { id: "c-6", nombre: "Diego Morales", telefono: "771-678-9012", puntos: 150, nivel: "bronce", visitas: 6, gasto_total: 1_500, ultima_visita: new Date(Date.now() - 14 * 86400000).toISOString(), miembro_desde: "2025-02-01" },
];

export const MOCK_RECOMPENSAS: MockRecompensa[] = [
  { nombre: "Café gratis", puntos: 200, icon: "☕" },
  { nombre: "Postre gratis", puntos: 400, icon: "🍰" },
  { nombre: "10% descuento", puntos: 150, icon: "%" },
];

export const MOCK_STATS_FIDELIDAD: MockStatFidelidad = {
  totalClientes: 142,
  clientesActivos: 89,
  puntosEmitidos: 45_200,
  canjesEsteMes: 23,
};

// ── INVENTARIO ──

export interface MockInventario {
  id: string;
  negocio_id: string;
  nombre: string;
  unidad: string; // kg, lt, pz, etc.
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
  proveedor?: string | null;
  descripcion?: string | null;
  notas?: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface MockMovimientoInventario {
  id: string;
  inventario_id: string;
  tipo: "entrada" | "salida" | "ajuste";
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  referencia?: string | null; // orden_id, folio, etc.
  motivo?: string | null;
  notas?: string | null;
  usuario_id: string;
  creado_en: string;
}

export interface MockReceta {
  id: string;
  producto_id: string;
  ingrediente_id: string;
  cantidad: number;
  unidad: string;
  notas?: string | null;
}

export const MOCK_INVENTARIO: MockInventario[] = [
  {
    id: "inv-1",
    negocio_id: "dev-negocio-1",
    nombre: "Café grano premium",
    unidad: "kg",
    stock_actual: 5,
    stock_minimo: 2,
    costo_unitario: 450,
    proveedor: "Cafés de Altura",
    descripcion: "Almacén A - Estante 1",
    notas: "100% Arábica, tostado medio",
    activo: true,
    creado_en: new Date(Date.now() - 30 * 86400000).toISOString(),
    actualizado_en: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "inv-2",
    negocio_id: "dev-negocio-1",
    nombre: "Leche entera",
    unidad: "lt",
    stock_actual: 20,
    stock_minimo: 8,
    costo_unitario: 28,
    proveedor: "Lechería Local",
    descripcion: "Refrigerador A",
    notas: "Fresca, entrega diaria",
    activo: true,
    creado_en: new Date(Date.now() - 30 * 86400000).toISOString(),
    actualizado_en: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "inv-3",
    negocio_id: "dev-negocio-1",
    nombre: "Leche deslactosada",
    unidad: "lt",
    stock_actual: 8,
    stock_minimo: 4,
    costo_unitario: 35,
    proveedor: "Lechería Local",
    descripcion: "Refrigerador A",
    activo: true,
    creado_en: new Date(Date.now() - 30 * 86400000).toISOString(),
    actualizado_en: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: "inv-4",
    negocio_id: "dev-negocio-1",
    nombre: "Leche de almendra",
    unidad: "lt",
    stock_actual: 3,
    stock_minimo: 2,
    costo_unitario: 65,
    proveedor: "Distribuidora Premium",
    descripcion: "Refrigerador B",
    activo: true,
    creado_en: new Date(Date.now() - 30 * 86400000).toISOString(),
    actualizado_en: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: "inv-5",
    negocio_id: "dev-negocio-1",
    nombre: "Chocolate en polvo",
    unidad: "kg",
    stock_actual: 2,
    stock_minimo: 1,
    costo_unitario: 180,
    proveedor: "Distribuidora Gourmet",
    descripcion: "Almacén A - Estante 2",
    notas: "Cacao 100%, sin azúcar añadida",
    activo: true,
    creado_en: new Date(Date.now() - 30 * 86400000).toISOString(),
    actualizado_en: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "inv-6",
    negocio_id: "dev-negocio-1",
    nombre: "Azúcar",
    unidad: "kg",
    stock_actual: 4,
    stock_minimo: 2,
    costo_unitario: 35,
    proveedor: "Mayorista Local",
    descripcion: "Almacén A - Estante 3",
    activo: true,
    creado_en: new Date(Date.now() - 30 * 86400000).toISOString(),
    actualizado_en: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "inv-7",
    negocio_id: "dev-negocio-1",
    nombre: "Vainilla",
    unidad: "lt",
    stock_actual: 0.5,
    stock_minimo: 0.3,
    costo_unitario: 280,
    proveedor: "Distribuidora Premium",
    descripcion: "Almacén A - Estante 2",
    notas: "Extracto puro de vainilla",
    activo: true,
    creado_en: new Date(Date.now() - 30 * 86400000).toISOString(),
    actualizado_en: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "inv-8",
    negocio_id: "dev-negocio-1",
    nombre: "Vasos desechables 12oz",
    unidad: "pz",
    stock_actual: 150,
    stock_minimo: 50,
    costo_unitario: 2.5,
    proveedor: "Empaque Plus",
    descripcion: "Almacén B",
    activo: true,
    creado_en: new Date(Date.now() - 30 * 86400000).toISOString(),
    actualizado_en: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "inv-9",
    negocio_id: "dev-negocio-1",
    nombre: "Tapas desechables",
    unidad: "pz",
    stock_actual: 120,
    stock_minimo: 50,
    costo_unitario: 1.8,
    proveedor: "Empaque Plus",
    descripcion: "Almacén B",
    activo: true,
    creado_en: new Date(Date.now() - 30 * 86400000).toISOString(),
    actualizado_en: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: "inv-10",
    negocio_id: "dev-negocio-1",
    nombre: "Servilletas",
    unidad: "pz",
    stock_actual: 500,
    stock_minimo: 200,
    costo_unitario: 0.3,
    proveedor: "Mayorista Local",
    descripcion: "Almacén B",
    activo: true,
    creado_en: new Date(Date.now() - 30 * 86400000).toISOString(),
    actualizado_en: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
];

export const MOCK_MOVIMIENTOS: MockMovimientoInventario[] = [
  {
    id: "mov-1",
    inventario_id: "inv-1",
    tipo: "entrada",
    cantidad: 10,
    stock_anterior: -5,
    stock_nuevo: 5,
    referencia: "Compra OP-2026-0301",
    motivo: null,
    notas: "Recibido de Cafés de Altura",
    usuario_id: "user-admin-1",
    creado_en: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "mov-2",
    inventario_id: "inv-2",
    tipo: "salida",
    cantidad: 12,
    stock_anterior: 32,
    stock_nuevo: 20,
    referencia: "ord-2",
    motivo: null,
    notas: "Consumo día",
    usuario_id: "user-admin-1",
    creado_en: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: "mov-3",
    inventario_id: "inv-5",
    tipo: "ajuste",
    cantidad: -0.5,
    stock_anterior: 2.5,
    stock_nuevo: 2,
    referencia: null,
    motivo: "merma",
    notas: "Desperdicio durante preparación",
    usuario_id: "user-admin-1",
    creado_en: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: "mov-4",
    inventario_id: "inv-3",
    tipo: "entrada",
    cantidad: 4,
    stock_anterior: 4,
    stock_nuevo: 8,
    referencia: "Compra OP-2026-0310",
    motivo: null,
    notas: "Reorden semanal",
    usuario_id: "user-admin-1",
    creado_en: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: "mov-5",
    inventario_id: "inv-8",
    tipo: "salida",
    cantidad: 30,
    stock_anterior: 180,
    stock_nuevo: 150,
    referencia: null,
    motivo: null,
    notas: "Consumo de la mañana",
    usuario_id: "user-admin-1",
    creado_en: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: "mov-6",
    inventario_id: "inv-6",
    tipo: "entrada",
    cantidad: 2,
    stock_anterior: 2,
    stock_nuevo: 4,
    referencia: "Compra OP-2026-0305",
    motivo: null,
    notas: "Repuesto semanal",
    usuario_id: "user-admin-1",
    creado_en: new Date(Date.now() - 18 * 3600000).toISOString(),
  },
];

export const MOCK_RECETAS: MockReceta[] = [
  {
    id: "rec-1",
    producto_id: "prod-1", // Americano
    ingrediente_id: "inv-1", // Café grano premium
    cantidad: 18,
    unidad: "g",
    notas: "Dos shots de espresso",
  },
  {
    id: "rec-2",
    producto_id: "prod-2", // Latte
    ingrediente_id: "inv-1", // Café grano premium
    cantidad: 18,
    unidad: "g",
    notas: null,
  },
  {
    id: "rec-3",
    producto_id: "prod-2", // Latte
    ingrediente_id: "inv-2", // Leche entera
    cantidad: 200,
    unidad: "ml",
    notas: "Vaporizada",
  },
  {
    id: "rec-4",
    producto_id: "prod-3", // Cappuccino
    ingrediente_id: "inv-1", // Café grano premium
    cantidad: 18,
    unidad: "g",
    notas: null,
  },
  {
    id: "rec-5",
    producto_id: "prod-3", // Cappuccino
    ingrediente_id: "inv-2", // Leche entera
    cantidad: 150,
    unidad: "ml",
    notas: "Con espuma",
  },
  {
    id: "rec-6",
    producto_id: "prod-4", // Mocha
    ingrediente_id: "inv-1", // Café grano premium
    cantidad: 18,
    unidad: "g",
    notas: null,
  },
  {
    id: "rec-7",
    producto_id: "prod-4", // Mocha
    ingrediente_id: "inv-2", // Leche entera
    cantidad: 150,
    unidad: "ml",
    notas: null,
  },
  {
    id: "rec-8",
    producto_id: "prod-4", // Mocha
    ingrediente_id: "inv-5", // Chocolate en polvo
    cantidad: 20,
    unidad: "g",
    notas: null,
  },
];
