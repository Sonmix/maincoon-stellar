// ═══════════════════════════════════════════════
//  MODALS — Открытие/закрытие модальных окон
// ═══════════════════════════════════════════════
import { translateText, applyI18n, isEN } from '../i18n.js';

// Открыть модал по id оверлея
export function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  // Применить локализацию если EN
  if (isEN()) applyI18n(el);
}

// Закрыть модал по id оверлея
export function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

// Закрыть все открытые модалы
export function closeAllModals() {
  document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
}

// Открыть confirm-диалог в стиле интерфейса
// opts: { title, text, confirmText?, onConfirm }
export function openConfirm({ title, text, confirmText = 'Удалить', onConfirm }) {
  const tr = isEN() ? translateText : s => s;
  document.getElementById('confirmModalTitle').textContent = tr(title || 'Подтверждение');
  document.getElementById('confirmModalText').textContent  = tr(text  || '');

  const okBtn = document.getElementById('confirmModalOk');
  okBtn.textContent = tr(confirmText);

  // Заменяем кнопку чтобы сбросить старые листенеры
  const freshOk = okBtn.cloneNode(true);
  okBtn.replaceWith(freshOk);

  freshOk.addEventListener('click', () => {
    closeModal('confirmModal');
    onConfirm?.();
  });

  openModal('confirmModal');
}

// Инициализация: кнопки закрытия + клик по оверлею + ESC
export function initModals() {
  // Закрытие по кнопке X
  document.getElementById('closeAddModal')?.addEventListener('click',    () => closeModal('addPetModal'));
  document.getElementById('cancelAddPet')?.addEventListener('click',     () => closeModal('addPetModal'));
  document.getElementById('closePedigreeModal')?.addEventListener('click',() => closeModal('pedigreeModal'));
  document.getElementById('closePhotoModal')?.addEventListener('click',  () => closeModal('photoModal'));
  document.getElementById('confirmModalCancel')?.addEventListener('click', () => closeModal('confirmModal'));

  // Закрытие кликом по оверлею (за пределами .modal)
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  // Закрытие по ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllModals();
  });
}
