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
    precio_base: 68, ingredientes: ["espresso", "leche", "lavanda"], disponible: true, etiquetas: [],
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

// ── MESAS ──
export const MOCK_MESAS = [
  { id: "mesa-1", numero: 1, capacidad: 2, estado: "disponible" as const, ubicacion: "Interior", orden_actual_id: null },
  { id: "mesa-2", numero: 2, capacidad: 4, estado: "ocupada" as const, ubicacion: "Interior", orden_actual_id: "ord-1" },
  { id: "mesa-3", numero: 3, capacidad: 4, estado: "preparando" as const, ubicacion: "Interior", orden_actual_id: "ord-2" },
  { id: "mesa-4", numero: 4, capacidad: 6, estado: "disponible" as const, ubicacion: "Terraza", orden_actual_id: null },
  { id: "mesa-5", numero: 5, capacidad: 2, estado: "reservada" as const, ubicacion: "Terraza", orden_actual_id: null },
  { id: "mesa-6", numero: 6, capacidad: 4, estado: "ocupada" as const, ubicacion: "Terraza", orden_actual_id: "ord-3" },
  { id: "mesa-7", numero: 7, capacidad: 8, estado: "disponible" as const, ubicacion: "Interior", orden_actual_id: null },
  { id: "mesa-8", numero: 8, capacidad: 2, estado: "disponible" as const, ubicacion: "Barra", orden_actual_id: null },
];

// ── ÓRDENES ──
export const MOCK_ORDENES: MockOrden[] = [
  {
    id: "ord-1", mesa_id: "mesa-2", mesa_numero: 2, usuario_nombre: "David",
    items: [
      { id: "i-1", producto_id: "prod-2", nombre: "Latte", cantidad: 2, precio_unitario: 55, tamano: "12 oz" },
      { id: "i-2", producto_id: "prod-17", nombre: "Croissant", cantidad: 1, precio_unitario: 45 },
    ],
    subtotal: 155, impuesto: 24.80, descuento: 0, propina: 0, total: 179.80,
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
    subtotal: 355, impuesto: 56.80, descuento: 0, propina: 0, total: 411.80,
    estado: "preparando", origen: "mesa", notas: "Sin cebolla en los paninis",
    creado_en: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: "ord-3", mesa_id: "mesa-6", mesa_numero: 6, usuario_nombre: "David",
    items: [
      { id: "i-6", producto_id: "prod-11", nombre: "Matcha Latte", cantidad: 1, precio_unitario: 65 },
      { id: "i-7", producto_id: "prod-18", nombre: "Pan de Chocolate", cantidad: 2, precio_unitario: 50 },
    ],
    subtotal: 165, impuesto: 26.40, descuento: 0, propina: 0, total: 191.40,
    estado: "nueva", origen: "mesa", notas: null,
    creado_en: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "ord-4", mesa_id: null, mesa_numero: null, usuario_nombre: "David",
    items: [
      { id: "i-8", producto_id: "prod-7", nombre: "Cold Brew", cantidad: 1, precio_unitario: 60, tamano: "16 oz" },
    ],
    subtotal: 75, impuesto: 12, descuento: 0, propina: 0, total: 87,
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
