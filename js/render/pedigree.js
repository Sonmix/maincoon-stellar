// ═══════════════════════════════════════════════
//  RENDER PEDIGREE — Модальное окно родословной
// ═══════════════════════════════════════════════
import { openModal } from '../ui/modals.js';
import { calcWrightCoefficient } from '../helpers.js';

// Открыть модальное окно родословной для питомца
export function openPedigree(pet) {
  const content = document.getElementById('pedigreeContent');
  if (!content) return;

  const p = pet.pedigree || [];
  const F = calcWrightCoefficient(pet.father, pet.mother, p);
  const fColor = F === 0
    ? 'var(--emerald)'
    : F < 6.25  ? 'var(--emerald)'
    : F < 12.5  ? '#ffd700'
    : 'var(--red)';
  const fComment = F === 0
    ? 'Общих предков в указанных поколениях не обнаружено.'
    : F < 6.25  ? 'Низкий уровень инбридинга — в пределах нормы.'
    : F < 12.5  ? 'Умеренный инбридинг — рекомендуется проверить пару.'
    : 'Высокий инбридинг — нежелателен для племенного разведения.';

  content.innerHTML = `
    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:14px;font-family:var(--font-ui)">
      Животное: <strong style="color:var(--text-primary)">${pet.name}</strong>
    </div>

    <!-- Заголовки поколений -->
    <div style="display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:6px;margin-bottom:5px">
      ${genLabel('I — Родители')}
      ${genLabel('II — Деды/бабки')}
      ${genLabel('III — Прадеды')}
    </div>

    <!-- Сетка родословной: 3 колонки × 8 строк -->
    <div style="display:grid;grid-template-columns:1.2fr 1fr 1fr;grid-template-rows:repeat(8,minmax(46px,auto));gap:5px;align-items:stretch">
      ${pCell(pet.father, '♂ Отец',          'grid-row:1/5;grid-column:1')}
      ${pCell(p[0],       '♂ Отец отца',     'grid-row:1/3;grid-column:2')}
      ${pCell(p[1],       '♀ Мать отца',     'grid-row:3/5;grid-column:2')}
      ${pCell(p[4],       'FFF',              'grid-row:1;grid-column:3')}
      ${pCell(p[5],       'FFM',              'grid-row:2;grid-column:3')}
      ${pCell(p[6],       'FMF',              'grid-row:3;grid-column:3')}
      ${pCell(p[7],       'FMM',              'grid-row:4;grid-column:3')}

      ${pCell(pet.mother, '♀ Мать',          'grid-row:5/9;grid-column:1')}
      ${pCell(p[2],       '♂ Отец матери',   'grid-row:5/7;grid-column:2')}
      ${pCell(p[3],       '♀ Мать матери',   'grid-row:7/9;grid-column:2')}
      ${pCell(p[8],       'MFF',              'grid-row:5;grid-column:3')}
      ${pCell(p[9],       'MFM',              'grid-row:6;grid-column:3')}
      ${pCell(p[10],      'MMF',              'grid-row:7;grid-column:3')}
      ${pCell(p[11],      'MMM',              'grid-row:8;grid-column:3')}
    </div>

    <!-- Коэффициент инбридинга -->
    <div style="margin-top:14px;padding:12px 16px;background:rgba(63,210,255,0.04);border:1px solid var(--border);border-radius:var(--radius);display:flex;align-items:center;gap:24px">
      <div style="flex-shrink:0">
        <div style="font-family:var(--font-ui);font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:4px">Коэффициент инбридинга</div>
        <div style="font-family:var(--font-ui);font-size:26px;font-weight:700;color:${fColor};line-height:1">F = ${F}%</div>
      </div>
      <div style="font-size:11px;color:var(--text-secondary);line-height:1.65;border-left:1px solid var(--border);padding-left:20px">
        Расчёт по формуле Райта на основании введённых предков.<br>
        ${fComment}
      </div>
    </div>
  `;

  openModal('pedigreeModal');
}

// Заголовок поколения
function genLabel(text) {
  return `<div style="font-family:var(--font-ui);font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-dim);padding:0 10px">${text}</div>`;
}

// Ячейка родословной
function pCell(ancestor, role, gridStyle) {
  const name     = ancestor?.name    || '';
  const ems      = ancestor?.ems     || '';
  const cattery  = ancestor?.cattery || 'other';
  const color    = cattery === 'own' ? 'var(--cyan)'             : 'var(--emerald)';
  const border   = cattery === 'own' ? 'rgba(63,210,255,0.25)'   : 'rgba(40,217,138,0.15)';
  const isEmpty  = !name;

  return `<div style="
    ${gridStyle};
    background: ${isEmpty ? 'rgba(13,22,48,0.4)' : 'rgba(13,22,48,0.85)'};
    border: 1px solid ${isEmpty ? 'rgba(255,255,255,0.05)' : border};
    border-radius: var(--radius-sm);
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
  ">
    <div style="font-family:var(--font-ui);font-size:9px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-dim)">${role}</div>
    <div style="font-family:var(--font-ui);font-size:${name.length > 22 ? '10px' : '12px'};font-weight:700;color:${isEmpty ? 'var(--text-dim)' : color};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name || '—'}</div>
    ${ems ? `<div style="font-size:10px;color:var(--text-dim)">${ems}</div>` : ''}
  </div>`;
}

// Для обратной совместимости
export function buildPedigreeGrid() { return ''; }
