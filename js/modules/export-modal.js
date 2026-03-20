// ═══════════════════════════════════════════════
//  EXPORT MODAL — Модал экспорта данных
// ═══════════════════════════════════════════════
import { state } from '../state.js';
import { openModal, closeModal } from '../ui/modals.js';
import { exportTxt, exportMd, exportHtml, exportZip } from '../export.js';
import { showToast } from '../ui/toast.js';

export function initExportModal() {
  // Открыть модал
  document.getElementById('openExport')
    ?.addEventListener('click', () => {
      _updateCounts();
      openModal('exportModal');
    });

  // Закрыть модал
  document.getElementById('closeExportModal')
    ?.addEventListener('click', () => closeModal('exportModal'));

  // Переключение чекбоксов (делегирование)
  document.querySelectorAll('.export-check-item').forEach(item => {
    item.addEventListener('click', e => {
      // не реагировать на клик по самому input (он невидим, но не мешаем событию)
      const input = item.querySelector('input[type="checkbox"]');
      if (!input) return;
      input.checked = !input.checked;
      item.classList.toggle('checked', input.checked);
    });
  });

  // Выбор формата
  document.getElementById('exportFormatToggle')
    ?.addEventListener('click', e => {
      const btn = e.target.closest('.stoggle-btn');
      if (!btn) return;
      document.querySelectorAll('#exportFormatToggle .stoggle-btn')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });

  // Создать отчёт
  document.getElementById('confirmExportBtn')
    ?.addEventListener('click', _doExport);
}

// Обновляет счётчики в чекбоксах
function _updateCounts() {
  const petsCount    = (state.pets    || []).length;
  const littersCount = (state.litters || []).length;
  const eventsCount  = (state.events  || []).length;

  const pEl = document.getElementById('exportPetsCount');
  const lEl = document.getElementById('exportLittersCount');
  const eEl = document.getElementById('exportEventsCount');
  if (pEl) pEl.textContent = petsCount;
  if (lEl) lEl.textContent = littersCount;
  if (eEl) eEl.textContent = eventsCount;
}

// Выполняет экспорт по выбранным секциям и формату
function _doExport() {
  const includePets    = document.getElementById('exportPets')?.checked    ?? true;
  const includeLitters = document.getElementById('exportLitters')?.checked ?? true;
  const includeEvents  = document.getElementById('exportEvents')?.checked  ?? true;

  if (!includePets && !includeLitters && !includeEvents) {
    showToast('Выберите хотя бы одну секцию', 'error');
    return;
  }

  const fmt = document.querySelector('#exportFormatToggle .stoggle-btn.active')?.dataset.value || 'txt';
  const sections = { pets: includePets, litters: includeLitters, events: includeEvents };

  closeModal('exportModal');

  if (fmt === 'txt')  exportTxt(sections);
  if (fmt === 'md')   exportMd(sections);
  if (fmt === 'html') exportHtml(sections);
  if (fmt === 'zip')  exportZip(sections);
}
