// ═══════════════════════════════════════════════
//  LITTERS PANEL — Рендеринг блока «Пометы»
// ═══════════════════════════════════════════════
import { state, saveState } from '../state.js';
import { createEmptyPet } from '../config.js';
import { showToast } from '../ui/toast.js';
import { openConfirm, openModal, closeModal } from '../ui/modals.js';
import { calcAge } from '../helpers.js';
import { applyI18n, isEN } from '../i18n.js';

// ── Утилиты ──────────────────────────────────────────

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  const locale = isEN() ? 'en-US' : 'ru-RU';
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
}

function fmtDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  const locale = isEN() ? 'en-US' : 'ru-RU';
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function kittenAge(dob) {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob + 'T00:00:00').getTime();
  const days = Math.floor(diff / (24 * 3600 * 1000));
  if (days < 0) return null;
  if (isEN()) {
    if (days < 30) return `${days} d.`;
    const months = Math.floor(days / 30.44);
    if (months < 12) return `${months} mo.`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem ? `${years} yr. ${rem} mo.` : `${years} yr.`;
  }
  if (days < 30) return `${days} дн.`;
  const months = Math.floor(days / 30.44);
  if (months < 12) return `${months} мес.`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem ? `${years} г. ${rem} мес.` : `${years} г.`;
}

function getAvailableYears() {
  const years = new Set();
  (state.litters || []).forEach(l => {
    if (l.date) years.add(new Date(l.date + 'T00:00:00').getFullYear());
  });
  years.add(new Date().getFullYear());
  return [...years].sort((a, b) => b - a);
}

// ── Обновить фильтр по годам (только годы с реальными помётами) ────
export function updateYearFilter() {
  const sel = document.getElementById('litterYearFilter');
  if (!sel) return;
  const cur = sel.value;
  const years = [...new Set(
    (state.litters || [])
      .filter(l => l.date)
      .map(l => new Date(l.date + 'T00:00:00').getFullYear())
  )].sort((a, b) => b - a);

  sel.innerHTML = `<option value="">Все годы</option>` +
    years.map(y => `<option value="${y}" ${String(y) === cur ? 'selected' : ''}>${y}</option>`).join('');
}

// ── Рендер сайдбара ──────────────────────────────────
export function renderLittersSidebar() {
  const wrap = document.getElementById('litterList');
  if (!wrap) return;

  const yearSel = document.getElementById('litterYearFilter');
  const selectedYear = yearSel ? (parseInt(yearSel.value) || 0) : 0;

  let litters = (state.litters || []).filter(l => {
    if (!selectedYear) return true;
    return l.date && new Date(l.date + 'T00:00:00').getFullYear() === selectedYear;
  });
  litters = litters.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  if (litters.length === 0) {
    wrap.innerHTML = `<div style="padding:20px 12px;text-align:center;color:var(--text-dim);font-family:var(--font-ui);font-size:11px;letter-spacing:0.08em;">Помётов не найдено</div>`;
    return;
  }

  wrap.innerHTML = litters.map(l => {
    const mother = l.motherId ? state.pets.find(p => p.id === l.motherId) : null;
    const father = l.fatherId ? state.pets.find(p => p.id === l.fatherId) : null;
    const mName  = mother ? mother.name : (l.motherName || '—');
    const fName  = father ? father.name : (l.fatherName || '—');
    const sel    = state.selectedLitterId === l.id;
    const cnt    = (l.kittens || []).length;

    return `
      <div class="litter-card${sel ? ' selected' : ''}" data-litter-id="${l.id}">
        ${l.title ? `<div class="litter-card-title">${l.title}</div>` : ''}
        <div class="litter-card-date">${fmtDate(l.date)}</div>
        <div class="litter-card-pair">
          <span class="litter-pair-female">♀ ${mName}</span>
          <span style="color:var(--text-dim)"> × </span>
          <span class="litter-pair-male">♂ ${fName}</span>
        </div>
        <div class="litter-card-footer">
          <span class="litter-count-badge">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/>
            </svg>
            ${cnt}
          </span>
        </div>
      </div>`;
  }).join('');

  wrap.querySelectorAll('.litter-card').forEach(card => {
    card.addEventListener('click', () => {
      state.selectedLitterId = card.dataset.litterId;
      renderLittersSidebar();
      renderLittersDetail();
      const btn = document.getElementById('deleteLitterBtn');
      if (btn) btn.disabled = false;
    });
  });
  if (isEN()) applyI18n(wrap);
}

