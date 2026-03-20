// ═══════════════════════════════════════════════
//  TOAST — Уведомления
// ═══════════════════════════════════════════════
import { translateText, isEN } from '../i18n.js';

let toastTimer = null;

// Показать уведомление
// type: 'success' | 'error' | 'info'
export function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;

  // Сбросить предыдущий таймер
  if (toastTimer) clearTimeout(toastTimer);

  t.textContent = isEN() ? translateText(msg) : msg;

  switch (type) {
    case 'error':
      t.style.borderColor = 'rgba(255,68,102,0.4)';
      t.style.color       = 'var(--red)';
      t.style.boxShadow   = '0 0 20px var(--red-glow)';
      break;
    case 'info':
      t.style.borderColor = 'rgba(138,79,255,0.4)';
      t.style.color       = 'var(--violet)';
      t.style.boxShadow   = '0 0 20px var(--violet-glow)';
      break;
    default: // success
      t.style.borderColor = 'var(--emerald-dim)';
      t.style.color       = 'var(--emerald)';
      t.style.boxShadow   = '0 0 20px var(--emerald-glow)';
  }

  t.classList.add('show');
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}
