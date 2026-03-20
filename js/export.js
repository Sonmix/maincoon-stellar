// ═══════════════════════════════════════════════
//  EXPORT — Экспорт данных питомника
//  Форматы: .txt / .md / .html / .zip
// ═══════════════════════════════════════════════
import { state } from './state.js';
import { showToast } from './ui/toast.js';

// ── Вспомогательные функции ──────────────────────

function _fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function _fmtAge(dob) {
  if (!dob) return '';
  const now = new Date();
  const birth = new Date(dob + 'T00:00:00');
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years === 0) return `${months} мес.`;
  return months > 0 ? `${years} л. ${months} мес.` : `${years} л.`;
}

function _genderSym(g) {
  return g === 'female' ? '♀' : g === 'male' ? '♂' : '?';
}

function _kittenStatus(s) {
  return s === 'waiting' ? 'ожидает хозяев' : s === 'sold' ? 'продан' : s === 'stays' ? 'остаётся' : s || '—';
}

function _testsStr(pet) {
  const tests = pet.geneticTests || {};
  const pairs = Object.entries(tests).filter(([, v]) => v);
  if (!pairs.length) return '';
  return pairs.map(([k, v]) => `${k}: ${v}`).join(' | ');
}

function _baseName() {
  const d = new Date();
  return `maincoon-stellar-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
}

function _dateFmt() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}

const TYPE_NAMES = {
  heat: 'Течка', breeding: 'Вязка', 'expected-birth': 'Ожид. роды',
  birth: 'Роды', note: 'Заметка', other: 'Другое',
};

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _download(content, filename, mimeType) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Дефолтные секции ─────────────────────────────
const ALL_SECTIONS = { pets: true, litters: true, events: true };

// ── Сборка содержимого TXT ────────────────────────

function _buildTxt(sections = ALL_SECTIONS) {
  const pets    = sections.pets    ? (state.pets    || []) : [];
  const litters = sections.litters ? (state.litters || []) : [];
  const events  = sections.events  ? (state.events  || []) : [];
  const sep = '─'.repeat(52);
  const lines = [];

  lines.push('MAINCOON STELLAR — Экспорт данных');
  lines.push(`Дата экспорта: ${_dateFmt()}`);
  lines.push('═'.repeat(52));
  lines.push('');

  // Питомцы
  lines.push(`ПИТОМЦЫ (${pets.length})`);
  lines.push(sep);
  pets.forEach((p, i) => {
    lines.push(`${i + 1}. ${p.name || '—'}`);
    lines.push(`   Пол: ${_genderSym(p.gender)}  Питомник: ${p.cattery === 'own' ? 'свой' : 'чужой'}${p.catteryName ? ' (' + p.catteryName + ')' : ''}`);
    if (p.dob) lines.push(`   Дата рождения: ${_fmtDate(p.dob)}  Возраст: ${_fmtAge(p.dob)}`);
    if (p.ems) lines.push(`   EMS: ${p.ems}`);
    if (p.geneticFormula) lines.push(`   Генетическая формула: ${p.geneticFormula}`);
    const ts = _testsStr(p);
    if (ts) lines.push(`   Генетические тесты: ${ts}`);
    if (p.titles?.length) lines.push(`   Титулы: ${p.titles.join(', ')}`);
    lines.push('');
  });
  if (!pets.length) { lines.push('   —'); lines.push(''); }

  // Помёты
  lines.push('');
  lines.push(`ПОМЁТЫ (${litters.length})`);
  lines.push(sep);
  litters.forEach((l, i) => {
    const motherPet = pets.find(p => p.id === l.motherId);
    const fatherPet = pets.find(p => p.id === l.fatherId);
    const motherName = motherPet?.name || l.motherName || '—';
    const fatherName = fatherPet?.name || l.fatherName || '—';
    const kittens = l.kittens || [];
    lines.push(`${i + 1}. ${l.title || 'Помёт'} (${_fmtDate(l.date)})`);
    lines.push(`   Мать: ${motherName}  |  Отец: ${fatherName}`);
    if (kittens.length) {
      lines.push(`   Котята (${kittens.length}):`);
      kittens.forEach((k, ki) => {
        lines.push(`     ${ki + 1}. ${k.name || '—'} (${_genderSym(k.gender)}, ${_fmtDate(k.dob)}, ${_kittenStatus(k.status)}${k.emsColor ? ', ' + k.emsColor : ''})`);
      });
    } else {
      lines.push('   Котята: —');
    }
    lines.push('');
  });
  if (!litters.length) { lines.push('   —'); lines.push(''); }

  // События
  lines.push('');
  lines.push(`СОБЫТИЯ ЖУРНАЛА (${events.length})`);
  lines.push(sep);
  [...events].sort((a, b) => (a.date || '').localeCompare(b.date || '')).forEach((ev, i) => {
    const petName = pets.find(p => p.id === ev.petId)?.name || '';
    const typeName = ev.type === 'other' && ev.customLabel ? ev.customLabel : (TYPE_NAMES[ev.type] || ev.type);
    lines.push(`${i + 1}. ${_fmtDate(ev.date)} — ${typeName}${petName ? ' (' + petName + ')' : ''}${ev.description ? ': ' + ev.description : ''}`);
  });
  if (!events.length) lines.push('   —');

  return lines.join('\n');
}

// ── Сборка содержимого MD ─────────────────────────

function _buildMd(sections = ALL_SECTIONS) {
  const pets    = sections.pets    ? (state.pets    || []) : [];
  const litters = sections.litters ? (state.litters || []) : [];
  const events  = sections.events  ? (state.events  || []) : [];
  const lines = [];

  lines.push('# MAINCOON STELLAR — Экспорт данных');
  lines.push('');
  lines.push(`**Дата экспорта:** ${_dateFmt()}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  lines.push(`## Питомцы (${pets.length})`);
  lines.push('');
  pets.forEach((p, i) => {
    lines.push(`### ${i + 1}. ${p.name || '—'}`);
    lines.push('');
    lines.push(`- **Пол:** ${_genderSym(p.gender)}`);
    lines.push(`- **Питомник:** ${p.cattery === 'own' ? 'свой' : 'чужой'}${p.catteryName ? ' — ' + p.catteryName : ''}`);
    if (p.dob) lines.push(`- **Дата рождения:** ${_fmtDate(p.dob)} (${_fmtAge(p.dob)})`);
    if (p.ems) lines.push(`- **EMS:** \`${p.ems}\``);
    if (p.geneticFormula) lines.push(`- **Генетическая формула:** \`${p.geneticFormula}\``);
    const ts = _testsStr(p);
    if (ts) lines.push(`- **Генетические тесты:** ${ts}`);
    if (p.titles?.length) lines.push(`- **Титулы:** ${p.titles.join(', ')}`);
    lines.push('');
  });
  if (!pets.length) { lines.push('*Нет данных*'); lines.push(''); }

  lines.push('---');
  lines.push('');
  lines.push(`## Помёты (${litters.length})`);
  lines.push('');
  litters.forEach((l, i) => {
    const motherPet = pets.find(p => p.id === l.motherId);
    const fatherPet = pets.find(p => p.id === l.fatherId);
    const motherName = motherPet?.name || l.motherName || '—';
    const fatherName = fatherPet?.name || l.fatherName || '—';
    const kittens = l.kittens || [];
    lines.push(`### ${i + 1}. ${l.title || 'Помёт'}`);
    lines.push('');
    lines.push(`- **Дата:** ${_fmtDate(l.date)}`);
    lines.push(`- **Мать:** ${motherName}`);
    lines.push(`- **Отец:** ${fatherName}`);
    if (kittens.length) {
      lines.push(`- **Котята (${kittens.length}):**`);
      kittens.forEach(k => {
        lines.push(`  - ${_genderSym(k.gender)} **${k.name || '—'}** — ${_fmtDate(k.dob)}, ${_kittenStatus(k.status)}${k.emsColor ? ', EMS: ' + k.emsColor : ''}`);
      });
    } else {
      lines.push('- **Котята:** —');
    }
    if (l.notes) lines.push(`- **Заметки:** ${l.notes}`);
    lines.push('');
  });
  if (!litters.length) { lines.push('*Нет данных*'); lines.push(''); }

  lines.push('---');
  lines.push('');
  lines.push(`## События журнала (${events.length})`);
  lines.push('');
  [...events].sort((a, b) => (a.date || '').localeCompare(b.date || '')).forEach(ev => {
    const petName = pets.find(p => p.id === ev.petId)?.name || '';
    const typeName = ev.type === 'other' && ev.customLabel ? ev.customLabel : (TYPE_NAMES[ev.type] || ev.type);
    lines.push(`- **${_fmtDate(ev.date)}** — ${typeName}${petName ? ' (' + petName + ')' : ''}${ev.description ? ': ' + ev.description : ''}`);
  });
  if (!events.length) lines.push('*Нет данных*');

  return lines.join('\n');
}