// ── Рендер правой панели ─────────────────────────────
export function renderLittersDetail() {
  const wrap = document.getElementById('littersDetailContent');
  if (!wrap) return;

  if (!state.selectedLitterId) {
    wrap.innerHTML = `
      <div class="litters-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/>
        </svg>
        <div class="litters-empty-title">Выберите помёт</div>
        <div class="litters-empty-sub">или добавьте новый</div>
      </div>`;
    return;
  }

  const litter = (state.litters || []).find(l => l.id === state.selectedLitterId);
  if (!litter) { state.selectedLitterId = null; renderLittersDetail(); return; }

  const mother = litter.motherId ? state.pets.find(p => p.id === litter.motherId) : null;
  const father = litter.fatherId ? state.pets.find(p => p.id === litter.fatherId) : null;
  const mName  = mother ? mother.name : (litter.motherName || '—');
  const fName  = father ? father.name : (litter.fatherName || '—');
  const kittens = litter.kittens || [];
  const females = kittens.filter(k => k.gender === 'female').length;
  const males   = kittens.filter(k => k.gender === 'male').length;
  const sold    = kittens.filter(k => k.status === 'sold').length;
  const stays   = kittens.filter(k => k.status === 'stays').length;
  const waiting = kittens.filter(k => k.status === 'waiting').length;

  wrap.innerHTML = `
    <div class="litter-detail-panel">
      <div class="litter-detail-header">
        ${litter.title ? `<div class="litter-detail-title">✦ ${litter.title}</div>` : ''}
        <div class="litter-detail-date-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          ${fmtDate(litter.date)}
        </div>
        <div class="litter-detail-parents">
          <span class="litter-parent-chip female"><span>♀</span>${mName}</span>
          <span style="color:var(--text-dim);font-family:var(--font-ui);font-size:12px">×</span>
          <span class="litter-parent-chip male"><span>♂</span>${fName}</span>
        </div>
      </div>

      <div class="litter-stats">
        <div class="litter-stat-item">
          <span class="litter-stat-value">${kittens.length}</span>
          <span class="litter-stat-label">Всего</span>
        </div>
        <div class="litter-stat-item stat-female">
          <span class="litter-stat-value">${females}</span>
          <span class="litter-stat-label">♀</span>
        </div>
        <div class="litter-stat-item stat-male">
          <span class="litter-stat-value">${males}</span>
          <span class="litter-stat-label">♂</span>
        </div>
        <div class="litter-stat-item stat-waiting">
          <span class="litter-stat-value">${waiting}</span>
          <span class="litter-stat-label">Ждут</span>
        </div>
        <div class="litter-stat-item stat-stays">
          <span class="litter-stat-value">${stays}</span>
          <span class="litter-stat-label">Остаются</span>
        </div>
        <div class="litter-stat-item stat-sold">
          <span class="litter-stat-value">${sold}</span>
          <span class="litter-stat-label">Проданы</span>
        </div>
      </div>

      <div class="litter-section-divider"></div>

      <div class="kittens-area">
        <div class="kittens-area-header">
          <span class="kittens-area-label">Котята помёта</span>
          <button class="btn btn-primary btn-sm" id="addKittenBtn" style="width:auto">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px;height:12px">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Добавить котёнка
          </button>
        </div>
        <div class="kittens-grid-scroll">
          ${kittens.length === 0
            ? `<div class="kittens-empty-hint">Котята не добавлены. Нажмите «Добавить котёнка».</div>`
            : `<div class="kittens-grid">${kittens.map((k, i) => renderKittenCard(k, i)).join('')}</div>`
          }
          ${litter.notes ? `
            <div class="litter-notes-block" style="margin-top:12px">
              <div class="litter-notes-label">Заметки</div>
              <div class="litter-notes-text">${litter.notes}</div>
            </div>` : ''}
        </div>
      </div>
    </div>`;

  // Обработчики смены статуса
  wrap.querySelectorAll('.kitten-status-select').forEach(sel => {
    sel.addEventListener('change', e => {
      const kIdx = parseInt(e.target.dataset.kidx);
      const lit  = (state.litters || []).find(l => l.id === state.selectedLitterId);
      if (!lit || !lit.kittens[kIdx]) return;
      const kitten = lit.kittens[kIdx];
      // При смене с 'stays' — обнуляем ссылку на питомца
      if (kitten.status === 'stays' && e.target.value !== 'stays') {
        kitten.petId = null;
      }
      kitten.status = e.target.value;
      saveState();
      renderLittersDetail();
    });
  });

  // Кнопка «Добавить котёнка»
  document.getElementById('addKittenBtn')?.addEventListener('click', () => openAddKittenModal());

  // Кнопки редактировать/удалить
  wrap.querySelectorAll('.kitten-action-btn.edit').forEach(btn => {
    btn.addEventListener('click', () => openEditKittenModal(parseInt(btn.dataset.kidx)));
  });
  wrap.querySelectorAll('.kitten-action-btn.delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const kIdx = parseInt(btn.dataset.kidx);
      const lit  = (state.litters || []).find(l => l.id === state.selectedLitterId);
      if (!lit) return;
      const kitten = lit.kittens[kIdx];
      openConfirm({
        title: 'Удалить котёнка?',
        text: `${kitten.name || 'Котёнок'} будет удалён из помёта.`,
        confirmText: 'Удалить',
        onConfirm: () => {
          lit.kittens.splice(kIdx, 1);
          saveState();
          renderLittersSidebar();
          renderLittersDetail();
          showToast('Котёнок удалён');
        },
      });
    });
  });

  // Кнопки «В питомник»
  wrap.querySelectorAll('.kitten-to-cattery-btn:not(.already-added)').forEach(btn => {
    btn.addEventListener('click', () => addKittenToCattery(parseInt(btn.dataset.kidx)));
  });
  if (isEN()) applyI18n(wrap);
}

