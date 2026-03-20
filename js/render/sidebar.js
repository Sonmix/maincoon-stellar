// ═══════════════════════════════════════════════
//  RENDER SIDEBAR — Список питомцев
// ═══════════════════════════════════════════════
import { state } from '../state.js';
import { calcAge, genderSymbol } from '../helpers.js';

// Отфильтровать питомцев по текущему стейту
export function getFilteredPets() {
  return state.pets.filter(p => {
    const q = state.search.toLowerCase();
    const matchSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      (p.ems && p.ems.toLowerCase().includes(q));

    const f = state.filter;
    switch (f) {
      case 'female': return matchSearch && p.gender === 'female';
      case 'male':   return matchSearch && p.gender === 'male';
      case 'own':    return matchSearch && p.cattery === 'own';
      case 'active': return matchSearch && p.status === 'active';
      default:       return matchSearch; // 'all'
    }
  });
}

// Отрисовать сайдбар
export function renderSidebar(onSelect, onEdit) {
  const list = document.getElementById('petList');
  if (!list) return;

  const pets = getFilteredPets();
  list.innerHTML = '';

  if (pets.length === 0) {
    list.innerHTML = '<div class="pet-list-empty">Нет питомцев</div>';
    return;
  }

  pets.forEach((pet, idx) => {
    const card = document.createElement('div');
    card.className = [
      'pet-card',
      pet.id === state.selectedId ? 'selected' : '',
      pet.id === state.editingId  ? 'editing'  : '',
    ].filter(Boolean).join(' ');
    card.dataset.cattery = pet.cattery;
    card.dataset.id = pet.id;
    // Staggered animation delay
    card.style.animationDelay = `${idx * 0.04}s`;

    const avatarContent = pet.photo
      ? `<img src="${pet.photo}" alt="${pet.name}">`
      : `<svg class="pet-avatar-placeholder" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
           <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
           <circle cx="12" cy="7" r="4"/>
         </svg>`;

    card.innerHTML = `
      <div class="pet-avatar">${avatarContent}</div>
      <div class="pet-info">
        <div class="pet-cattery-name">${pet.catteryName || '—'}</div>
        <div class="pet-name">${pet.name}</div>
        <div class="pet-meta">
          <span class="pet-ems-badge">${pet.ems || '—'}</span>
          <span class="pet-gender">${genderSymbol(pet.gender)}</span>
          <span class="pet-age">${calcAge(pet.dob)}</span>
        </div>
      </div>
      <span class="cattery-badge ${pet.cattery === 'own' ? 'own' : 'other'}">
        ${pet.cattery === 'own' ? 'МОЙ' : 'ЧУЖ'}
      </span>
    `;

    card.addEventListener('click',    () => onSelect?.(pet.id));
    card.addEventListener('dblclick', () => onEdit?.(pet.id));
    list.appendChild(card);
  });
}