// ── Сборка содержимого HTML ───────────────────────

function _buildHtml(sections = ALL_SECTIONS) {
  const pets    = sections.pets    ? (state.pets    || []) : [];
  const litters = sections.litters ? (state.litters || []) : [];
  const events  = sections.events  ? (state.events  || []) : [];

  const petsHtml = pets.map((p, i) => {
    const ts = _testsStr(p);
    return `<div class="card">
      <div class="card-title">${i + 1}. ${esc(p.name || '—')}</div>
      <div class="fields">
        <span class="lbl">Пол:</span> ${_genderSym(p.gender)} &nbsp;
        <span class="lbl">Питомник:</span> ${p.cattery === 'own' ? 'свой' : 'чужой'}${p.catteryName ? ' (' + esc(p.catteryName) + ')' : ''}
        ${p.dob ? `&nbsp; <span class="lbl">Дата рождения:</span> ${_fmtDate(p.dob)} (${_fmtAge(p.dob)})` : ''}
        ${p.ems ? `<br><span class="lbl">EMS:</span> <code>${esc(p.ems)}</code>` : ''}
        ${p.geneticFormula ? `<br><span class="lbl">Формула:</span> <code>${esc(p.geneticFormula)}</code>` : ''}
        ${ts ? `<br><span class="lbl">Генетические тесты:</span> ${esc(ts)}` : ''}
        ${p.titles?.length ? `<br><span class="lbl">Титулы:</span> ${esc(p.titles.join(', '))}` : ''}
      </div>
    </div>`;
  }).join('') || '<p class="empty">Нет данных</p>';

  const littersHtml = litters.map((l, i) => {
    const motherPet = pets.find(p => p.id === l.motherId);
    const fatherPet = pets.find(p => p.id === l.fatherId);
    const motherName = motherPet?.name || l.motherName || '—';
    const fatherName = fatherPet?.name || l.fatherName || '—';
    const kittens = l.kittens || [];
    const kHtml = kittens.map(k =>
      `<li>${_genderSym(k.gender)} <strong>${esc(k.name || '—')}</strong> — ${_fmtDate(k.dob)}, ${_kittenStatus(k.status)}${k.emsColor ? ', ' + esc(k.emsColor) : ''}</li>`
    ).join('');
    return `<div class="card">
      <div class="card-title">${i + 1}. ${esc(l.title || 'Помёт')} <span class="date">${_fmtDate(l.date)}</span></div>
      <div class="fields">
        <span class="lbl">Мать:</span> ${esc(motherName)} &nbsp; <span class="lbl">Отец:</span> ${esc(fatherName)}
        ${kHtml ? `<br><span class="lbl">Котята (${kittens.length}):</span><ul>${kHtml}</ul>` : ''}
        ${l.notes ? `<br><span class="lbl">Заметки:</span> ${esc(l.notes)}` : ''}
      </div>
    </div>`;
  }).join('') || '<p class="empty">Нет данных</p>';

  const evHtml = [...events]
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map(ev => {
      const petName = pets.find(p => p.id === ev.petId)?.name || '';
      const typeName = ev.type === 'other' && ev.customLabel ? ev.customLabel : (TYPE_NAMES[ev.type] || ev.type);
      return `<li><strong>${_fmtDate(ev.date)}</strong> — ${esc(typeName)}${petName ? ' (' + esc(petName) + ')' : ''}${ev.description ? ': ' + esc(ev.description) : ''}</li>`;
    }).join('');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>MAINCOON STELLAR — Экспорт данных</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Georgia', serif; background: #050816; color: #e8eeff; margin: 0; padding: 32px; line-height: 1.6; }
  h1 { font-family: serif; color: #3fd2ff; letter-spacing: 0.1em; border-bottom: 1px solid rgba(63,210,255,0.25); padding-bottom: 14px; margin-bottom: 6px; }
  h2 { color: #3fd2ff; font-size: 1em; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 40px; border-bottom: 1px solid rgba(63,210,255,0.12); padding-bottom: 8px; }
  .meta { color: #7a8db8; font-size: 0.85em; margin-bottom: 28px; }
  .card { background: #0d1630; border: 1px solid rgba(63,210,255,0.14); border-radius: 10px; padding: 16px 20px; margin: 10px 0; }
  .card-title { color: #3fd2ff; font-weight: bold; font-size: 1em; margin-bottom: 8px; }
  .date { color: #7a8db8; font-size: 0.85em; margin-left: 10px; font-weight: normal; }
  .fields { color: #c8d4ee; font-size: 0.9em; line-height: 1.9; }
  .lbl { color: #7a8db8; }
  code { background: rgba(63,210,255,0.1); color: #3fd2ff; padding: 1px 6px; border-radius: 4px; font-size: 0.88em; }
  ul { margin: 6px 0 0; padding-left: 20px; }
  li { margin: 3px 0; color: #c8d4ee; }
  .empty { color: #3d4f72; font-style: italic; }
</style>
</head>
<body>
<h1>🐱 MAINCOON STELLAR — Экспорт данных</h1>
<div class="meta">Дата экспорта: ${_dateFmt()} &nbsp;·&nbsp; Питомцев: ${pets.length} &nbsp;·&nbsp; Помётов: ${litters.length} &nbsp;·&nbsp; Событий: ${events.length}</div>

<h2>Питомцы (${pets.length})</h2>
${petsHtml}

<h2>Помёты (${litters.length})</h2>
${littersHtml}

<h2>События журнала (${events.length})</h2>
${evHtml ? `<ul>${evHtml}</ul>` : '<p class="empty">Нет данных</p>'}

</body>
</html>`;
}

// ── Публичные функции экспорта ────────────────────

export function exportTxt(sections = ALL_SECTIONS) {
  _download(_buildTxt(sections), `${_baseName()}.txt`, 'text/plain;charset=utf-8');
  showToast('Экспорт .txt готов', 'success');
}

export function exportMd(sections = ALL_SECTIONS) {
  _download(_buildMd(sections), `${_baseName()}.md`, 'text/markdown;charset=utf-8');
  showToast('Экспорт .md готов', 'success');
}

export function exportHtml(sections = ALL_SECTIONS) {
  _download(_buildHtml(sections), `${_baseName()}.html`, 'text/html;charset=utf-8');
  showToast('Экспорт .html готов', 'success');
}

export async function exportZip(sections = ALL_SECTIONS) {
  const JSZip = window.JSZip;
  if (!JSZip) {
    showToast('Библиотека JSZip не загружена', 'error');
    return;
  }
  try {
    const zip  = new JSZip();
    const base = _baseName();
    zip.file(`${base}.txt`,  _buildTxt(sections));
    zip.file(`${base}.md`,   _buildMd(sections));
    zip.file(`${base}.html`, _buildHtml(sections));
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    _download(blob, `${base}.zip`, 'application/zip');
    showToast('Экспорт .zip готов', 'success');
  } catch (e) {
    console.error('Ошибка создания ZIP:', e);
    showToast('Ошибка создания ZIP', 'error');
  }
}