// ── Рендер карточки котёнка ──────────────────────────
function renderKittenCard(kitten, idx) {
  const gc     = kitten.gender === 'female' ? 'female' : 'male';
  const gs     = kitten.gender === 'female' ? '♀' : '♂';
  const age    = kittenAge(kitten.dob);
  const status = kitten.status || 'waiting';
  const inCat  = !!kitten.petId;

  return `
    <div class="kitten-card ${gc}" data-status="${status}">
      <div class="kitten-card-header">
        <div class="kitten-gender-icon ${gc}">${gs}</div>
        <div class="kitten-card-actions">
          <button class="kitten-action-btn edit" data-kidx="${idx}" title="Редактировать">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="kitten-action-btn delete" data-kidx="${idx}" title="Удалить">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6m5 0V4h4v2"/>
            </svg>
          </button>
        </div>
      </div>

      ${kitten.name
        ? `<div class="kitten-name">${kitten.name}</div>`
        : `<div class="kitten-noname">Без имени</div>`}

      <div class="kitten-meta">
        ${kitten.dob ? `
          <div class="kitten-meta-row">
            <span class="kitten-meta-label">Рождение</span>
            <span class="kitten-meta-value">${fmtDateShort(kitten.dob)}${age ? ` · ${age}` : ''}</span>
          </div>` : ''}
        ${kitten.weight ? `
          <div class="kitten-meta-row">
            <span class="kitten-meta-label">Вес при рожд.</span>
            <span class="kitten-meta-value">${kitten.weight} г</span>
          </div>` : ''}
        ${kitten.furType ? `
          <div class="kitten-meta-row">
            <span class="kitten-meta-label">Шерсть</span>
            <span class="kitten-meta-value">${kitten.furType}</span>
          </div>` : ''}
      </div>

      ${kitten.ems ? `<span class="kitten-ems-badge">${kitten.ems}</span>` : ''}

      <div class="kitten-status-wrap">
        <select class="kitten-status-select" data-kidx="${idx}">
          <option value="waiting" ${status === 'waiting' ? 'selected' : ''}>⏳ Ожидает хозяев</option>
          <option value="sold"    ${status === 'sold'    ? 'selected' : ''}>✓ Продан</option>
          <option value="stays"   ${status === 'stays'   ? 'selected' : ''}>★ Остаётся</option>
        </select>
        ${status === 'stays' ? `
          <button class="kitten-to-cattery-btn${inCat ? ' already-added' : ''}" data-kidx="${idx}">
            ${inCat
              ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> В питомнике`
              : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> → В питомник`}
          </button>` : ''}
      </div>
    </div>`;
}

// ── Добавить котёнка в питомник ──────────────────────
function addKittenToCattery(kIdx) {
  const litter = (state.litters || []).find(l => l.id === state.selectedLitterId);
  if (!litter) return;
  const kitten = litter.kittens[kIdx];
  if (!kitten || kitten.petId) return;

  const pet = createEmptyPet({
    name:   kitten.name || '',
    gender: kitten.gender || 'female',
    dob:    kitten.dob   || '',
    cattery: 'own',
    ems:    kitten.ems   || '',
    status: 'active',
  });

  // Связать родителей из помёта
  const litMother = litter.motherId ? state.pets.find(p => p.id === litter.motherId) : null;
  const litFather = litter.fatherId ? state.pets.find(p => p.id === litter.fatherId) : null;
  if (litMother) {
    pet.mother = { name: litMother.name, cattery: litMother.cattery, catteryName: litMother.catteryName, ems: litMother.ems, inDb: true };
  }
  if (litFather) {
    pet.father = { name: litFather.name, cattery: litFather.cattery, catteryName: litFather.catteryName, ems: litFather.ems, inDb: true };
  }

  state.pets.unshift(pet);
  kitten.petId = pet.id;
  saveState();

  renderLittersSidebar();
  renderLittersDetail();
  showToast(`${kitten.name || 'Котёнок'} добавлен в Питомник`, 'success');
}

