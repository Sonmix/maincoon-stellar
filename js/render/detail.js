// ═══════════════════════════════════════════════
//  RENDER DETAIL — Карточка питомца (view + edit)
// ═══════════════════════════════════════════════
import { state, saveState } from '../state.js';
import { EMS_COLORS, EMS_PATTERNS, EMS_EYES, APPEARANCE_OPTIONS, TRAITS_LIST, TITLES_LIST, TAGS_LIST, GENETIC_TESTS } from '../config.js';
import { calcAge, genderSymbol, getStandardScore, standardBarColor, testClass, testTooltip, eyeColorLabel, val } from '../helpers.js';
import { showToast } from '../ui/toast.js';
import { openModal, openConfirm } from '../ui/modals.js';
import { openPedigree } from './pedigree.js';
import { switchTab } from '../ui/navigation.js';

// Генерация <select> из массива вариантов
function mkSelect(id, current, options, labelsMap = {}) {
  return `<select class="edit-input edit-select" id="${id}">
    <option value="">— не указано —</option>
    ${options.map(v => `<option value="${v}" ${current === v ? 'selected' : ''}>${labelsMap[v] || v}</option>`).join('')}
  </select>`;
}

// Компактный ввод предка: имя + EMS
function ancInput(idPrefix, label, anc) {
  return `<div class="form-group">
    <label class="form-label">${label}</label>
    <input class="edit-input" id="${idPrefix}-name" placeholder="Полное имя" value="${anc?.name || ''}" style="margin-bottom:4px">
    <input class="edit-input" id="${idPrefix}-ems"  placeholder="EMS" value="${anc?.ems || ''}">
  </div>`;
}

// Ввод родителя: имя + тип питомника + EMS
function parentInput(idPrefix, label, par) {
  const cattery = par?.cattery || 'other';
  return `<div class="form-group">
    <label class="form-label">${label}</label>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:6px;margin-bottom:4px">
      <input class="edit-input" id="${idPrefix}-name" placeholder="Полное имя" value="${par?.name || ''}">
      <select class="edit-input edit-select" id="${idPrefix}-cattery">
        <option value="other" ${cattery !== 'own' ? 'selected' : ''}>Другой</option>
        <option value="own"   ${cattery === 'own' ? 'selected' : ''}>Мой</option>
      </select>
    </div>
    <input class="edit-input" id="${idPrefix}-ems" placeholder="EMS-код" value="${par?.ems || ''}">
  </div>`;
}

// Показать/скрыть панели empty state
function setDetailVisible(show) {
  const empty  = document.getElementById('emptyState');
  const detail = document.getElementById('petDetail');
  if (empty)  empty.style.display  = show ? 'none' : 'flex';
  if (detail) detail.style.display = show ? 'block' : 'none';
}

// Главная функция: рендер карточки питомца
export function renderDetail(id, editing, callbacks) {
  const pet = state.pets.find(p => p.id === id);
  if (!pet) { setDetailVisible(false); return; }

  setDetailVisible(true);
  const detail = document.getElementById('petDetail');
  detail.className = 'anim-fade-in';

  if (!editing) {
    renderViewMode(pet, detail, callbacks);
  } else {
    renderEditMode(pet, detail, callbacks);
  }
}

