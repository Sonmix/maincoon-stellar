// ═══════════════════════════════════════════════
//  DEBUG — Логирование всех действий в консоль
//  Подключается в main.js через initDebug()
// ═══════════════════════════════════════════════

const PREFIX = '%c[Stellar]';
const STYLES = {
  default:  'color:#3fd2ff;font-weight:700',
  event:    'color:#28d98a;font-weight:700',
  warning:  'color:#ff8c42;font-weight:700',
  error:    'color:#ff4466;font-weight:700',
  state:    'color:#8a4fff;font-weight:700',
  nav:      'color:#e8eeff;font-weight:700',
};

function log(style, ...args) {
  console.log(PREFIX, STYLES[style] || STYLES.default, ...args);
}

// ── Перехват tabchange ──
function watchNavigation() {
  document.addEventListener('tabchange', e => {
    log('nav', `Tab → "${e.detail.tab}"`);
  });
}

// ── Перехват сохранения состояния ──
function watchState(stateRef) {
  const origSave = window._debugOrigSave;
  if (!origSave) return;
  // saveState патчится в initDebug после импорта
}

// ── Логирование событий журнала (добавление/удаление) ──
export function debugLogEventAdded(event) {
  log('event', `Событие ДОБАВЛЕНО:`, {
    id:   event.id,
    type: event.type,
    date: event.date,
    petId: event.petId,
    customLabel: event.customLabel || '—',
  });
}

export function debugLogEventDeleted(eventId, date) {
  log('warning', `Событие УДАЛЕНО: id="${eventId}", date="${date}"`);
}

export function debugLogEventsState(events) {
  if (!events || events.length === 0) {
    log('state', 'state.events: [] (пусто)');
    return;
  }
  log('state', `state.events [${events.length}]:`, events.map(e => ({
    id:   e.id,
    type: e.type,
    date: e.date,
    petId: e.petId || null,
  })));
}

// ── Логирование питомцев ──
export function debugLogPetAction(action, pet) {
  log('default', `Питомец ${action}:`, {
    id:     pet.id,
    name:   pet.name,
    gender: pet.gender,
    cattery: pet.cattery,
  });
}

// ── Логирование прогноза вязки ──
export function debugLogBreeding(male, female) {
  log('event', `Прогноз вязки:`, {
    male:   male?.name  || '(не выбран)',
    female: female?.name || '(не выбрана)',
  });
}

// ── Логирование ошибок сохранения ──
export function debugLogSaveError(err) {
  log('error', 'Ошибка сохранения localStorage:', err);
}

// ── Инициализация: подключить все перехватчики ──
export function initDebug() {
  log('default', '🚀 Maincoon Stellar — debug mode ON');
  watchNavigation();

  // Проверить localStorage на старте
  try {
    const raw = localStorage.getItem('maincoon_stellar_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      log('state', `localStorage загружен:`, {
        pets:   parsed.pets?.length  || 0,
        events: parsed.events?.length || 0,
        lang:   parsed.lang || 'ru',
      });
      if (parsed.events?.length) {
        log('state', 'Events в localStorage:', parsed.events.map(e => ({
          id: e.id, type: e.type, date: e.date
        })));
      }
    } else {
      log('warning', 'localStorage: нет сохранённых данных (первый запуск)');
    }
  } catch (err) {
    log('error', 'Ошибка чтения localStorage:', err);
  }

  // Патчить console для перехвата ошибок модулей
  const origError = console.error;
  console.error = (...args) => {
    origError('%c[ERROR]', 'color:#ff4466;font-weight:700', ...args);
  };
}