// ── Открыть модал добавления котёнка ─────────────────
export function openAddKittenModal() {
  ['f-kitten-name', 'f-kitten-weight', 'f-kitten-ems', 'f-kitten-fur'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const gSel = document.getElementById('f-kitten-gender');
  if (gSel) gSel.value = 'female';

  // Дата — из помёта по умолчанию
  const litter = (state.litters || []).find(l => l.id === state.selectedLitterId);
  if (litter?.date) {
    const d = new Date(litter.date + 'T00:00:00');
    const el1 = document.getElementById('f-kitten-dob-day');
    const el2 = document.getElementById('f-kitten-dob-month');
    const el3 = document.getElementById('f-kitten-dob-year');
    if (el1) el1.value = d.getDate();
    if (el2) el2.value = d.getMonth() + 1;
    if (el3) el3.value = d.getFullYear();
  }

  document.getElementById('kittenModalTitle').textContent = '✦ Добавить котёнка';
  const btn = document.getElementById('confirmKittenBtn');
  if (btn) { btn.dataset.mode = 'add'; btn.dataset.kidx = ''; }
  openModal('kittenModal');
}

// ── Открыть модал редактирования котёнка ─────────────
export function openEditKittenModal(kIdx) {
  const litter = (state.litters || []).find(l => l.id === state.selectedLitterId);
  if (!litter) return;
  const k = litter.kittens[kIdx];
  if (!k) return;

  document.getElementById('f-kitten-name').value   = k.name    || '';
  document.getElementById('f-kitten-gender').value = k.gender  || 'female';
  document.getElementById('f-kitten-weight').value = k.weight  || '';
  document.getElementById('f-kitten-ems').value    = k.ems     || '';
  document.getElementById('f-kitten-fur').value    = k.furType || '';

  if (k.dob) {
    const d = new Date(k.dob + 'T00:00:00');
    document.getElementById('f-kitten-dob-day').value   = d.getDate();
    document.getElementById('f-kitten-dob-month').value = d.getMonth() + 1;
    document.getElementById('f-kitten-dob-year').value  = d.getFullYear();
  }

  document.getElementById('kittenModalTitle').textContent = '✦ Редактировать котёнка';
  const btn = document.getElementById('confirmKittenBtn');
  if (btn) { btn.dataset.mode = 'edit'; btn.dataset.kidx = kIdx; }
  openModal('kittenModal');
}

// ── Сохранить котёнка ────────────────────────────────
export function submitKitten() {
  const btn  = document.getElementById('confirmKittenBtn');
  const mode = btn?.dataset.mode;
  const kIdx = parseInt(btn?.dataset.kidx);

  const name    = document.getElementById('f-kitten-name')?.value.trim() || '';
  const gender  = document.getElementById('f-kitten-gender')?.value || 'female';
  const weight  = document.getElementById('f-kitten-weight')?.value.trim();
  const ems     = document.getElementById('f-kitten-ems')?.value.trim() || '';
  const furType = document.getElementById('f-kitten-fur')?.value.trim() || '';
  const day     = parseInt(document.getElementById('f-kitten-dob-day')?.value) || 1;
  const mon     = parseInt(document.getElementById('f-kitten-dob-month')?.value) || 1;
  const yr      = parseInt(document.getElementById('f-kitten-dob-year')?.value) || new Date().getFullYear();
  const dob     = `${yr}-${String(mon).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

  const litter = (state.litters || []).find(l => l.id === state.selectedLitterId);
  if (!litter) return;

  const data = { name, gender, weight: weight ? parseFloat(weight) : null, ems, furType, dob };

  if (mode === 'add') {
    data.id = 'k' + Date.now();
    data.status = 'waiting';
    data.petId  = null;
    litter.kittens = litter.kittens || [];
    litter.kittens.push(data);
  } else if (mode === 'edit' && !isNaN(kIdx)) {
    const existing = litter.kittens[kIdx];
    data.status = existing.status || 'waiting';
    data.petId  = existing.petId  || null;
    data.id     = existing.id;
    litter.kittens[kIdx] = data;
  }

  saveState();
  closeModal('kittenModal');
  renderLittersSidebar();
  renderLittersDetail();
  showToast(mode === 'add' ? 'Котёнок добавлен' : 'Котёнок сохранён');
}

// ── Полный ребилд ────────────────────────────────────
export function renderLittersPanel() {
  updateYearFilter();
  renderLittersSidebar();
  renderLittersDetail();
}
