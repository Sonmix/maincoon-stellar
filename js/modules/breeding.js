// ═══════════════════════════════════════════════
//  BREEDING MODULE — Инициализация прогноза вязки
// ═══════════════════════════════════════════════
import { renderBreedingPanel } from '../render/breedingPanel.js';

export function initBreeding() {
  // Перерисовывать при переключении на вкладку breeding (любым способом)
  document.addEventListener('tabchange', e => {
    if (e.detail.tab === 'breeding') renderBreedingPanel();
  });
}
