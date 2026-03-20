// ═══════════════════════════════════════════════
//  NAVIGATION — Переключение вкладок
// ═══════════════════════════════════════════════
import { closeAllModals } from './modals.js';
import { applyI18n, isEN } from '../i18n.js';

// Переключить активную вкладку
export function switchTab(tabId) {
  // Обновить кнопки nav (header + footer)
  document.querySelectorAll('.nav-tab, .footer-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Переключить панели
  document.querySelectorAll('.tab-panel').forEach(panel => {
    const isActive = panel.id === `panel-${tabId}`;
    panel.classList.toggle('active', isActive);
  });

  // Закрыть все открытые модальные окна
  closeAllModals();

  // Уведомить модули о смене вкладки
  document.dispatchEvent(new CustomEvent('tabchange', { detail: { tab: tabId } }));

  // Применить локализацию к активной панели после рендера (задержка для JS-рендера)
  if (isEN()) {
    const panel = document.getElementById(`panel-${tabId}`);
    if (panel) setTimeout(() => applyI18n(panel), 50);
  }
}

// Навесить обработчики на все таб-кнопки
export function initNavigation() {
  document.querySelectorAll('.nav-tab, .footer-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Логотип обрабатывается в main.js (там есть доступ к resetCattery)
}
