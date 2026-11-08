// Colores de imán: cada uno codifica una categoría de ingrediente o un tipo de comida.
export const MAGNETS = {
  hoja: 'hoja',
  tomate: 'tomate',
  arandano: 'arandano',
  limon: 'limon',
};

export const CATEGORIES = [
  { id: 'fresco', label: 'Frutas y verduras', magnet: MAGNETS.hoja },
  { id: 'proteina', label: 'Proteínas', magnet: MAGNETS.tomate },
  { id: 'lacteo', label: 'Lácteos', magnet: MAGNETS.arandano },
  { id: 'despensa', label: 'Despensa', magnet: MAGNETS.limon },
];

// Tipos de bloque de la agenda; el color de imán los distingue en toda la app
export const KINDS = [
  { id: 'trabajo', label: 'Trabajo', magnet: MAGNETS.arandano },
  { id: 'gym', label: 'Gym', magnet: MAGNETS.hoja },
  { id: 'comida', label: 'Comida', magnet: MAGNETS.tomate },
  { id: 'otro', label: 'Otro', magnet: MAGNETS.limon },
];
export const kindById = (id) => KINDS.find((k) => k.id === id) ?? KINDS[3];

export const MEALS = [
  { id: 'desayuno', label: 'Desayuno', magnet: MAGNETS.limon },
  { id: 'almuerzo', label: 'Almuerzo', magnet: MAGNETS.tomate },
  { id: 'cena', label: 'Cena', magnet: MAGNETS.arandano },
];

const KEYWORDS = {
  proteina: ['pollo', 'carne', 'res', 'cerdo', 'pescado', 'atún', 'atun', 'huevo', 'frijol', 'lenteja', 'garbanzo', 'tofu', 'salmón', 'salmon', 'camarón', 'camaron', 'pavo'],
  lacteo: ['leche', 'queso', 'yogur', 'yogurt', 'kumis', 'mantequilla', 'crema', 'cuajada', 'kéfir', 'kefir'],
  despensa: ['arroz', 'pasta', 'avena', 'pan', 'harina', 'arepa', 'quinoa', 'aceite', 'azúcar', 'azucar', 'sal', 'café', 'cafe', 'maíz', 'maiz', 'galleta', 'panela'],
};

/** Adivina la categoría por palabras clave; si no sabe, la trata como fresco. */
export function guessCategory(name) {
  const n = name.toLowerCase();
  for (const [category, words] of Object.entries(KEYWORDS)) {
    if (words.some((w) => n.includes(w))) return category;
  }
  return 'fresco';
}

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
export const mealById = (id) => MEALS.find((m) => m.id === id) ?? null;

/** La comida de una receta se guarda como tag (desayuno/almuerzo/cena). */
export const mealOfRecipe = (recipe) => MEALS.find((m) => recipe?.tags?.includes(m.id)) ?? null;

const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Lunes de la semana que contiene `date`, a las 00:00 locales. */
export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Los 7 días (lunes a domingo) de la semana que empieza en `start`. */
export const weekDays = (start) => Array.from({ length: 7 }, (_, i) => addDays(start, i));

/** ¿Está pasando ahora? (bloque de hoy y la hora actual entre inicio y fin) */
export function isNow(block, now = new Date()) {
  if (block.date !== dayKey(now)) return false;
  const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return block.start <= hhmm && hhmm < block.end;
}

export const EXPENSE_CATEGORIES = [
  { id: 'comida', label: 'Comida fuera' },
  { id: 'mercado', label: 'Mercado' },
  { id: 'transporte', label: 'Transporte' },
  { id: 'hogar', label: 'Hogar' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'salud', label: 'Salud' },
  { id: 'entretenimiento', label: 'Entretenimiento' },
  { id: 'compras', label: 'Compras' },
  { id: 'otros', label: 'Otros' },
];
export const expenseCategoryLabel = (id) => EXPENSE_CATEGORIES.find((c) => c.id === id)?.label ?? id;

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
export const formatCOP = (n) => cop.format(n);

/** 90 → "1:30", 45 → "0:45" */
export const formatRest = (seconds) =>
  seconds == null ? '' : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** Fecha local en formato YYYY-MM-DD a Date (sin saltos de zona horaria). */
export const parseDay = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};
