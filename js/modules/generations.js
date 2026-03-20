// ═══════════════════════════════════════════════
//  GENERATIONS MODULE — Инициализация «Карта поколений»
// ═══════════════════════════════════════════════
import { renderGenerationsPanel } from '../render/generationsPanel.js';

export function initGenerations() {
  // Перерисовывать при каждом переходе на вкладку
  document.addEventListener('tabchange', e => {
    if (e.detail.tab === 'generations') {
      renderGenerationsPanel();
    }
  });
}
