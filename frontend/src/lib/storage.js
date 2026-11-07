// localStorage puede no existir o fallar (modo privado, cuota): nunca romper la app por eso.
export function loadJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* sin persistencia: se mantiene en memoria */
  }
}
