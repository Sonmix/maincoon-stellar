// ═══════════════════════════════════════════════
//  CATTERY MODULE — Логика блока «Питомник»
// ═══════════════════════════════════════════════
import { state, saveState } from '../state.js';
import { createEmptyPet } from '../config.js';
import { renderSidebar } from '../render/sidebar.js';
import { renderDetail } from '../render/detail.js';
import { showToast } from '../ui/toast.js';
import { openModal, closeModal, openConfirm } from '../ui/modals.js';
import { applyI18n, isEN } from '../i18n.js';

// Сбросить выбор — вернуть к пустому состоянию (используется при клике на логотип)
export function resetCattery() {
  state.selectedId = null;
  state.editingId  = null;
  document.getElementById('deletePetBtn').disabled = true;
  renderSidebar(selectPet, editPet);
  renderDetail(null, false, {});
}

// Выбрать питомца (просмотр)
export function selectPet(id) {
  state.selectedId = id;
  state.editingId  = null;
  document.getElementById('deletePetBtn').disabled = false;
  renderSidebar(selectPet, editPet);
  renderDetail(id, false, {
    onRefresh:     () => renderSidebar(selectPet, editPet),
    onEditSection: (section) => editPet(id, section),
    onClose: () => {
      state.selectedId = null;
      state.editingId  = null;
      document.getElementById('deletePetBtn').disabled = true;
      renderSidebar(selectPet, editPet);
      renderDetail(null, false, {});
    },
  });
  if (isEN()) requestAnimationFrame(() => applyI18n(document.getElementById('petDetail')));
}

// Открыть питомца в режиме редактирования
// section — опциональный ID секции для прокрутки: 'main' | 'ems' | 'appearance' | 'traits' | 'tests' | 'pedigree'
export function editPet(id, section) {
  state.selectedId = id;
  state.editingId  = id;
  document.getElementById('deletePetBtn').disabled = false;
  renderSidebar(selectPet, editPet);

  const viewCallbacks = {
    onRefresh:     () => renderSidebar(selectPet, editPet),
    onEditSection: (s) => editPet(id, s),
  };
  const editCallbacks = {
    onSave: () => {
      renderSidebar(selectPet, editPet);
      renderDetail(id, false, viewCallbacks);
      if (isEN()) requestAnimationFrame(() => applyI18n(document.getElementById('petDetail')));
    },
    onCancel: () => {
      renderSidebar(selectPet, editPet);
      renderDetail(id, false, viewCallbacks);
      if (isEN()) requestAnimationFrame(() => applyI18n(document.getElementById('petDetail')));
    },
  };

  renderDetail(id, true, editCallbacks);
  if (isEN()) requestAnimationFrame(() => applyI18n(document.getElementById('petDetail')));

  // Прокрутить к нужной секции после рендера
  if (section) {
    const sectionId = `edit-s-${section}`;
    requestAnimationFrame(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Кратко подсветить секцию
        el.style.transition = 'color 0.3s';
        el.style.color = 'var(--orange)';
        setTimeout(() => { el.style.color = ''; }, 800);
      }
    });
  }
}

// Инициализировать блок «Питомник»
export function initCattery() {
  // Кнопка «Добавить питомца»
  document.getElementById('addPetBtn')?.addEventListener('click', () => openModal('addPetModal'));

  // Подтверждение добавления
  document.getElementById('confirmAddPet')?.addEventListener('click', () => {
    const name = document.getElementById('f-name').value.trim();
    if (!name) { showToast('Введите имя питомца', 'error'); return; }

    const pet = createEmptyPet({
      name,
      cattery:     document.getElementById('f-cattery-type').value,
      catteryName: document.getElementById('f-cattery-name').value.trim(),
      gender:      document.getElementById('f-gender').value,
      dob:         document.getElementById('f-dob').value,
      ems:         document.getElementById('f-ems').value.trim(),
      status:      document.getElementById('f-status').value,
    });

    state.pets.unshift(pet);
    saveState();
    closeModal('addPetModal');

    // Очистить форму
    ['f-name','f-cattery-name','f-ems','f-dob'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    renderSidebar(selectPet, editPet);
    selectPet(pet.id);
    showToast(`${name} добавлен(а) в питомник`);
  });

  // Кнопка «Удалить питомца»
  document.getElementById('deletePetBtn')?.addEventListener('click', () => {
    if (!state.selectedId) return;
    const pet = state.pets.find(p => p.id === state.selectedId);
    if (!pet) return;

    openConfirm({
      title:       'Удалить питомца?',
      text:        `${pet.name} будет удалён без возможности восстановления.`,
      confirmText: 'Удалить',
      onConfirm: () => {
        const deletingId = state.selectedId;
        const card = document.querySelector(`[data-id="${deletingId}"]`);

        const doDelete = () => {
          state.pets = state.pets.filter(p => p.id !== deletingId);
          state.selectedId = null;
          state.editingId  = null;
          document.getElementById('deletePetBtn').disabled = true;

          const emptyState = document.getElementById('emptyState');
          const petDetail  = document.getElementById('petDetail');
          if (emptyState) emptyState.style.display = 'flex';
          if (petDetail)  petDetail.style.display  = 'none';

          saveState();
          renderSidebar(selectPet, editPet);
          showToast('Питомец удалён');
        };

        if (card) {
          card.classList.add('pet-card-removing');
          // Fallback: если animationend не сработал — удаляем через 350ms
          const timer = setTimeout(doDelete, 350);
          card.addEventListener('animationend', () => { clearTimeout(timer); doDelete(); }, { once: true });
        } else {
          doDelete();
        }
      },
    });
  });

  // Поиск
  document.getElementById('searchInput')?.addEventListener('input', e => {
    state.search = e.target.value;
    renderSidebar(selectPet, editPet);
  });

  // Фильтр-чипы
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.filter = chip.dataset.filter;
      renderSidebar(selectPet, editPet);
    });
  });
}