// ── VIEW MODE ──────────────────────────────────
function renderViewMode(pet, detail, callbacks) {
  const pct      = getStandardScore(pet.appearance);
  const pctColor = pct >= 80 ? 'var(--emerald)' : pct >= 50 ? '#ffd700' : 'var(--red)';

  const titlesHtml = (pet.titles || []).map(t =>
    `<span class="title-badge rank">${t}</span>`
  ).join('');

  const tagsHtml = (pet.tags || []).map(t => {
    const cls = t === 'BREED' ? 'status-breed' : t === 'SHOW' ? 'status-show' : 'status-sterile';
    return `<span class="title-badge ${cls}">${t}</span>`;
  }).join('');

  const emsColorLabel   = EMS_COLORS[pet.emsColor]   || '—';
  const emsPatternLabel = EMS_PATTERNS[pet.emsPattern] || '—';

  const testsHtml = Object.entries(pet.geneticTests || {}).map(([name, result]) => {
    const cls = testClass(result);
    const r   = result === 'unknown' ? 'не проводился' : result;
    return `<div class="test-row">
      <span class="test-name">${name}</span>
      <span class="test-result ${cls}">${r}</span>
      <div class="tooltip">${testTooltip(name, result)}</div>
    </div>`;
  }).join('');

  const traitsHtml = (pet.traits || []).map(t =>
    `<span class="trait-chip selected">${t}</span>`
  ).join('');

  const appearanceItems = pet.appearance ? [
    ['Костяк',     pet.appearance.skeleton],
    ['Корпус',     pet.appearance.body],
    ['Голова',     pet.appearance.head],
    ['Коробочка',  pet.appearance.muzzle],
    ['Подбородок', pet.appearance.chin],
    ['Нос',        pet.appearance.nose],
    ['Профиль',    pet.appearance.profile],
    ['Шерсть',     pet.appearance.fur],
    ['Подшерсток', pet.appearance.undercoat],
    ['Жабо',       pet.appearance.bib],
    ['Хвост',      pet.appearance.tail],
    ['Штаны',      pet.appearance.pants],
    ['Живот',      pet.appearance.belly],
    ['Уши',        pet.appearance.ears],
    ['Кисточки',   pet.appearance.earTufts],
    ['Глаза',      pet.appearance.eyes],
    ['Цвет глаз',  eyeColorLabel(pet.appearance.eyeColor)],
  ].map(([k, v]) =>
    `<div class="appearance-item">
      <span class="appearance-key">${k}</span>
      <span class="appearance-val">${val(v)}</span>
    </div>`
  ).join('') : '';

  detail.innerHTML = `
    <!-- ── TOP: Фото + Идентификация ── -->
    <div class="detail-top">
      <div class="photo-zone" id="photoZone">
        ${pet.photo
          ? `<img src="${pet.photo}" alt="${pet.name}" id="petPhoto">`
          : `<div class="photo-placeholder">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                 <rect x="3" y="3" width="18" height="18" rx="2"/>
                 <circle cx="8.5" cy="8.5" r="1.5"/>
                 <polyline points="21 15 16 10 5 21"/>
               </svg>
             </div>`
        }
        <div class="photo-overlay">
          <span>${pet.photo ? 'Открыть / сменить фото' : 'Нажмите, чтобы загрузить фото'}</span>
        </div>
        ${pet.photo ? `<button class="photo-delete-btn" id="photoDeleteBtn" title="Удалить фото">✕</button>` : ''}
      </div>

      <div class="pet-identity">
        <div class="pet-title-row">
          <button class="btn-back" id="detailBackBtn" title="Закрыть карточку">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Назад
          </button>
          <div class="pet-full-name">${pet.name}</div>
        </div>
        <div class="pet-cattery-row">
          <span class="pet-cattery-label">${pet.catteryName || '—'}</span>
          <span class="cattery-badge ${pet.cattery === 'own' ? 'own' : 'other'}">
            ${pet.cattery === 'own' ? 'Мой питомник' : 'Другой питомник'}
          </span>
        </div>
        <div class="title-badges">${titlesHtml}${tagsHtml}</div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">⚖️</div>
            <div class="stat-value">${val(pet.weight)}</div>
            <div class="stat-label">Вес, кг</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📏</div>
            <div class="stat-value">${val(pet.heightWither)}</div>
            <div class="stat-label">Высота в холке, см</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📐</div>
            <div class="stat-value">${val(pet.bodyLength)}</div>
            <div class="stat-label">Длина тела, см</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">〰️</div>
            <div class="stat-value">${val(pet.tailLength)}</div>
            <div class="stat-label">Длина хвоста, см</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── EMS — отдельный subblock на полную ширину ── -->
    <div class="subblock subblock-ems" data-section="ems">
      <div class="subblock-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v11a2 2 0 002 2h4a2 2 0 002-2V3M9 3h6m-3 14v4m0 0H8m4 0h4"/>
        </svg>
        EMS / Генетика
      </div>
      <div class="ems-view-grid">
        <div class="ems-block">
          <div class="ems-code-row">
            <span class="ems-label">EMS</span>
            <span class="ems-code">${pet.ems || '—'}</span>
          </div>
          <div class="ems-desc">${pet.emsDesc || '—'}</div>
          <div class="ems-tags">
            <span class="ems-tag">Цвет: <span>${emsColorLabel}</span></span>
            <span class="ems-tag">Паттерн: <span>${emsPatternLabel}</span></span>
            <span class="ems-tag">Серебро: <span>${pet.emsSilver ? '✓ Есть' : '—'}</span></span>
            <span class="ems-tag">Белое: <span>${pet.emsWhite || '—'}</span></span>
          </div>
        </div>
        ${pet.geneticFormula
          ? `<div class="ems-formula-wrap">
               <div class="ems-label" style="margin-bottom:6px">Генетическая формула</div>
               <div class="genetic-formula">${pet.geneticFormula}</div>
             </div>`
          : ''
        }
      </div>
    </div>

    <!-- ── Анализ внешности ── -->
    <div class="subblock" data-section="appearance">
      <div class="subblock-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        Анализ внешности
      </div>
      <div class="appearance-grid">${appearanceItems}</div>
      <div class="standard-bar-wrap">
        <div class="standard-bar-label">
          <span>Соответствие стандарту</span>
          <span class="standard-bar-pct" style="color:${pctColor}">${pct}%</span>
        </div>
        <div class="standard-bar-bg">
          <div class="standard-bar-fill" style="width:${pct}%;background:${standardBarColor(pct)}"></div>
        </div>
      </div>
    </div>

    <!-- ── Характер и поведение ── -->
    <div class="subblock" data-section="traits">
      <div class="subblock-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
        Характер и поведение
      </div>
      <div class="traits-grid">${traitsHtml}</div>
      ${pet.traitComment
        ? `<div style="font-size:12px;color:var(--text-secondary);font-style:italic;padding:6px 2px">${pet.traitComment}</div>`
        : ''}
    </div>

    <!-- ── Генетические тесты ── -->
    <div class="subblock" data-section="tests">
      <div class="subblock-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v11a2 2 0 002 2h4a2 2 0 002-2V3M9 3h6m-3 14v4m0 0H8m4 0h4"/>
        </svg>
        Генетические тесты
      </div>
      <div class="tests-list">${testsHtml}</div>
    </div>

    <!-- ── Родители и происхождение ── -->
    <div class="subblock" data-section="pedigree">
      <div class="subblock-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
          <line x1="12" y1="7" x2="5" y2="17"/><line x1="12" y1="7" x2="19" y2="17"/>
        </svg>
        Родители и происхождение
      </div>
      <div class="parents-grid">
        <div class="parent-card">
          <div class="parent-role">♂ Отец</div>
          <div class="parent-name" style="color:${pet.father?.cattery === 'own' ? 'var(--cyan)' : 'var(--emerald)'}">
            ${pet.father?.name || '—'}
          </div>
          <div class="parent-ems">${pet.father?.catteryName || ''} · ${pet.father?.ems || ''}</div>
          ${!pet.father?.inDb ? '<span class="parent-not-in-db">не в базе</span>' : ''}
        </div>
        <div class="parent-card">
          <div class="parent-role">♀ Мать</div>
          <div class="parent-name" style="color:${pet.mother?.cattery === 'own' ? 'var(--cyan)' : 'var(--emerald)'}">
            ${pet.mother?.name || '—'}
          </div>
          <div class="parent-ems">${pet.mother?.catteryName || ''} · ${pet.mother?.ems || ''}</div>
          ${!pet.mother?.inDb ? '<span class="parent-not-in-db">не в базе</span>' : ''}
        </div>
      </div>
      <div class="parents-actions">
        <button class="btn btn-outline btn-sm" id="pedigreeBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px">
            <circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
            <line x1="12" y1="7" x2="5" y2="17"/><line x1="12" y1="7" x2="19" y2="17"/>
          </svg>
          Родословная
        </button>
        <button class="btn btn-violet btn-sm" id="breedingProjectBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>
          </svg>
          Проект вязки
        </button>
      </div>
    </div>
  `;

  // ── Обработчики view mode ──

  // Кнопка «Назад» — закрыть карточку
  document.getElementById('detailBackBtn')?.addEventListener('click', () => {
    callbacks?.onClose?.();
  });

  // Фото — удалить
  document.getElementById('photoDeleteBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    openConfirm({
      title:       'Удалить фото?',
      text:        'Фото будет удалено без возможности восстановления.',
      confirmText: 'Удалить',
      onConfirm:   () => {
        pet.photo = null;
        saveState();
        callbacks?.onRefresh?.();
        showToast('Фото удалено');
      },
    });
  });

  // Фото — открыть/загрузить
  document.getElementById('photoZone')?.addEventListener('click', () => {
    if (pet.photo) {
      document.getElementById('photoModalImg').src = pet.photo;
      openModal('photoModal');
    } else {
      pickPhoto(pet, () => {
        saveState();
        callbacks?.onRefresh?.();
        showToast('Фото загружено');
      });
    }
  });

  // Drag-and-drop фото (view mode — только если нет фото)
  if (!pet.photo) {
    setupDragDrop('photoZone', pet, () => {
      saveState();
      callbacks?.onRefresh?.();
      showToast('Фото загружено');
    });
  }

  document.getElementById('pedigreeBtn')?.addEventListener('click', () => openPedigree(pet));
  document.getElementById('breedingProjectBtn')?.addEventListener('click', () => {
    state.breedingPetId = pet.id;
    switchTab('breeding');
    // tabchange event автоматически вызовет renderBreedingPanel() с state.breedingPetId
    showToast(`${pet.name} передан в Прогноз вязки`, 'success');
  });

  // Двойной клик по subblock → режим редактирования + прокрутка к секции
  detail.querySelectorAll('.subblock[data-section]').forEach(block => {
    block.addEventListener('dblclick', e => {
      // Игнорировать клик по кнопкам/инпутам внутри блока
      if (e.target.closest('button, input, select, textarea, a')) return;
      callbacks?.onEditSection?.(block.dataset.section);
    });
  });
}

