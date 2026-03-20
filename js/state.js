// ═══════════════════════════════════════════════
//  STATE — Глобальный стейт и персистентность
// ═══════════════════════════════════════════════
import { STORAGE_KEY } from './config.js';

// Глобальный стейт приложения
export const state = {
  pets: [],
  events: [],          // события журнала
  litters: [],         // помёты
  selectedId: null,
  editingId: null,
  breedingPetId: null,
  selectedLitterId: null, // выбранный помёт в блоке «Пометы»
  filter: 'all',
  search: '',
  lang: 'ru',
  settings: {
    calendarTodayStyle: 'vignette', // 'dot' | 'galaxy' | 'vignette'
    theme: 'stellar',               // 'stellar' | 'dark' | 'light'
  },
};

// Загрузить дефолтных питомцев через fetch
async function loadDefaults() {
  try {
    const res = await fetch('./data/defaults.json');
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    return data.pets || [];
  } catch {
    // Fallback — пустой массив, если fetch недоступен (file://)
    return [];
  }
}

// Загрузить стейт из localStorage (или дефолтные данные)
export async function loadState() {
  try {
    const ls = localStorage.getItem(STORAGE_KEY);
    if (ls) {
      // Ключ есть — загружаем сохранённые данные как есть (даже если питомцев 0)
      // Пустой массив = намеренный сброс, дефолты не подгружать
      const parsed = JSON.parse(ls);
      state.pets     = parsed.pets    || [];
      state.events   = parsed.events  || [];
      state.litters  = parsed.litters || [];
      state.lang     = parsed.lang    || 'ru';
      state.settings = { calendarTodayStyle: 'vignette', theme: 'stellar', ...(parsed.settings || {}) };
    } else {
      // Первый визит — ключа нет совсем, грузим дефолты
      state.pets = await loadDefaults();
    }
  } catch {
    state.pets = await loadDefaults();
  }
}

// Сохранить стейт в localStorage
export function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      pets:     state.pets,
      events:   state.events,
      litters:  state.litters,
      lang:     state.lang,
      settings: state.settings,
    }));
  } catch (e) {
    console.error('localStorage недоступен:', e);
  }
}

// Экспорт данных в JSON-файл
export function exportJSON() {
  try {
    const blob = new Blob(
      [JSON.stringify({ pets: state.pets }, null, 2)],
      { type: 'application/json' }
    );
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'maincoon-stellar-data.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } catch (e) {
    console.error('Ошибка экспорта:', e);
  }
}

// Импорт данных из JSON-файла
export function importJSON(file, onSuccess, onError) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.pets && Array.isArray(data.pets)) {
        state.pets = data.pets;
        saveState();
        onSuccess?.();
      } else {
        onError?.('Неверный формат файла');
      }
    } catch {
      onError?.('Ошибка чтения файла');
    }
  };
  reader.readAsText(file);
}
