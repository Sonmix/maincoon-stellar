// ═══════════════════════════════════════════════
//  MAIN — Точка входа: инициализация приложения
// ═══════════════════════════════════════════════
import { loadState, state } from './state.js';
import { initStarCanvas }   from './ui/starCanvas.js';
import { initNavigation, switchTab } from './ui/navigation.js';
import { initModals }       from './ui/modals.js';
import { renderSidebar }    from './render/sidebar.js';
import { initCattery, selectPet, editPet, resetCattery } from './modules/cattery.js';
import { initBreeding }  from './modules/breeding.js';
import { initJournal }   from './modules/journal.js';
import { initSettings }     from './modules/settings.js';
import { initExportModal }  from './modules/export-modal.js';
import { initLitters, updateLittersBadge } from './modules/litters.js';
import { initGenerations } from './modules/generations.js';
import { initDebug }     from './debug.js';
import { applyI18n, isEN } from './i18n.js';

async function init() {
  // 0. Запустить debug-логгер (до всего остального)
  initDebug();

  // 1. Запустить звёздный фон
  initStarCanvas();

  // 2. Загрузить данные из localStorage (или defaults.json)
  await loadState();

  // 3. Инициализировать навигацию (хедер/футер)
  initNavigation();

  // 4. Инициализировать модалы (закрытие, ESC)
  initModals();

  // 5. Инициализировать блок «Питомник»
  initCattery();

  // 6. Отрисовать сайдбар
  renderSidebar(selectPet, editPet);

  // 8. Инициализировать блок «Прогноз вязки»
  initBreeding();

  // 9. Инициализировать блок «Журнал»
  initJournal();

  // 10. Инициализировать блок «Пометы»
  initLitters();
  updateLittersBadge();

  // 11. Инициализировать блок «Карта поколений»
  initGenerations();

  // 12. Инициализировать настройки (включая lang-switcher)
  initSettings();

  // 13. Инициализировать модал экспорта
  initExportModal();

  // Логотип → домой (сброс выбора + переключение на Питомник)
  document.querySelector('.logo')?.addEventListener('click', () => {
    switchTab('cattery');
    resetCattery();
  });

  // Применить локализацию после полной инициализации (если EN)
  if (isEN()) {
    applyI18n(document.body);
  }
}

// Запуск после загрузки DOM
document.addEventListener('DOMContentLoaded', init);
