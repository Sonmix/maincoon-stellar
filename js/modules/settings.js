// ═══════════════════════════════════════════════
//  SETTINGS — Модуль настроек приложения
// ═══════════════════════════════════════════════
import { state, saveState } from '../state.js';
import { STORAGE_KEY } from '../config.js';
import { openModal, closeModal, openConfirm } from '../ui/modals.js';
import { showToast } from '../ui/toast.js';
import { applyI18n, isEN } from '../i18n.js';

// Применить все настройки к DOM (вызывается при старте и при изменении)
export function applySettings() {
  document.body.dataset.today = state.settings.calendarTodayStyle || 'vignette';
  document.body.dataset.theme = state.settings.theme || 'stellar';
  document.body.dataset.lang  = state.lang || 'ru';

  // Синхронизировать активный класс на lang-btn
  const lang = state.lang || 'ru';
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
}

export function initSettings() {
  applySettings();

  // Открыть модал по кнопке ⚙
  document.getElementById('openSettings')
    ?.addEventListener('click', () => {
      _syncUI();
      openModal('settingsModal');
    });

  // Закрыть модал
  document.getElementById('closeSettingsModal')
    ?.addEventListener('click', () => closeModal('settingsModal'));

  // Toggle «стиль сегодня»
  document.getElementById('calendarTodayStyleToggle')
    ?.addEventListener('click', e => {
      const btn = e.target.closest('.stoggle-btn');
      if (!btn) return;
      const value = btn.dataset.value;
      state.settings.calendarTodayStyle = value;
      saveState();
      applySettings();
      _syncUI();
    });

  // Toggle «тема»
  document.getElementById('themeToggle')
    ?.addEventListener('click', e => {
      const btn = e.target.closest('.stoggle-btn');
      if (!btn) return;
      const value = btn.dataset.value;
      state.settings.theme = value;
      saveState();
      applySettings();
      _syncUI();
      const names = { stellar: 'Тема: Stellar 🌌', dark: 'Тема: Dark 🌙', light: 'Тема: Light ☀️' };
      showToast(names[value] || 'Тема изменена', 'success');
    });

  // Кнопка «Сбросить все данные» — тройная защита
  document.getElementById('resetAllDataBtn')
    ?.addEventListener('click', _resetStep1);

  // Переключатель языка (язык сохраняется → страница перезагружается)
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const newLang = btn.dataset.lang;
      if (newLang === state.lang) return;
      state.lang = newLang;
      saveState();
      // Синхронизировать активный класс без перезагрузки для мгновенного отклика
      document.querySelectorAll('.lang-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.lang === newLang);
      });
      // Перезагрузить страницу — чистый рендер в нужном языке
      window.location.reload();
    });
  });

}

// ── Тройная защита сброса данных ──────────────────────────────────

function _resetStep1() {
  const pets    = state.pets?.length    || 0;
  const litters = state.litters?.length || 0;
  const events  = state.events?.length  || 0;

  // Закрываем настройки чтобы confirm не прятался за ними (confirmModal раньше в DOM)
  closeModal('settingsModal');

  openConfirm({
    title: isEN() ? '⚠ Reset all data?' : '⚠ Сбросить все данные?',
    text: isEN()
      ? `This will permanently delete:\n• ${pets} pet${pets !== 1 ? 's' : ''}\n• ${litters} litter${litters !== 1 ? 's' : ''}\n• ${events} journal event${events !== 1 ? 's' : ''}\n• All photos (stored as base64)\n\nThis action cannot be undone.`
      : `Будут удалены навсегда:\n• ${pets} питомцев\n• ${litters} помётов\n• ${events} событий журнала\n• Все фотографии (хранятся внутри данных)\n\nДействие необратимо.`,
    confirmText: isEN() ? 'Continue →' : 'Продолжить →',
    onConfirm: _resetStep2,
  });
}

function _resetStep2() {
  openConfirm({
    title: isEN() ? '🚨 Last warning' : '🚨 Последнее предупреждение',
    text: isEN()
      ? 'There is NO backup. After deletion, your data will be gone FOREVER.\nAre you absolutely sure?'
      : 'Резервной копии нет. После удаления данные исчезнут НАВСЕГДА.\nВы абсолютно уверены?',
    confirmText: isEN() ? 'Yes, delete everything' : 'Да, удалить всё',
    onConfirm: _resetStep3,
  });
}

function _resetStep3() {
  openConfirm({
    title: isEN() ? '💀 Point of no return' : '💀 Точка невозврата',
    text: isEN()
      ? 'FINAL CONFIRMATION.\nAll your cats, litters, events and photos will be erased.\nThis is your last chance to cancel.'
      : 'ФИНАЛЬНОЕ ПОДТВЕРЖДЕНИЕ.\nВсе питомцы, помёты, события и фото будут уничтожены.\nЭто последний шанс отменить.',
    confirmText: isEN() ? '☢ ERASE EVERYTHING' : '☢ УНИЧТОЖИТЬ ВСЁ',
    onConfirm: () => {
      // Сохраняем пустой стейт (не удаляем ключ!) — иначе defaults загрузятся заново
      state.pets    = [];
      state.events  = [];
      state.litters = [];
      saveState();
      closeModal('settingsModal');
      showToast(isEN() ? 'All data erased. Reloading...' : 'Все данные удалены. Перезагрузка...', 'success');
      setTimeout(() => window.location.reload(), 1200);
    },
  });
}

// Синхронизировать UI-тогглы с текущими значениями настроек
function _syncUI() {
  const todayToggle = document.getElementById('calendarTodayStyleToggle');
  if (todayToggle) {
    const cur = state.settings.calendarTodayStyle;
    todayToggle.querySelectorAll('.stoggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === cur);
    });
  }

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const cur = state.settings.theme || 'stellar';
    themeToggle.querySelectorAll('.stoggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === cur);
    });
  }
}
