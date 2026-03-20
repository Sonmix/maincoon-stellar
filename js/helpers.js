// ═══════════════════════════════════════════════
//  HELPERS — Утилиты и вспомогательные функции
// ═══════════════════════════════════════════════
import { EMS_EYES, TEST_TOOLTIPS } from './config.js';
import { isEN } from './i18n.js';

// Вычислить возраст по дате рождения
export function calcAge(dob) {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  const years  = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  const months = Math.floor((diff % (365.25 * 24 * 3600 * 1000)) / (30.44 * 24 * 3600 * 1000));
  if (isEN()) {
    if (years > 0) return `${years} yr. ${months} mo.`;
    return `${months} mo.`;
  }
  if (years > 0) return `${years} г. ${months} мес.`;
  return `${months} мес.`;
}

// Символ пола
export function genderSymbol(g) {
  return g === 'female' ? '♀' : '♂';
}

// Расчёт % соответствия стандарту по внешности
export function getStandardScore(app) {
  if (!app) return 0;
  const checks = [
    app.skeleton === 'широкий тяжелый',
    app.body === 'вытянутый',
    app.head === 'квадратная',
    app.muzzle && (
      app.muzzle.includes('достаточно широкая, средней длины') ||
      app.muzzle.includes('квадратная, достаточно широкая, средней')
    ),
    app.chin === 'сильный, хорошо выраженный',
    app.nose === 'прямой без горбинки',
    app.profile === 'мягкий изогнутый',
    app.fur === 'шелковистая' || app.fur === 'мягкая',
    app.undercoat === 'густой, плотный',
    app.ears === 'большие' || app.ears === 'очень большие',
    app.eyes === 'большие',
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

// Цвет прогресс-бара стандарта
export function standardBarColor(pct) {
  if (pct >= 80) return 'linear-gradient(90deg, var(--emerald), #20ff80, var(--emerald))';
  if (pct >= 50) return 'linear-gradient(90deg, #ffd700, #ffaa00, #ffd700)';
  return 'linear-gradient(90deg, var(--red), #ff7744, var(--red))';
}

// CSS-класс результата теста
export function testClass(result) {
  if (!result || result === 'unknown' || result === 'тестирование не проводилось') return 'unknown';
  const parts = result.split('/');
  if (parts.every(p => p === 'N')) return 'healthy';
  if (parts[0] === 'N' || parts[1] === 'N') return 'carrier';
  return 'affected';
}

// Тултип для результата теста
export function testTooltip(name, result) {
  const r = result || 'unknown';
  const tips = TEST_TOOLTIPS[name];
  return (tips && tips[r]) ? tips[r] : 'Информация недоступна.';
}

// Метка цвета глаз по EMS-коду
export function eyeColorLabel(code) {
  return EMS_EYES[code] || code || '—';
}

// Безопасно получить значение или '—'
export function val(v) {
  return (v !== null && v !== undefined && v !== '') ? v : '—';
}

// Коэффициент инбридинга по формуле Райта (возвращает % с двумя знаками)
// pedigree[0..11]: FF, FM, MF, MM, FFF, FFM, FMF, FMM, MFF, MFM, MMF, MMM
export function calcWrightCoefficient(father, mother, pedigree) {
  if (!father?.name || !mother?.name) return 0;
  const p    = pedigree || [];
  const norm = s => (s || '').trim().toLowerCase();

  // Предки отца с расстоянием от него
  const sireAnc = [
    p[0]?.name  && { name: norm(p[0].name),  d: 1 },
    p[1]?.name  && { name: norm(p[1].name),  d: 1 },
    p[4]?.name  && { name: norm(p[4].name),  d: 2 },
    p[5]?.name  && { name: norm(p[5].name),  d: 2 },
    p[6]?.name  && { name: norm(p[6].name),  d: 2 },
    p[7]?.name  && { name: norm(p[7].name),  d: 2 },
  ].filter(Boolean);

  // Предки матери с расстоянием от неё
  const damAnc = [
    p[2]?.name  && { name: norm(p[2].name),  d: 1 },
    p[3]?.name  && { name: norm(p[3].name),  d: 1 },
    p[8]?.name  && { name: norm(p[8].name),  d: 2 },
    p[9]?.name  && { name: norm(p[9].name),  d: 2 },
    p[10]?.name && { name: norm(p[10].name), d: 2 },
    p[11]?.name && { name: norm(p[11].name), d: 2 },
  ].filter(Boolean);

  let F = 0;
  for (const sa of sireAnc) {
    for (const da of damAnc) {
      if (sa.name && sa.name === da.name) {
        F += Math.pow(0.5, sa.d + da.d + 1);
      }
    }
  }

  return Math.round(F * 10000) / 100; // % с двумя знаками
}
