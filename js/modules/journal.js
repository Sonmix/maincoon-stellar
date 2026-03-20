// ═══════════════════════════════════════════════
//  JOURNAL MODULE — Инициализация блока «Журнал»
// ═══════════════════════════════════════════════
import { renderJournal, refreshPetSelects, submitAddEvent } from '../render/journal.js';
import { closeModal } from '../ui/modals.js';

export function initJournal() {
  // Перерисовывать при переключении на вкладку journal (любым способом)
  document.addEventListener('tabchange', e => {
    if (e.detail.tab === 'journal') renderJournal(true); // полный ребилд при входе на вкладку
  });

  // Обработчики модала добавления события (навешиваются один раз)
  document.getElementById('closeAddEventModal')
    ?.addEventListener('click', () => closeModal('addEventModal'));

  document.getElementById('cancelAddEvent')
    ?.addEventListener('click', () => closeModal('addEventModal'));

  document.getElementById('confirmAddEvent')
    ?.addEventListener('click', submitAddEvent);

  // При смене типа — обновить списки питомцев
  document.getElementById('f-event-type')
    ?.addEventListener('change', e => refreshPetSelects(e.target.value));
}
