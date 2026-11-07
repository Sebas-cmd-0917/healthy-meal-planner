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

/** Días de la semana actual, de lunes a domingo. */
export function currentWeek(today = new Date()) {
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
