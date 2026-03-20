// ═══════════════════════════════════════════════
//  RENDER BREEDING PANEL — Прогноз вязки
// ═══════════════════════════════════════════════
import { state } from '../state.js';
import { calcAge, genderSymbol } from '../helpers.js';
import { predictOffspring, analyzeCompatibility, calcOffspringInbreeding, getGenotype } from '../genetics.js';
import { showToast } from '../ui/toast.js';
import { EMS_COLORS, EMS_PATTERNS, GENETIC_TESTS } from '../config.js';
import { applyI18n, isEN } from '../i18n.js';

// Русские имена цветов EMS
const COLOR_NAMES = {
  n: 'Чёрный',
  a: 'Голубой',
  d: 'Красный',
  e: 'Кремовый',
  f: 'Черепаховый',
  g: 'Голубо-кремовый',
  w: 'Белый',
  b: 'Шоколадный',
  c: 'Лиловый',
  h: 'Шоколадно-черепаховый',
  i: 'Лилово-черепаховый',
  j: 'Коричный',
  k: 'Фавн',
};

// CSS-цвет или градиент для свотча по коду EMS
const COLOR_SWATCHES = {
  n: '#2a2a2a',
  a: '#7a9cbf',
  d: '#c85c2a',
  e: '#d4a068',
  f: 'linear-gradient(135deg, #1a1a1a 50%, #c85c2a 50%)',
  g: 'linear-gradient(135deg, #7a9cbf 50%, #d4a068 50%)',
  w: '#c8d4e8',
  b: '#6b3a2a',
  c: '#9b7aa0',
  h: 'linear-gradient(135deg, #6b3a2a 50%, #c85c2a 50%)',
  i: 'linear-gradient(135deg, #9b7aa0 50%, #d4a068 50%)',
  j: '#a0522d',
  k: '#c8a882',
};

// Черепаховые окрасы — только самки
const TORTIE_COLORS = new Set(['f', 'g', 'h', 'i']);

