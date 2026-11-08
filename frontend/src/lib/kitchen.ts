import type { BlockKind, ExpenseCategory, ISODate, Recipe, ScheduleBlock } from '@/types/api';

/** Colores de imán: cada uno codifica una categoría de ingrediente, un tipo de comida o de bloque. */
export type Magnet = 'hoja' | 'tomate' | 'arandano' | 'limon';

export type IngredientCategory = 'fresco' | 'proteina' | 'lacteo' | 'despensa';
export type MealId = 'desayuno' | 'almuerzo' | 'cena';

interface Option<Id extends string> {
  id: Id;
  label: string;
}
interface MagnetOption<Id extends string> extends Option<Id> {
  magnet: Magnet;
}

export const CATEGORIES: MagnetOption<IngredientCategory>[] = [
  { id: 'fresco', label: 'Frutas y verduras', magnet: 'hoja' },
  { id: 'proteina', label: 'Proteínas', magnet: 'tomate' },
  { id: 'lacteo', label: 'Lácteos', magnet: 'arandano' },
  { id: 'despensa', label: 'Despensa', magnet: 'limon' },
];

// Tipos de bloque de la agenda; el color de imán los distingue en toda la app
export const KINDS: MagnetOption<BlockKind>[] = [
  { id: 'trabajo', label: 'Trabajo', magnet: 'arandano' },
  { id: 'gym', label: 'Gym', magnet: 'hoja' },
  { id: 'comida', label: 'Comida', magnet: 'tomate' },
  { id: 'otro', label: 'Otro', magnet: 'limon' },
];
export const kindById = (id: BlockKind): MagnetOption<BlockKind> => KINDS.find((k) => k.id === id) ?? KINDS[3]!;

export const MEALS: MagnetOption<MealId>[] = [
  { id: 'desayuno', label: 'Desayuno', magnet: 'limon' },
  { id: 'almuerzo', label: 'Almuerzo', magnet: 'tomate' },
  { id: 'cena', label: 'Cena', magnet: 'arandano' },
];

const KEYWORDS: Record<Exclude<IngredientCategory, 'fresco'>, string[]> = {
  proteina: ['pollo', 'carne', 'res', 'cerdo', 'pescado', 'atún', 'atun', 'huevo', 'frijol', 'lenteja', 'garbanzo', 'tofu', 'salmón', 'salmon', 'camarón', 'camaron', 'pavo'],
  lacteo: ['leche', 'queso', 'yogur', 'yogurt', 'kumis', 'mantequilla', 'crema', 'cuajada', 'kéfir', 'kefir'],
  despensa: ['arroz', 'pasta', 'avena', 'pan', 'harina', 'arepa', 'quinoa', 'aceite', 'azúcar', 'azucar', 'sal', 'café', 'cafe', 'maíz', 'maiz', 'galleta', 'panela'],
};

/** Adivina la categoría por palabras clave; si no sabe, la trata como fresco. */
export function guessCategory(name: string): IngredientCategory {
  const n = name.toLowerCase();
  for (const [category, words] of Object.entries(KEYWORDS) as [IngredientCategory, string[]][]) {
    if (words.some((w) => n.includes(w))) return category;
  }
  return 'fresco';
}

export const categoryById = (id: IngredientCategory) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0]!;

/** La comida de una receta se guarda como tag (desayuno/almuerzo/cena). */
export const mealOfRecipe = (recipe: Pick<Recipe, 'tags'>) => MEALS.find((m) => recipe.tags.includes(m.id)) ?? null;

const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d: Date): ISODate => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Lunes de la semana que contiene `date`, a las 00:00 locales. */
export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Los 7 días (lunes a domingo) de la semana que empieza en `start`. */
export const weekDays = (start: Date): Date[] => Array.from({ length: 7 }, (_, i) => addDays(start, i));

/** ¿Está pasando ahora? (bloque de hoy y la hora actual entre inicio y fin) */
export function isNow(block: Pick<ScheduleBlock, 'date' | 'start' | 'end'>, now: Date = new Date()): boolean {
  if (block.date !== dayKey(now)) return false;
  const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return block.start <= hhmm && hhmm < block.end;
}

export const EXPENSE_CATEGORIES: Option<ExpenseCategory>[] = [
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
export const expenseCategoryLabel = (id: ExpenseCategory): string =>
  EXPENSE_CATEGORIES.find((c) => c.id === id)?.label ?? id;

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
export const formatCOP = (n: number): string => cop.format(n);

/** 90 → "1:30", 45 → "0:45" */
export const formatRest = (seconds: number | null): string =>
  seconds == null ? '' : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** Fecha local en formato AAAA-MM-DD a Date (sin saltos de zona horaria). */
export const parseDay = (key: ISODate): Date => {
  const [y = 1970, m = 1, d = 1] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};
