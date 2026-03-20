// ═══════════════════════════════════════════════
//  LITTERS MODULE — Инициализация блока «Пометы»
// ═══════════════════════════════════════════════
import { state, saveState } from '../state.js';
import { showToast } from '../ui/toast.js';
import { openModal, closeModal, openConfirm } from '../ui/modals.js';
import {
  renderLittersPanel,
  renderLittersSidebar,
  renderLittersDetail,
  submitKitten,
  updateYearFilter,
} from '../render/littersPanel.js';

export function initLitters() {
  // Слушаем переключение на вкладку «Пометы»
  document.addEventListener('tabchange', e => {
    if (e.detail.tab === 'litters') {
      updateYearFilter();
      renderLittersPanel();
    }
  });

  // Фильтр по году
  document.getElementById('litterYearFilter')?.addEventListener('change', () => {
    state.selectedLitterId = null;
    const btn = document.getElementById('deleteLitterBtn');
    if (btn) btn.disabled = true;
    renderLittersSidebar();
    renderLittersDetail();
  });

  // Кнопка «Добавить помёт»
  document.getElementById('addLitterBtn')?.addEventListener('click', () => openAddLitterModal());

  // Кнопка «Удалить помёт»
  document.getElementById('deleteLitterBtn')?.addEventListener('click', () => {
    if (!state.selectedLitterId) return;
    const litter = (state.litters || []).find(l => l.id === state.selectedLitterId);
    if (!litter) return;

    openConfirm({
      title: 'Удалить помёт?',
      text: `Помёт и все его котята будут удалены без возможности восстановления.`,
      confirmText: 'Удалить',
      onConfirm: () => {
        state.litters = (state.litters || []).filter(l => l.id !== state.selectedLitterId);
        state.selectedLitterId = null;
        saveState();
        updateLittersBadge();
        const btn = document.getElementById('deleteLitterBtn');
        if (btn) btn.disabled = true;
        renderLittersPanel();
        showToast('Помёт удалён');
      },
    });
  });

  // Модал помёта — закрытие
  document.getElementById('closeAddLitterModal')?.addEventListener('click', () => closeModal('addLitterModal'));
  document.getElementById('cancelAddLitter')?.addEventListener('click', () => closeModal('addLitterModal'));

  // Модал помёта — подтверждение
  document.getElementById('confirmAddLitter')?.addEventListener('click', submitAddLitter);

  // Модал котёнка — закрытие
  document.getElementById('closeKittenModal')?.addEventListener('click', () => closeModal('kittenModal'));
  document.getElementById('cancelKittenBtn')?.addEventListener('click', () => closeModal('kittenModal'));

  // Модал котёнка — подтверждение
  document.getElementById('confirmKittenBtn')?.addEventListener('click', submitKitten);

  // Инициализировать date-selects
  _initDateSelects('f-litter-dob-day', 'f-litter-dob-month', 'f-litter-dob-year');
  _initDateSelects('f-kitten-dob-day', 'f-kitten-dob-month', 'f-kitten-dob-year');
}

// ── Открыть модал добавления помёта ──────────────────
function openAddLitterModal() {
  ['f-litter-title', 'f-litter-father-name', 'f-litter-notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  // Дефолт — сегодня
  const today = new Date();
  const d = document.getElementById('f-litter-dob-day');
  const m = document.getElementById('f-litter-dob-month');
  const y = document.getElementById('f-litter-dob-year');
  if (d) d.value = today.getDate();
  if (m) m.value = today.getMonth() + 1;
  if (y) y.value = today.getFullYear();

  // Заполнить select матери (кошки)
  const motherSel = document.getElementById('f-litter-mother');
  if (motherSel) {
    const females = state.pets.filter(p => p.gender === 'female');
    motherSel.innerHTML = `<option value="">— Выбрать кошку —</option>` +
      females.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }

  // Заполнить select отца (коты)
  const fatherSel = document.getElementById('f-litter-father');
  if (fatherSel) {
    const males = state.pets.filter(p => p.gender === 'male');
    fatherSel.innerHTML = `<option value="">— Из базы —</option>` +
      males.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }

  openModal('addLitterModal');
}

// ── Подтверждение добавления помёта ──────────────────
function submitAddLitter() {
  const title      = document.getElementById('f-litter-title')?.value.trim() || '';
  const motherId   = document.getElementById('f-litter-mother')?.value || null;
  const fatherId   = document.getElementById('f-litter-father')?.value || null;
  const fatherName = document.getElementById('f-litter-father-name')?.value.trim() || '';
  const notes      = document.getElementById('f-litter-notes')?.value.trim() || '';
  const day        = parseInt(document.getElementById('f-litter-dob-day')?.value) || 1;
  const mon        = parseInt(document.getElementById('f-litter-dob-month')?.value) || 1;
  const yr         = parseInt(document.getElementById('f-litter-dob-year')?.value) || new Date().getFullYear();
  const date       = `${yr}-${String(mon).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

  if (!motherId && !fatherId && !fatherName) {
    showToast('Укажите хотя бы одного родителя', 'error');
    return;
  }

  const litter = {
    id:          'l' + Date.now(),
    date,
    title,
    motherId:    motherId  || null,
    fatherId:    fatherId  || null,
    motherName:  '',
    fatherName,
    notes,
    kittens:     [],
  };

  if (!state.litters) state.litters = [];
  state.litters.unshift(litter);
  state.selectedLitterId = litter.id;
  saveState();
  updateLittersBadge();
  closeModal('addLitterModal');

  updateYearFilter();
  renderLittersSidebar();
  renderLittersDetail();

  const btn = document.getElementById('deleteLitterBtn');
  if (btn) btn.disabled = false;
  showToast('Помёт добавлен');
}

// ── Badge счётчик ────────────────────────────────────
export function updateLittersBadge() {
  const badge = document.getElementById('litters-badge');
  if (!badge) return;
  const count = (state.litters || []).length;
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

// ── Инициализация date-selects ────────────────────────
function _initDateSelects(dayId, monId, yrId) {
  const dayEl = document.getElementById(dayId);
  const yrEl  = document.getElementById(yrId);
  if (!dayEl || !yrEl) return;

  dayEl.innerHTML = Array.from({ length: 31 }, (_, i) =>
    `<option value="${i + 1}">${i + 1}</option>`
  ).join('');

  const curYear = new Date().getFullYear();
  yrEl.innerHTML = Array.from({ length: curYear - 1899 }, (_, i) =>
    `<option value="${curYear - i}">${curYear - i}</option>`
  ).join('');

  const today = new Date();
  dayEl.value = today.getDate();
  const monEl = document.getElementById(monId);
  if (monEl) monEl.value = today.getMonth() + 1;
  yrEl.value = today.getFullYear();
}