// ── EDIT MODE ──────────────────────────────────
function renderEditMode(pet, detail, callbacks) {
  const app = pet.appearance || {};

  const emsColorOptions = Object.entries(EMS_COLORS)
    .map(([k,v]) => `<option value="${k}" ${pet.emsColor === k ? 'selected' : ''}>${k} — ${v}</option>`)
    .join('');

  const emsPatternOptions = `<option value="">—</option>` +
    Object.entries(EMS_PATTERNS)
      .map(([k,v]) => `<option value="${k}" ${pet.emsPattern === k ? 'selected' : ''}>${k} — ${v}</option>`)
      .join('');

  const titlesHtml = TITLES_LIST.map(t => `
    <label style="display:flex;align-items:center;gap:5px;cursor:pointer">
      <input type="checkbox" style="accent-color:var(--cyan)" value="${t}" ${(pet.titles||[]).includes(t) ? 'checked' : ''}>
      <span class="title-badge rank">${t}</span>
    </label>`
  ).join('');

  const tagsHtml = TAGS_LIST.map(({ value, cls }) => `
    <label style="display:flex;align-items:center;gap:5px;cursor:pointer">
      <input type="checkbox" style="accent-color:var(--cyan)" value="${value}" data-tag="tag" ${(pet.tags||[]).includes(value) ? 'checked' : ''}>
      <span class="title-badge ${cls}">${value}</span>
    </label>`
  ).join('');

  const traitsHtml = TRAITS_LIST.map(t =>
    `<span class="trait-chip ${(pet.traits||[]).includes(t) ? 'selected' : ''}" data-trait="${t}">${t}</span>`
  ).join('');

  const testsHtml = GENETIC_TESTS.map(name => {
    const result = pet.geneticTests?.[name] || 'unknown';
    return `<div class="form-group">
      <label class="form-label">${name}</label>
      <select class="edit-input edit-select" data-test="${name}">
        <option value="unknown"         ${result==='unknown'         ?'selected':''}>Не проводился</option>
        <option value="N/N"             ${result==='N/N'             ?'selected':''}>N/N (Здоров)</option>
        <option value="N/${name}"       ${result===`N/${name}`       ?'selected':''}>N/${name} (Носитель)</option>
        <option value="${name}/${name}" ${result===`${name}/${name}` ?'selected':''}>${name}/${name} (Больной)</option>
      </select>
    </div>`;
  }).join('');

  const metricsHtml = [
    ['e-weight', 'Вес, кг',           pet.weight,       'number'],
    ['e-height', 'Высота в холке, см', pet.heightWither, 'number'],
    ['e-body',   'Длина тела, см',     pet.bodyLength,   'number'],
    ['e-tail',   'Длина хвоста, см',   pet.tailLength,   'number'],
  ].map(([id, label, v, type]) =>
    `<div class="form-group">
      <label class="form-label">${label}</label>
      <input class="edit-input" id="${id}" type="${type}" step="0.1" value="${v || ''}">
    </div>`
  ).join('');

  detail.innerHTML = `
    <div class="subblock" style="border-color:rgba(255,140,66,0.3)">
      <div class="subblock-title" style="color:var(--orange)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Режим редактирования
      </div>

      <!-- Фото + основные данные -->
      <div id="edit-s-main" style="display:grid;grid-template-columns:160px 1fr;gap:20px;margin-bottom:16px">
        <div class="photo-zone" id="photoZoneEdit" style="height:160px;cursor:pointer">
          ${pet.photo
            ? `<img src="${pet.photo}" alt="${pet.name}">`
            : `<div class="photo-placeholder">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                   <rect x="3" y="3" width="18" height="18" rx="2"/>
                   <circle cx="8.5" cy="8.5" r="1.5"/>
                   <polyline points="21 15 16 10 5 21"/>
                 </svg>
               </div>`
          }
          <div class="photo-overlay"><span>${pet.photo ? 'Сменить фото' : 'Загрузить фото'}</span></div>
          ${pet.photo ? `<button class="photo-delete-btn" id="photoDeleteBtnEdit" title="Удалить фото">✕</button>` : ''}
        </div>

        <div style="display:flex;flex-direction:column;gap:10px">
          <div class="form-group">
            <label class="form-label">Полное имя</label>
            <input class="edit-input" id="e-name" value="${pet.name}">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="form-group">
              <label class="form-label">Тип питомника</label>
              <select class="edit-input edit-select" id="e-cattery-type">
                <option value="own"   ${pet.cattery === 'own'  ? 'selected' : ''}>Мой питомник</option>
                <option value="other" ${pet.cattery !== 'own'  ? 'selected' : ''}>Другой питомник</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Название питомника</label>
              <input class="edit-input" id="e-cattery-name" value="${pet.catteryName || ''}">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
            <div class="form-group">
              <label class="form-label">Пол</label>
              <select class="edit-input edit-select" id="e-gender">
                <option value="female" ${pet.gender === 'female' ? 'selected' : ''}>♀ Кошка</option>
                <option value="male"   ${pet.gender === 'male'   ? 'selected' : ''}>♂ Кот</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Дата рождения</label>
              <input class="edit-input" type="date" id="e-dob" value="${pet.dob || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">Статус</label>
              <select class="edit-input edit-select" id="e-status">
                <option value="active"  ${pet.status === 'active'  ? 'selected' : ''}>Активный</option>
                <option value="sterile" ${pet.status === 'sterile' ? 'selected' : ''}>Кастрат</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Метрики и EMS -->
      <div class="divider"></div>
      <div id="edit-s-ems" style="font-family:var(--font-ui);font-size:10px;font-weight:700;letter-spacing:0.15em;color:var(--cyan);text-transform:uppercase;margin-bottom:10px">
        Метрики и EMS
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
        ${metricsHtml}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px">
        <div class="form-group">
          <label class="form-label">EMS-код</label>
          <input class="edit-input" id="e-ems" value="${pet.ems || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Описание EMS</label>
          <input class="edit-input" id="e-ems-desc" value="${pet.emsDesc || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Ген. формула</label>
          <input class="edit-input" id="e-gen-formula" value="${pet.geneticFormula || ''}">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
        <div class="form-group">
          <label class="form-label">Базовый цвет</label>
          <select class="edit-input edit-select" id="e-ems-color">${emsColorOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Паттерн</label>
          <select class="edit-input edit-select" id="e-ems-pattern">${emsPatternOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Серебро / дым</label>
          <select class="edit-input edit-select" id="e-ems-silver">
            <option value="false" ${!pet.emsSilver ? 'selected' : ''}>Нет</option>
            <option value="true"  ${pet.emsSilver  ? 'selected' : ''}>Есть</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Белое пятно</label>
          <select class="edit-input edit-select" id="e-ems-white">
            <option value=""   ${!pet.emsWhite         ? 'selected' : ''}>Нет</option>
            <option value="01" ${pet.emsWhite === '01' ? 'selected' : ''}>01</option>
            <option value="02" ${pet.emsWhite === '02' ? 'selected' : ''}>02</option>
            <option value="03" ${pet.emsWhite === '03' ? 'selected' : ''}>03</option>
            <option value="09" ${pet.emsWhite === '09' ? 'selected' : ''}>09</option>
          </select>
        </div>
      </div>

      <!-- Титулы и теги -->
      <div class="divider"></div>
      <div style="font-family:var(--font-ui);font-size:10px;font-weight:700;letter-spacing:0.15em;color:var(--cyan);text-transform:uppercase;margin-bottom:10px">Титулы и теги</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px" id="titleSelect">
        ${titlesHtml}
      </div>
      <div style="display:flex;gap:10px;margin-bottom:14px">
        ${tagsHtml}
      </div>

      <!-- Характер -->
      <div class="divider"></div>
      <div id="edit-s-traits" style="font-family:var(--font-ui);font-size:10px;font-weight:700;letter-spacing:0.15em;color:var(--cyan);text-transform:uppercase;margin-bottom:10px">
        Характер
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px" id="traitSelect">
        ${traitsHtml}
      </div>
      <textarea class="trait-comment" id="e-trait-comment" placeholder="Краткий комментарий о характере...">${pet.traitComment || ''}</textarea>

      <!-- Генетические тесты -->
      <div class="divider"></div>
      <div id="edit-s-tests" style="font-family:var(--font-ui);font-size:10px;font-weight:700;letter-spacing:0.15em;color:var(--cyan);text-transform:uppercase;margin-bottom:10px">
        Генетические тесты
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:14px">
        ${testsHtml}
      </div>

      <!-- Анализ внешности -->
      <div class="divider"></div>
      <div id="edit-s-appearance" style="font-family:var(--font-ui);font-size:10px;font-weight:700;letter-spacing:0.15em;color:var(--cyan);text-transform:uppercase;margin-bottom:10px">
        Анализ внешности
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px">
        <div class="form-group"><label class="form-label">Костяк</label>${mkSelect('ea-skeleton', app.skeleton, APPEARANCE_OPTIONS.skeleton)}</div>
        <div class="form-group"><label class="form-label">Корпус</label>${mkSelect('ea-body', app.body, APPEARANCE_OPTIONS.body)}</div>
        <div class="form-group"><label class="form-label">Голова</label>${mkSelect('ea-head', app.head, APPEARANCE_OPTIONS.head)}</div>
      </div>
      <div style="margin-bottom:10px">
        <div class="form-group"><label class="form-label">Коробочка / морда</label>${mkSelect('ea-muzzle', app.muzzle, APPEARANCE_OPTIONS.muzzle)}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px">
        <div class="form-group"><label class="form-label">Подбородок</label>${mkSelect('ea-chin', app.chin, APPEARANCE_OPTIONS.chin)}</div>
        <div class="form-group"><label class="form-label">Нос</label>${mkSelect('ea-nose', app.nose, APPEARANCE_OPTIONS.nose)}</div>
        <div class="form-group"><label class="form-label">Профиль</label>${mkSelect('ea-profile', app.profile, APPEARANCE_OPTIONS.profile)}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
        <div class="form-group"><label class="form-label">Шерсть</label>${mkSelect('ea-fur', app.fur, APPEARANCE_OPTIONS.fur)}</div>
        <div class="form-group"><label class="form-label">Подшерсток</label>${mkSelect('ea-undercoat', app.undercoat, APPEARANCE_OPTIONS.undercoat)}</div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px">
        <div class="form-group"><label class="form-label">Жабо</label>${mkSelect('ea-bib', app.bib, APPEARANCE_OPTIONS.bib)}</div>
        <div class="form-group"><label class="form-label">Хвост</label>${mkSelect('ea-tail', app.tail, APPEARANCE_OPTIONS.tail)}</div>
        <div class="form-group"><label class="form-label">Штаны</label>${mkSelect('ea-pants', app.pants, APPEARANCE_OPTIONS.pants)}</div>
        <div class="form-group"><label class="form-label">Живот</label>${mkSelect('ea-belly', app.belly, APPEARANCE_OPTIONS.belly)}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
        <div class="form-group"><label class="form-label">Уши</label>${mkSelect('ea-ears', app.ears, APPEARANCE_OPTIONS.ears)}</div>
        <div class="form-group"><label class="form-label">Кисточки на ушах</label>${mkSelect('ea-earTufts', app.earTufts, APPEARANCE_OPTIONS.earTufts)}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <div class="form-group"><label class="form-label">Форма глаз</label>${mkSelect('ea-eyes', app.eyes, APPEARANCE_OPTIONS.eyes)}</div>
        <div class="form-group"><label class="form-label">Цвет глаз</label>${mkSelect('ea-eyeColor', app.eyeColor, APPEARANCE_OPTIONS.eyeColor, EMS_EYES)}</div>
      </div>

      <!-- Родители и родословная -->
      <div class="divider"></div>
      <div id="edit-s-pedigree" style="font-family:var(--font-ui);font-size:10px;font-weight:700;letter-spacing:0.15em;color:var(--cyan);text-transform:uppercase;margin-bottom:10px">
        Родители и родословная
      </div>

      <!-- Поколение I: родители -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
        ${parentInput('ep-f', '♂ Отец', pet.father)}
        ${parentInput('ep-m', '♀ Мать', pet.mother)}
      </div>

      <!-- Поколение II: деды/бабки -->
      <div style="font-family:var(--font-ui);font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px">II поколение — Деды и бабки</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px">
        ${ancInput('ep-ff',  'Отец отца',   (pet.pedigree||[])[0])}
        ${ancInput('ep-fm',  'Мать отца',   (pet.pedigree||[])[1])}
        ${ancInput('ep-mf',  'Отец матери', (pet.pedigree||[])[2])}
        ${ancInput('ep-mm',  'Мать матери', (pet.pedigree||[])[3])}
      </div>

      <!-- Поколение III: прадеды -->
      <div style="font-family:var(--font-ui);font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-dim);margin-bottom:6px">III поколение — Прадеды</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">
        ${ancInput('ep-fff', 'FFF', (pet.pedigree||[])[4])}
        ${ancInput('ep-ffm', 'FFM', (pet.pedigree||[])[5])}
        ${ancInput('ep-fmf', 'FMF', (pet.pedigree||[])[6])}
        ${ancInput('ep-fmm', 'FMM', (pet.pedigree||[])[7])}
        ${ancInput('ep-mff', 'MFF', (pet.pedigree||[])[8])}
        ${ancInput('ep-mfm', 'MFM', (pet.pedigree||[])[9])}
        ${ancInput('ep-mmf', 'MMF', (pet.pedigree||[])[10])}
        ${ancInput('ep-mmm', 'MMM', (pet.pedigree||[])[11])}
      </div>

      <!-- Поколение IV: прапрадеды -->
      <details style="margin-bottom:10px">
        <summary style="font-family:var(--font-ui);font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-dim);cursor:pointer;list-style:none;display:flex;align-items:center;gap:6px;margin-bottom:6px;user-select:none">
          <span style="color:var(--cyan);font-size:10px">▶</span>
          IV поколение — Прапрадеды (16)
        </summary>
        <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:6px;margin-top:8px;margin-bottom:4px">
          ${ancInput('ep-ffff', 'FFFF', (pet.pedigree||[])[12])}
          ${ancInput('ep-fffm', 'FFFM', (pet.pedigree||[])[13])}
          ${ancInput('ep-ffmf', 'FFMF', (pet.pedigree||[])[14])}
          ${ancInput('ep-ffmm', 'FFMM', (pet.pedigree||[])[15])}
          ${ancInput('ep-fmff', 'FMFF', (pet.pedigree||[])[16])}
          ${ancInput('ep-fmfm', 'FMFM', (pet.pedigree||[])[17])}
          ${ancInput('ep-fmmf', 'FMMF', (pet.pedigree||[])[18])}
          ${ancInput('ep-fmmm', 'FMMM', (pet.pedigree||[])[19])}
          ${ancInput('ep-mfff', 'MFFF', (pet.pedigree||[])[20])}
          ${ancInput('ep-mffm', 'MFFM', (pet.pedigree||[])[21])}
          ${ancInput('ep-mfmf', 'MFMF', (pet.pedigree||[])[22])}
          ${ancInput('ep-mfmm', 'MFMM', (pet.pedigree||[])[23])}
          ${ancInput('ep-mmff', 'MMFF', (pet.pedigree||[])[24])}
          ${ancInput('ep-mmfm', 'MMFM', (pet.pedigree||[])[25])}
          ${ancInput('ep-mmmf', 'MMMF', (pet.pedigree||[])[26])}
          ${ancInput('ep-mmmm', 'MMMM', (pet.pedigree||[])[27])}
        </div>
      </details>

      <!-- Поколение V: 5-е колено -->
      <details style="margin-bottom:14px">
        <summary style="font-family:var(--font-ui);font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-dim);cursor:pointer;list-style:none;display:flex;align-items:center;gap:6px;margin-bottom:6px;user-select:none">
          <span style="color:var(--violet);font-size:10px">▶</span>
          V поколение — 5-е колено (32)
        </summary>
        <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:6px;margin-top:8px;margin-bottom:4px">
          ${ancInput('ep-fffff', 'FFFFF', (pet.pedigree||[])[28])}
          ${ancInput('ep-ffffm', 'FFFFM', (pet.pedigree||[])[29])}
          ${ancInput('ep-fffmf', 'FFFMF', (pet.pedigree||[])[30])}
          ${ancInput('ep-fffmm', 'FFFMM', (pet.pedigree||[])[31])}
          ${ancInput('ep-ffmff', 'FFMFF', (pet.pedigree||[])[32])}
          ${ancInput('ep-ffmfm', 'FFMFM', (pet.pedigree||[])[33])}
          ${ancInput('ep-ffmmf', 'FFMMF', (pet.pedigree||[])[34])}
          ${ancInput('ep-ffmmm', 'FFMMM', (pet.pedigree||[])[35])}
          ${ancInput('ep-fmfff', 'FMFFF', (pet.pedigree||[])[36])}
          ${ancInput('ep-fmffm', 'FMFFM', (pet.pedigree||[])[37])}
          ${ancInput('ep-fmfmf', 'FMFMF', (pet.pedigree||[])[38])}
          ${ancInput('ep-fmfmm', 'FMFMM', (pet.pedigree||[])[39])}
          ${ancInput('ep-fmmff', 'FMMFF', (pet.pedigree||[])[40])}
          ${ancInput('ep-fmmfm', 'FMMFM', (pet.pedigree||[])[41])}
          ${ancInput('ep-fmmmf', 'FMMMF', (pet.pedigree||[])[42])}
          ${ancInput('ep-fmmmm', 'FMMMM', (pet.pedigree||[])[43])}
          ${ancInput('ep-mffff', 'MFFFF', (pet.pedigree||[])[44])}
          ${ancInput('ep-mfffm', 'MFFFM', (pet.pedigree||[])[45])}
          ${ancInput('ep-mffmf', 'MFFMF', (pet.pedigree||[])[46])}
          ${ancInput('ep-mffmm', 'MFFMM', (pet.pedigree||[])[47])}
          ${ancInput('ep-mfmff', 'MFMFF', (pet.pedigree||[])[48])}
          ${ancInput('ep-mfmfm', 'MFMFM', (pet.pedigree||[])[49])}
          ${ancInput('ep-mfmmf', 'MFMMF', (pet.pedigree||[])[50])}
          ${ancInput('ep-mfmmm', 'MFMMM', (pet.pedigree||[])[51])}
          ${ancInput('ep-mmfff', 'MMFFF', (pet.pedigree||[])[52])}
          ${ancInput('ep-mmffm', 'MMFFM', (pet.pedigree||[])[53])}
          ${ancInput('ep-mmfmf', 'MMFMF', (pet.pedigree||[])[54])}
          ${ancInput('ep-mmfmm', 'MMFMM', (pet.pedigree||[])[55])}
          ${ancInput('ep-mmmff', 'MMMFF', (pet.pedigree||[])[56])}
          ${ancInput('ep-mmmfm', 'MMMFM', (pet.pedigree||[])[57])}
          ${ancInput('ep-mmmmf', 'MMMMF', (pet.pedigree||[])[58])}
          ${ancInput('ep-mmmmm', 'MMMMM', (pet.pedigree||[])[59])}
        </div>
      </details>

      <div class="edit-actions">
        <button class="btn btn-save" id="saveEditBtn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:14px;height:14px">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Сохранить
        </button>
        <button class="btn btn-cancel" id="cancelEditBtn">Отмена</button>
      </div>
    </div>
  `;

  // Фото в режиме редактирования — удалить
  document.getElementById('photoDeleteBtnEdit')?.addEventListener('click', e => {
    e.stopPropagation();
    openConfirm({
      title:       'Удалить фото?',
      text:        'Фото будет удалено без возможности восстановления.',
      confirmText: 'Удалить',
      onConfirm:   () => {
        pet.photo = null;
        saveState();
        showToast('Фото удалено');
        // Патчим DOM без полного ре-рендера
        const zone = document.getElementById('photoZoneEdit');
        if (zone) {
          zone.querySelector('img')?.remove();
          zone.querySelector('.photo-delete-btn')?.remove();
          zone.querySelector('.photo-overlay span').textContent = 'Загрузить фото';
          const ph = document.createElement('div');
          ph.className = 'photo-placeholder';
          ph.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
          zone.prepend(ph);
        }
      },
    });
  });

  // Фото в режиме редактирования — загрузить/сменить
  document.getElementById('photoZoneEdit')?.addEventListener('click', () => {
    pickPhoto(pet, () => {
      saveState();
      showToast('Фото обновлено');
    });
  });

  // Drag-and-drop фото (edit mode)
  setupDragDrop('photoZoneEdit', pet, () => {
    saveState();
    showToast('Фото обновлено');
    // Патчим DOM без ре-рендера
    const zone = document.getElementById('photoZoneEdit');
    if (zone) {
      zone.querySelector('.photo-placeholder')?.remove();
      if (!zone.querySelector('img')) {
        const img = document.createElement('img');
        img.src = pet.photo;
        img.alt = pet.name;
        zone.prepend(img);
      } else {
        zone.querySelector('img').src = pet.photo;
      }
      zone.querySelector('.photo-overlay span').textContent = 'Сменить фото';
      if (!zone.querySelector('.photo-delete-btn')) {
        const btn = document.createElement('button');
        btn.className = 'photo-delete-btn';
        btn.id = 'photoDeleteBtnEdit';
        btn.title = 'Удалить фото';
        btn.textContent = '✕';
        zone.appendChild(btn);
      }
    }
  });

  // Переключение черт характера
  document.querySelectorAll('[data-trait]').forEach(chip => {
    chip.addEventListener('click', () => chip.classList.toggle('selected'));
  });

  // Сохранить
  document.getElementById('saveEditBtn')?.addEventListener('click', () => {
    pet.name           = document.getElementById('e-name').value.trim() || pet.name;
    pet.cattery        = document.getElementById('e-cattery-type').value;
    pet.catteryName    = document.getElementById('e-cattery-name').value.trim();
    pet.gender         = document.getElementById('e-gender').value;
    pet.dob            = document.getElementById('e-dob').value;
    pet.status         = document.getElementById('e-status').value;
    pet.weight         = parseFloat(document.getElementById('e-weight').value) || null;
    pet.heightWither   = parseFloat(document.getElementById('e-height').value) || null;
    pet.bodyLength     = parseFloat(document.getElementById('e-body').value)   || null;
    pet.tailLength     = parseFloat(document.getElementById('e-tail').value)   || null;
    pet.ems            = document.getElementById('e-ems').value.trim();
    pet.emsDesc        = document.getElementById('e-ems-desc').value.trim();
    pet.geneticFormula = document.getElementById('e-gen-formula').value.trim();
    pet.emsColor       = document.getElementById('e-ems-color').value;
    pet.emsPattern     = document.getElementById('e-ems-pattern').value;
    pet.emsSilver      = document.getElementById('e-ems-silver').value === 'true';
    pet.emsWhite       = document.getElementById('e-ems-white').value || null;

    const getVal = id => document.getElementById(id)?.value || null;
    pet.appearance = {
      skeleton:  getVal('ea-skeleton'),
      body:      getVal('ea-body'),
      head:      getVal('ea-head'),
      muzzle:    getVal('ea-muzzle'),
      chin:      getVal('ea-chin'),
      nose:      getVal('ea-nose'),
      profile:   getVal('ea-profile'),
      fur:       getVal('ea-fur'),
      undercoat: getVal('ea-undercoat'),
      bib:       getVal('ea-bib'),
      tail:      getVal('ea-tail'),
      pants:     getVal('ea-pants'),
      belly:     getVal('ea-belly'),
      ears:      getVal('ea-ears'),
      earTufts:  getVal('ea-earTufts'),
      eyes:      getVal('ea-eyes'),
      eyeColor:  getVal('ea-eyeColor'),
    };

    // Родители
    const gv = id => document.getElementById(id)?.value.trim() || '';
    pet.father = { name: gv('ep-f-name'), cattery: gv('ep-f-cattery') || 'other', catteryName: pet.father?.catteryName || '', ems: gv('ep-f-ems'), inDb: false };
    pet.mother = { name: gv('ep-m-name'), cattery: gv('ep-m-cattery') || 'other', catteryName: pet.mother?.catteryName || '', ems: gv('ep-m-ems'), inDb: false };

    // Родословная: pedigree[0..59] — 5 поколений
    const mkAnc = prefix => ({ name: gv(`${prefix}-name`), ems: gv(`${prefix}-ems`), cattery: 'other' });
    pet.pedigree = [
      // Gen 2 [0-3]
      mkAnc('ep-ff'),  mkAnc('ep-fm'),  mkAnc('ep-mf'),  mkAnc('ep-mm'),
      // Gen 3 [4-11]
      mkAnc('ep-fff'), mkAnc('ep-ffm'), mkAnc('ep-fmf'), mkAnc('ep-fmm'),
      mkAnc('ep-mff'), mkAnc('ep-mfm'), mkAnc('ep-mmf'), mkAnc('ep-mmm'),
      // Gen 4 [12-27]
      mkAnc('ep-ffff'), mkAnc('ep-fffm'), mkAnc('ep-ffmf'), mkAnc('ep-ffmm'),
      mkAnc('ep-fmff'), mkAnc('ep-fmfm'), mkAnc('ep-fmmf'), mkAnc('ep-fmmm'),
      mkAnc('ep-mfff'), mkAnc('ep-mffm'), mkAnc('ep-mfmf'), mkAnc('ep-mfmm'),
      mkAnc('ep-mmff'), mkAnc('ep-mmfm'), mkAnc('ep-mmmf'), mkAnc('ep-mmmm'),
      // Gen 5 [28-59]
      mkAnc('ep-fffff'), mkAnc('ep-ffffm'), mkAnc('ep-fffmf'), mkAnc('ep-fffmm'),
      mkAnc('ep-ffmff'), mkAnc('ep-ffmfm'), mkAnc('ep-ffmmf'), mkAnc('ep-ffmmm'),
      mkAnc('ep-fmfff'), mkAnc('ep-fmffm'), mkAnc('ep-fmfmf'), mkAnc('ep-fmfmm'),
      mkAnc('ep-fmmff'), mkAnc('ep-fmmfm'), mkAnc('ep-fmmmf'), mkAnc('ep-fmmmm'),
      mkAnc('ep-mffff'), mkAnc('ep-mfffm'), mkAnc('ep-mffmf'), mkAnc('ep-mffmm'),
      mkAnc('ep-mfmff'), mkAnc('ep-mfmfm'), mkAnc('ep-mfmmf'), mkAnc('ep-mfmmm'),
      mkAnc('ep-mmfff'), mkAnc('ep-mmffm'), mkAnc('ep-mmfmf'), mkAnc('ep-mmfmm'),
      mkAnc('ep-mmmff'), mkAnc('ep-mmmfm'), mkAnc('ep-mmmmf'), mkAnc('ep-mmmmm'),
    ];

    pet.titles = Array.from(document.querySelectorAll('#titleSelect input:checked')).map(el => el.value);
    pet.tags   = Array.from(document.querySelectorAll('[data-tag="tag"]:checked')).map(el => el.value);
    pet.traits = Array.from(document.querySelectorAll('.trait-chip.selected')).map(el => el.dataset.trait);
    pet.traitComment = document.getElementById('e-trait-comment').value;

    const tests = {};
    document.querySelectorAll('[data-test]').forEach(sel => { tests[sel.dataset.test] = sel.value; });
    pet.geneticTests = tests;

    state.editingId = null;
    saveState();
    callbacks?.onSave?.();
    showToast('Данные сохранены');
  });

  // Отмена
  document.getElementById('cancelEditBtn')?.addEventListener('click', () => {
    state.editingId = null;
    callbacks?.onCancel?.();
  });
}

// Drag-and-drop загрузка фото на зону
function setupDragDrop(zoneId, pet, onLoad) {
  const zone = document.getElementById(zoneId);
  if (!zone) return;
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => {
      pet.photo = ev.target.result;
      onLoad?.();
    };
    reader.readAsDataURL(file);
  });
}

// Выбор фото через input[file]
function pickPhoto(pet, onLoad) {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'image/jpeg,image/png,image/webp';
  inp.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      pet.photo = ev.target.result;
      onLoad?.();
    };
    reader.readAsDataURL(file);
  };
  inp.click();
}