// HTML мини-карточки выбранного питомца
function renderMiniCard(pet) {
  if (!pet) {
    return `<div class="pair-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <span>Не выбран</span>
    </div>`;
  }

  const age = calcAge(pet.dob);
  const sym = genderSymbol(pet.gender);
  const accent = pet.cattery === 'own' ? 'cyan' : 'emerald';
  const photoStyle = pet.photo
    ? `background-image:url('${pet.photo}');background-size:cover;background-position:center`
    : `background: var(--bg-surface)`;

  return `<div class="pair-pet-card">
    <div class="pair-pet-avatar" style="${photoStyle}">
      ${!pet.photo ? `<svg viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" stroke-width="1.5" style="width:28px;height:28px">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>` : ''}
    </div>
    <div class="pair-pet-info">
      <div class="pair-pet-name" style="color:var(--${accent})">${pet.name || '—'}</div>
      <div class="pair-pet-meta">
        <span class="pair-pet-ems">${pet.ems || '—'}</span>
        ${pet.catteryName ? `<span class="pair-pet-cattery">${pet.catteryName}</span>` : ''}
      </div>
      <div class="pair-pet-age">${sym} · ${age}</div>
    </div>
  </div>`;
}

// HTML <select> выбора питомца для слота
function renderSelect(slotId, gender, selectedId) {
  const filtered = state.pets.filter(p => p.gender === gender);
  const opts = filtered.map(p =>
    `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>
      ${p.name || '—'}${p.ems ? ' · ' + p.ems : ''}
    </option>`
  ).join('');

  return `<select class="pair-select" id="${slotId}Select">
    <option value="">— выбрать —</option>
    ${opts}
  </select>`;
}

// HTML карточки одного цветового варианта потомка
function renderColorCard(item) {
  const pct = Math.round(item.prob * 100);
  const name = COLOR_NAMES[item.emsColor] || item.emsColor;
  const swatch = COLOR_SWATCHES[item.emsColor] || '#555';
  const isTortie = TORTIE_COLORS.has(item.emsColor);
  const genderLabel = isTortie ? '(только ♀)' : (item.gender === 'female' ? '♀ Кошка' : '♂ Кот');
  const isGradient = swatch.startsWith('linear-gradient');
  const swatchStyle = isGradient
    ? `background: ${swatch}`
    : `background-color: ${swatch}`;

  const emsCode = item.emsSilver
    ? `${item.emsColor}s${item.emsPattern ? ' ' + item.emsPattern : ''}`
    : `${item.emsColor}${item.emsPattern ? ' ' + item.emsPattern : ''}`;

  const badges = [];
  badges.push(`<span class="color-badge">${emsCode}</span>`);
  if (item.emsSilver) badges.push(`<span class="color-badge silver">серебристый</span>`);
  if (item.emsPattern) {
    const patternName = EMS_PATTERNS[item.emsPattern];
    if (patternName) badges.push(`<span class="color-badge pattern">${patternName}</span>`);
  }
  if (item.spottingType === 'van')     badges.push(`<span class="color-badge spotting">ван/арлекин</span>`);
  else if (item.spottingType === 'bicolor') badges.push(`<span class="color-badge spotting">биколор</span>`);
  if (item.isWW)        badges.push(`<span class="color-badge ww-badge">⚠ WW</span>`);

  return `<div class="color-card" style="--card-color: ${swatch}">
    <div class="color-swatch" style="${swatchStyle}"></div>
    <div class="color-info">
      <div class="color-name">${name}</div>
      <div class="color-badges">${badges.join('')}</div>
      <div class="color-gender${isTortie ? ' tortie-only' : ''}">${genderLabel}</div>
    </div>
    <div class="color-prob">${pct}%</div>
  </div>`;
}

// HTML строки совместимости по тесту
function renderCompatRow(sire, dam, test) {
  const sR = sire?.geneticTests?.[test] || 'unknown';
  const dR = dam?.geneticTests?.[test]  || 'unknown';
  const sClass = testResultClass(sR);
  const dClass  = testResultClass(dR);

  return `<div class="compat-row">
    <div class="compat-test-name">${test}</div>
    <div class="compat-sides">
      <span class="compat-result ${sClass}">${sR === 'unknown' ? '?' : sR}</span>
      <span class="compat-divider">×</span>
      <span class="compat-result ${dClass}">${dR === 'unknown' ? '?' : dR}</span>
    </div>
  </div>`;
}

function testResultClass(r) {
  if (!r || r === 'unknown') return 'result-unknown';
  const parts = r.split('/');
  if (parts.every(p => p === 'N')) return 'result-ok';
  if (parts.includes('N')) return 'result-carrier';
  return 'result-danger';
}

// HTML блока инбридинга
function renderInbreedingBlock(F, topAncestors = []) {
  let cls = 'inbreed-ok';
  let label = 'Норма';
  if (F >= 12.5) { cls = 'inbreed-danger'; label = 'Высокий'; }
  else if (F >= 6.25) { cls = 'inbreed-warn'; label = 'Умеренный'; }

  const ancestorsHtml = topAncestors.length > 0
    ? `<div class="inbreeding-ancestors">
        <div class="inbreeding-ancestors-title">Источники инбридинга:</div>
        ${topAncestors.map(a => `<div class="ancestor-row">
          <span class="ancestor-name">• ${a.name}</span>
          <span class="ancestor-contrib">+${a.contrib.toFixed(2)}%</span>
        </div>`).join('')}
      </div>`
    : '';

  return `<div class="inbreeding-block ${cls}">
    <div class="inbreeding-label">Коэффициент инбридинга (F)</div>
    <div class="inbreeding-value">${F.toFixed(2)}%</div>
    <div class="inbreeding-status">${label}</div>
    ${ancestorsHtml}
  </div>`;
}

// Квадрат Паннета — визуальная таблица для аутосомных локусов I, D, Mc
function renderPunnettSquare(sire, dam) {
  const sireGt = getGenotype(sire);
  const damGt  = getGenotype(dam);

  const loci = [
    { key: 'I',  label: 'Серебро (I)',     dominant: 'I',  recessive: 'i',  domColor: '#8a4fff', domLabel: 'серебряный',   recLabel: 'не серебряный' },
    { key: 'D',  label: 'Разбавление (D)', dominant: 'D',  recessive: 'd',  domColor: '#3fd2ff', domLabel: 'плотный',      recLabel: 'разбавленный'  },
    { key: 'Mc', label: 'Паттерн (Mc)',    dominant: 'Mc', recessive: 'mc', domColor: '#28d98a', domLabel: 'тигровый',     recLabel: 'мраморный'     },
  ];

  const sections = [];
  for (const locus of loci) {
    const sA = sireGt[locus.key];
    const dA = damGt[locus.key];
    // Пропускаем если нет полных данных у обоих родителей
    if (!sA || !sA[0] || !sA[1] || !dA || !dA[0] || !dA[1]) continue;

    const isMulti = locus.dominant.length > 1 || locus.recessive.length > 1;
    const dom = locus.dominant;
    const rec = locus.recessive;

    const cellInfo = (a1, a2) => {
      const isDom1 = a1 === dom;
      const isDom2 = a2 === dom;
      let label;
      if (isMulti) {
        if (isDom1 && isDom2)       label = `${dom}/${dom}`;
        else if (isDom1 || isDom2)  label = `${dom}/${rec}`;
        else                        label = `${rec}/${rec}`;
      } else {
        if (isDom1 && isDom2)       label = `${dom}${dom}`;
        else if (isDom1 || isDom2)  label = `${dom}${rec}`;
        else                        label = `${rec}${rec}`;
      }
      if (isDom1 && isDom2)   return { cls: 'dominant',     label, desc: locus.domLabel };
      if (!isDom1 && !isDom2) return { cls: 'recessive',    label, desc: locus.recLabel };
      return                         { cls: 'heterozygous', label, desc: 'гетерозиготный' };
    };

    const renderCell = c => `<div class="punnett-cell ${c.cls}">
      <div class="punnett-cell-genotype">${c.label}</div>
      <div class="punnett-cell-label">${c.desc}</div>
    </div>`;

    sections.push(`<div class="punnett-locus">
      <div class="punnett-locus-title">
        <span style="color:${locus.domColor};margin-right:4px">◆</span>ЛОКУС: ${locus.label}
      </div>
      <div class="punnett-grid">
        <div class="punnett-corner"></div>
        <div class="punnett-header-cell">${sA[0]}</div>
        <div class="punnett-header-cell">${sA[1]}</div>
        <div class="punnett-header-cell">${dA[0]}</div>
        ${renderCell(cellInfo(sA[0], dA[0]))}
        ${renderCell(cellInfo(sA[1], dA[0]))}
        <div class="punnett-header-cell">${dA[1]}</div>
        ${renderCell(cellInfo(sA[0], dA[1]))}
        ${renderCell(cellInfo(sA[1], dA[1]))}
      </div>
    </div>`);
  }

  if (sections.length === 0) return '';

  return `<div class="results-section punnett-section">
    <div class="results-section-title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="3" y1="15" x2="21" y2="15"/>
        <line x1="9" y1="3" x2="9" y2="21"/>
        <line x1="15" y1="3" x2="15" y2="21"/>
      </svg>
      КВАДРАТ ПАННЕТА — ЛОКУСЫ
    </div>
    ${sections.join('')}
  </div>`;
}

// HTML предупреждений совместимости
function renderWarnings(warnings) {
  if (!warnings.length) {
    return `<div class="warning-row ok-row">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Критических генетических рисков не выявлено
    </div>`;
  }
  return warnings.map(w => `<div class="warning-row ${w.level === 'danger' ? 'danger-row' : 'warn-row'}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;flex-shrink:0">
      ${w.level === 'danger'
        ? '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
        : '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'}
    </svg>
    ${w.msg}
  </div>`).join('');
}

// Основная функция рендера панели
export function renderBreedingPanel() {
  const container = document.getElementById('breedingContent');
  if (!container) return;

  // Определить начальные значения слотов
  let initSireId = '';
  let initDamId  = '';

  if (state.breedingPetId) {
    const pet = state.pets.find(p => p.id === state.breedingPetId);
    if (pet?.gender === 'male')   initSireId = state.breedingPetId;
    if (pet?.gender === 'female') initDamId  = state.breedingPetId;
  }

  container.innerHTML = buildPanelHTML(initSireId, initDamId);
  attachEvents(container);
}

// Построить HTML панели
function buildPanelHTML(initSireId, initDamId) {
  const sire = state.pets.find(p => p.id === initSireId) || null;
  const dam  = state.pets.find(p => p.id === initDamId)  || null;

  return `
  <div class="breeding-header">
    <h2 class="breeding-title">✦ ПРОГНОЗ ВЯЗКИ</h2>
    <p class="breeding-subtitle">Выберите кота и кошку для расчёта потомства</p>
    <div class="breeding-separator"></div>
  </div>

  <div class="breeding-pair">
    <div class="pair-slot male" id="sireSlot">
      <div class="pair-slot-label">♂ КОТ / ОТЕЦ</div>
      ${renderSelect('sire', 'male', initSireId)}
      <div class="pair-mini-card" id="sireMiniCard">${renderMiniCard(sire)}</div>
    </div>

    <div class="pair-connector">
      <div class="connector-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>
        </svg>
      </div>
      <button class="calc-btn" id="calcBtn" disabled>
        Рассчитать ⚡
      </button>
    </div>

    <div class="pair-slot female" id="damSlot">
      <div class="pair-slot-label">♀ КОШКА / МАТЬ</div>
      ${renderSelect('dam', 'female', initDamId)}
      <div class="pair-mini-card" id="damMiniCard">${renderMiniCard(dam)}</div>
    </div>
  </div>

  <div class="breeding-results" id="breedingResults" style="display:none">
    <!-- Заполняется после расчёта -->
  </div>`;
}

// Навесить обработчики событий
function attachEvents(container) {
  const sireSelect = container.querySelector('#sireSelect');
  const damSelect  = container.querySelector('#damSelect');
  const calcBtn    = container.querySelector('#calcBtn');

  sireSelect?.addEventListener('change', () => onSelectChange(container));
  damSelect?.addEventListener('change',  () => onSelectChange(container));
  calcBtn?.addEventListener('click', () => onCalculate(container));

  // Обновить состояние кнопки при начальных значениях
  updateCalcBtn(container);
}

// Обработчик смены выбора в слоте
function onSelectChange(container) {
  const sireId = container.querySelector('#sireSelect')?.value;
  const damId  = container.querySelector('#damSelect')?.value;

  const sire = state.pets.find(p => p.id === sireId) || null;
  const dam  = state.pets.find(p => p.id === damId)  || null;

  const sireCard = container.querySelector('#sireMiniCard');
  const damCard  = container.querySelector('#damMiniCard');
  if (sireCard) sireCard.innerHTML = renderMiniCard(sire);
  if (damCard)  damCard.innerHTML  = renderMiniCard(dam);

  if (isEN()) {
    if (sireCard) applyI18n(sireCard);
    if (damCard)  applyI18n(damCard);
  }

  updateCalcBtn(container);

  // Скрыть результаты при смене
  const results = container.querySelector('#breedingResults');
  if (results) results.style.display = 'none';
}

// Обновить доступность кнопки расчёта
function updateCalcBtn(container) {
  const sireId = container.querySelector('#sireSelect')?.value;
  const damId  = container.querySelector('#damSelect')?.value;
  const btn    = container.querySelector('#calcBtn');
  if (btn) btn.disabled = !(sireId && damId);
}

// Запустить расчёт
function onCalculate(container) {
  const sireId = container.querySelector('#sireSelect')?.value;
  const damId  = container.querySelector('#damSelect')?.value;

  const sire = state.pets.find(p => p.id === sireId);
  const dam  = state.pets.find(p => p.id === damId);

  if (!sire || !dam) {
    showToast('Выберите обоих родителей', 'error');
    return;
  }

  // Проверяем наличие генетических данных: нужен хотя бы emsColor или генетическая формула
  const hasSireData = !!(sire.emsColor || sire.geneticFormula?.trim());
  const hasDamData  = !!(dam.emsColor  || dam.geneticFormula?.trim());

  if (!hasSireData || !hasDamData) {
    const missing = [];
    if (!hasSireData) missing.push(`♂ ${sire.name || 'Отец'}`);
    if (!hasDamData)  missing.push(`♀ ${dam.name  || 'Мать'}`);
    showToast(`Нет генетических данных: ${missing.join(', ')}. Заполните EMS или формулу.`, 'error');
    return;
  }

  try {
    const offspring  = predictOffspring(sire, dam);
    const warnings   = analyzeCompatibility(sire, dam);
    const inbreeding = calcOffspringInbreeding(sire, dam, state.pets);

    renderResults(container, sire, dam, offspring, warnings, inbreeding);
  } catch (e) {
    console.error('Ошибка расчёта вязки:', e);
    showToast('Ошибка при расчёте', 'error');
  }
}

// Построить HTML секции потомства (♀ или ♂)
function renderOffspringSection(items, sexLabel) {
  if (!items.length) return '';
  const icon = sexLabel === 'female' ? '♀' : '♂';
  const title = sexLabel === 'female' ? 'КОТЯТА ♀' : 'КОТЯТА ♂';
  const cls = sexLabel === 'female' ? 'offspring-female' : 'offspring-male';
  return `<div class="offspring-section ${cls}">
    <div class="offspring-section-title">
      <span class="offspring-icon">${icon}</span>
      ${title}
    </div>
    <div class="color-cards-grid">
      ${items.map(renderColorCard).join('')}
    </div>
  </div>`;
}

// Отрисовать результаты расчёта
function renderResults(container, sire, dam, offspring, warnings, inbreeding) {
  const F            = inbreeding.F;
  const topAncestors = inbreeding.topAncestors || [];
  const results = container.querySelector('#breedingResults');
  if (!results) return;

  const females = offspring.filter(o => o.gender === 'female');
  const males   = offspring.filter(o => o.gender === 'male');
  const hasWW   = offspring.some(o => o.isWW);

  const wwWarning = hasWW
    ? `<div class="ww-warning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;flex-shrink:0">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        Внимание: возможны WW-гомозиготные котята (100% белых). WW при голубых глазах связан с риском врождённой глухоты.
      </div>`
    : '';

  const colorSection = offspring.length > 0
    ? `<div class="results-section">
        <div class="results-section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4l3 3"/>
          </svg>
          ПОТОМСТВО — ПРОГНОЗ ОКРАСА
        </div>
        ${wwWarning}
        ${renderOffspringSection(females, 'female')}
        ${renderOffspringSection(males,   'male')}
      </div>`
    : `<div class="results-section">
        <div class="results-section-title">ПОТОМСТВО — ПРОГНОЗ ОКРАСА</div>
        <div class="no-genetics-msg">
          Недостаточно генетических данных для прогноза окраса.<br>
          Заполните поле «Генетическая формула» или данные EMS у родителей.
        </div>
      </div>`;

  const punnettHtml = renderPunnettSquare(sire, dam);

  results.innerHTML = `
    ${colorSection}

    ${punnettHtml}

    <div class="results-section">
      <div class="results-section-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px">
          <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
        </svg>
        АНАЛИЗ СОВМЕСТИМОСТИ
      </div>

      <div class="compat-tests">
        <div class="compat-header">
          <span>Тест</span>
          <span>Отец × Мать</span>
        </div>
        ${GENETIC_TESTS.map(t => renderCompatRow(sire, dam, t)).join('')}
      </div>

      <div class="compat-warnings">
        ${renderWarnings(warnings)}
      </div>

      ${renderInbreedingBlock(F, topAncestors)}
    </div>`;

  results.style.display = 'block';
  if (isEN()) applyI18n(results);
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
