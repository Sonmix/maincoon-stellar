// ═══════════════════════════════════════════════
//  JOURNAL RENDER — Отрисовка блока «Журнал»
// ═══════════════════════════════════════════════
import { state, saveState } from '../state.js';
import { openModal, closeModal, openConfirm } from '../ui/modals.js';
import { showToast } from '../ui/toast.js';
import { debugLogEventAdded, debugLogEventDeleted, debugLogEventsState } from '../debug.js';
import { isEN } from '../i18n.js';

// Модульное состояние журнала
let currentYear  = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-based
let selectedDate = null; // 'YYYY-MM-DD' | null
let pickerOpen   = false;
let pickerYear   = new Date().getFullYear(); // год в пикере (независимо от currentYear)

const MONTHS_RU = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
];

const MONTHS_EN = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const MONTHS_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
const MONTHS_SHORT_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const MONTHS_PICKER_RU = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
const MONTHS_PICKER_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const WEEKDAYS_RU = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const WEEKDAYS_EN = ['Mo','Tu','We','Th','Fr','Sa','Su'];

const EVENT_LABELS_RU = {
  heat:             'Течка',
  breeding:         'Вязка',
  'expected-birth': 'Ожид. роды',
  birth:            'Роды',
  note:             'Заметка',
  other:            'Другое',
};
const EVENT_LABELS_EN = {
  heat:             'Heat',
  breeding:         'Breeding',
  'expected-birth': 'Exp. birth',
  birth:            'Birth',
  note:             'Note',
  other:            'Other',
};

// Геттеры с учётом языка
function months()      { return isEN() ? MONTHS_EN : MONTHS_RU; }
function monthsShort() { return isEN() ? MONTHS_SHORT_EN : MONTHS_SHORT; }
function monthsPicker(){ return isEN() ? MONTHS_PICKER_EN : MONTHS_PICKER_RU; }
function weekdays()    { return isEN() ? WEEKDAYS_EN : WEEKDAYS_RU; }
function eventLabels() { return isEN() ? EVENT_LABELS_EN : EVENT_LABELS_RU; }

// Обратная совместимость (EVENT_LABELS использовался напрямую в нескольких местах)
const EVENT_LABELS = EVENT_LABELS_RU;

const EVENT_DOT_COLORS = {
  heat:             'var(--violet)',
  breeding:         'var(--cyan)',
  'expected-birth': 'var(--orange)',
  birth:            'var(--emerald)',
  note:             'var(--text-secondary)',
  other:            'var(--gold)',
};

// Форматировать Date в 'YYYY-MM-DD'
function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Форматировать 'YYYY-MM-DD' в '5 мар' / '5 Mar'
function fmtShort(dateStr) {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${d} ${monthsShort()[m-1]}`;
}

// Получить сегодня как строку
function todayStr() {
  return fmt(new Date());
}

// Получить события за конкретный день
function eventsForDate(dateStr) {
  return (state.events || []).filter(e => e.date === dateStr);
}

// Получить события за текущий месяц
function eventsForMonth(year, month) {
  const prefix = `${year}-${String(month+1).padStart(2,'0')}`;
  return (state.events || []).filter(e => e.date.startsWith(prefix));
}

// Имя питомца по id
function petName(petId) {
  if (!petId) return null;
  const p = state.pets.find(p => p.id === petId);
  return p ? p.name : null;
}

// ─────────────────────────────────────────────
//  MAIN RENDER
//  forceRebuild=true → полная пересборка DOM
//  forceRebuild=false → патч только изменившихся частей (без прыжков)
// ─────────────────────────────────────────────
export function renderJournal(forceRebuild = false) {
  const container = document.getElementById('journalContent');
  if (!container) return;

  if (forceRebuild || !container.querySelector('.journal-panel')) {
    _fullBuild(container);
  } else {
    _patch(container);
  }
  _setupPickerClose();
}

// ── Полная сборка (первый рендер / смена вкладки) ──
function _fullBuild(container) {
  container.innerHTML = '';
  container.className = 'journal-panel';
  container.appendChild(buildHeader());
  const body = document.createElement('div');
  body.className = 'journal-body';
  body.appendChild(buildCalendar());
  body.appendChild(buildEventsSection());
  container.appendChild(body);
}

// ── Патч: обновить только изменившиеся части без уничтожения DOM ──
function _patch(container) {
  // 1. Заголовок месяца
  const titleEl = container.querySelector('.journal-month-title');
  if (titleEl) {
    titleEl.textContent = `${months()[currentMonth]} ${currentYear}`;
    titleEl.classList.toggle('picker-open', pickerOpen);
  }

  // 2. Пикер — добавить / убрать / обновить год без перестройки всей шапки
  const nav = container.querySelector('.journal-month-nav');
  if (nav) {
    const existingPicker = nav.querySelector('.month-picker');
    if (pickerOpen && !existingPicker) {
      nav.appendChild(buildMonthPicker());
    } else if (!pickerOpen && existingPicker) {
      existingPicker.remove();
    } else if (pickerOpen && existingPicker) {
      existingPicker.replaceWith(buildMonthPicker());
    }
  }

  // 3. Статистика
  const statsEl = container.querySelector('.journal-header-stats');
  if (statsEl) _rebuildStats(statsEl);

  // 4. Сетка дней — обновить 42 ячейки in-place (нет создания/удаления элементов)
  const grid = container.querySelector('.calendar-grid');
  if (grid) _fillGrid(grid);

  // 5. Секция событий
  const body = container.querySelector('.journal-body');
  if (body) {
    const oldEvt = body.querySelector('.journal-events-section');
    const newEvt  = buildEventsSection();
    if (oldEvt) oldEvt.replaceWith(newEvt); else body.appendChild(newEvt);
  }
}

// ── Пересобрать только чипсы статистики ──
function _rebuildStats(statsEl) {
  statsEl.innerHTML = '';
  const monthEvts  = eventsForMonth(currentYear, currentMonth);
  const typeCounts = {};
  monthEvts.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });
  Object.entries(typeCounts).forEach(([type, count]) => {
    const chip = document.createElement('div');
    chip.className = 'journal-stat-chip';
    chip.innerHTML = `
      <span class="journal-stat-dot" style="background:${EVENT_DOT_COLORS[type]};box-shadow:0 0 5px ${EVENT_DOT_COLORS[type]}"></span>
      <span>${eventLabels()[type] || type}: ${count}</span>
    `;
    statsEl.appendChild(chip);
  });
}

// ── Обновить ТОЛЬКО пикер — нулевое DOM-изменение (только текст + классы) ──
function _updatePickerOnly() {
  const picker = document.querySelector('.month-picker');
  if (!picker) return;

  // Обновить год
  const yearLabel = picker.querySelector('.picker-year-label');
  if (yearLabel) yearLabel.textContent = pickerYear;

  // Обновить подсветку текущего месяца
  picker.querySelectorAll('.picker-month-btn').forEach((btn, i) => {
    btn.classList.toggle('current-month', pickerYear === currentYear && i === currentMonth);
  });
}

// ── Подписаться на закрытие пикера по клику снаружи ──
function _setupPickerClose() {
  if (!pickerOpen) return;
  const closeOnOutside = () => {
    pickerOpen = false;
    renderJournal();
    document.removeEventListener('click', closeOnOutside);
  };
  setTimeout(() => document.addEventListener('click', closeOnOutside), 0);
}

// ── Шапка: навигация + статистика ──
function buildHeader() {
  const header = document.createElement('div');
  header.className = 'journal-header';

  // Навигация
  const nav = document.createElement('div');
  nav.className = 'journal-month-nav';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'journal-month-btn';
  prevBtn.title = 'Предыдущий месяц';
  prevBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>`;
  prevBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    selectedDate = null;
    renderJournal();
  });

  const title = document.createElement('div');
  title.className = 'journal-month-title';
  title.textContent = `${months()[currentMonth]} ${currentYear}`;
  if (pickerOpen) title.classList.add('picker-open');
  title.title = 'Нажмите для быстрого выбора месяца';
  title.addEventListener('click', e => {
    e.stopPropagation();
    pickerOpen = !pickerOpen;
    pickerYear = currentYear;
    renderJournal();
  });

  const nextBtn = document.createElement('button');
  nextBtn.className = 'journal-month-btn';
  nextBtn.title = 'Следующий месяц';
  nextBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>`;
  nextBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    selectedDate = null;
    pickerOpen = false;
    renderJournal();
  });

  nav.append(prevBtn, title, nextBtn);

  // Пикер быстрого выбора месяца/года
  if (pickerOpen) {
    nav.appendChild(buildMonthPicker());
  }

  // Статистика по типам за текущий месяц
  const stats = document.createElement('div');
  stats.className = 'journal-header-stats';

  const monthEvts = eventsForMonth(currentYear, currentMonth);
  const typeCounts = {};
  monthEvts.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });

  Object.entries(typeCounts).forEach(([type, count]) => {
    const chip = document.createElement('div');
    chip.className = 'journal-stat-chip';
    chip.innerHTML = `
      <span class="journal-stat-dot" style="background:${EVENT_DOT_COLORS[type]};box-shadow:0 0 5px ${EVENT_DOT_COLORS[type]}"></span>
      <span>${eventLabels()[type] || type}: ${count}</span>
    `;
    stats.appendChild(chip);
  });

  header.append(nav, stats);
  return header;
}

// ── Пикер быстрого выбора месяца/года ──
function buildMonthPicker() {
  const picker = document.createElement('div');
  picker.className = 'month-picker';
  picker.addEventListener('click', e => e.stopPropagation());

  // Навигация по годам
  const yearNav = document.createElement('div');
  yearNav.className = 'picker-year-nav';

  const prevYearBtn = document.createElement('button');
  prevYearBtn.className = 'picker-year-btn';
  prevYearBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`;
  prevYearBtn.addEventListener('click', () => { pickerYear--; _updatePickerOnly(); });

  const yearLabel = document.createElement('span');
  yearLabel.className = 'picker-year-label';
  yearLabel.textContent = pickerYear;

  const nextYearBtn = document.createElement('button');
  nextYearBtn.className = 'picker-year-btn';
  nextYearBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
  nextYearBtn.addEventListener('click', () => { pickerYear++; _updatePickerOnly(); });

  yearNav.append(prevYearBtn, yearLabel, nextYearBtn);
  picker.appendChild(yearNav);

  // Сетка месяцев
  const monthsGrid = document.createElement('div');
  monthsGrid.className = 'picker-months';

  const SHORT = monthsPicker();
  SHORT.forEach((name, i) => {
    const btn = document.createElement('button');
    btn.className = 'picker-month-btn';
    if (pickerYear === currentYear && i === currentMonth) btn.classList.add('current-month');
    btn.textContent = name;
    btn.addEventListener('click', () => {
      currentYear  = pickerYear;
      currentMonth = i;
      selectedDate = null;
      pickerOpen   = false;
      renderJournal();
    });
    monthsGrid.appendChild(btn);
  });

  picker.appendChild(monthsGrid);
  return picker;
}

// ── Календарная сетка (первый build — создаёт 42 ячейки один раз) ──
function buildCalendar() {
  const section = document.createElement('div');
  section.className = 'journal-calendar-section';

  const weekdaysRow = document.createElement('div');
  weekdaysRow.className = 'calendar-weekdays';
  weekdays().forEach((name, i) => {
    const wd = document.createElement('div');
    wd.className = 'calendar-weekday' + (i >= 5 ? ' weekend' : '');
    wd.textContent = name;
    weekdaysRow.appendChild(wd);
  });
  section.appendChild(weekdaysRow);

  const grid = document.createElement('div');
  grid.className = 'calendar-grid';

  // Создать 42 пустые ячейки один раз — наполним через _fillGrid
  for (let i = 0; i < 42; i++) {
    const cell = document.createElement('div');
    cell.appendChild(Object.assign(document.createElement('div'), { className: 'day-number' }));
    grid.appendChild(cell);
  }

  // Один обработчик на весь grid (event delegation) — никогда не пересоздаётся
  grid.addEventListener('click', e => {
    const cell = e.target.closest('.calendar-day');
    if (!cell || cell.classList.contains('other-month')) return;
    const dateStr = cell.dataset.date;
    if (!dateStr) return;
    selectedDate = (selectedDate === dateStr) ? null : dateStr;
    // Обновить только выделение ячеек + правую панель — без касания грида
    grid.querySelectorAll('.calendar-day.selected').forEach(c => c.classList.remove('selected'));
    if (selectedDate) cell.classList.add('selected');
    _patchEventsSection();
  });

  _fillGrid(grid);
  section.appendChild(grid);
  return section;
}

// ── Обновить содержимое 42 ячеек in-place (нет создания/удаления ячеек) ──
function _fillGrid(grid) {
  const today = todayStr();
  const firstDow        = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const daysInMonth     = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
  const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;

  const cellData = [];
  for (let i = firstDow - 1; i >= 0; i--)
    cellData.push({ day: daysInPrevMonth - i, month: prevM, year: prevY, isOther: true });
  for (let d = 1; d <= daysInMonth; d++)
    cellData.push({ day: d, month: currentMonth, year: currentYear, isOther: false });
  for (let d = 1; cellData.length < 42; d++)
    cellData.push({ day: d, month: nextM, year: nextY, isOther: true });

  const domCells = grid.children;

  cellData.forEach(({ day, month, year, isOther }, idx) => {
    const cell    = domCells[idx];
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dayEvts = eventsForDate(dateStr);

    // Классы
    cell.className = 'calendar-day';
    if (isOther)              cell.classList.add('other-month');
    if (dateStr === today)    cell.classList.add('today');
    if (dateStr === selectedDate) cell.classList.add('selected');
    if (dayEvts.length > 0)  cell.classList.add('has-events');
    cell.dataset.date = dateStr;

    // Число — только textContent, элемент уже есть
    cell.querySelector('.day-number').textContent = day;

    // Точки событий — удалить старые, вставить новые (маленький элемент, не сетка)
    const oldDots = cell.querySelector('.day-events-dots');
    if (oldDots) oldDots.remove();
    if (dayEvts.length > 0) {
      const dots = document.createElement('div');
      dots.className = 'day-events-dots';
      dayEvts.slice(0, 3).forEach(ev => {
        dots.appendChild(Object.assign(document.createElement('div'), {
          className: `event-dot ${ev.type}`,
        }));
      });
      if (dayEvts.length > 3) {
        dots.appendChild(Object.assign(document.createElement('div'), {
          className: 'day-overflow',
          textContent: `+${dayEvts.length - 3}`,
        }));
      }
      cell.appendChild(dots);
    }
  });
}

// ── Обновить только правую панель событий (при клике по дню) ──
function _patchEventsSection() {
  const body = document.querySelector('#journalContent .journal-body');
  if (!body) return;
  const oldEvt = body.querySelector('.journal-events-section');
  const newEvt = buildEventsSection();
  if (oldEvt) oldEvt.replaceWith(newEvt); else body.appendChild(newEvt);
}

// ── Секция событий (правая панель) ──
function buildEventsSection() {
  const section = document.createElement('div');
  section.className = 'journal-events-section';

  // Заголовок
  const header = document.createElement('div');
  header.className = 'journal-events-header';

  const titleEl = document.createElement('div');
  titleEl.className = 'journal-events-title';
  if (selectedDate) {
    const [y, m, d] = selectedDate.split('-').map(Number);
    titleEl.textContent = `${d} ${monthsShort()[m-1]} ${y}`;
  } else {
    titleEl.textContent = months()[currentMonth];
  }

  const addBtn = document.createElement('button');
  addBtn.className = 'btn-add-event';
  addBtn.title = 'Добавить событие';
  addBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>`;
  addBtn.addEventListener('click', () => openAddEventModal(selectedDate));

  // Кнопка «Удалить все события» — только когда выбран день и есть события
  const dayEventsForDelete = selectedDate ? eventsForDate(selectedDate) : [];
  if (selectedDate && dayEventsForDelete.length > 0) {
    const delAllBtn = document.createElement('button');
    delAllBtn.className = 'btn-delete-all-events';
    delAllBtn.title = 'Удалить все события этого дня';
    delAllBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10.29 3a1 1 0 0 0-1.73 0L2.87 12A1 1 0 0 0 3.73 14h16.54a1 1 0 0 0 .86-1.5z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`;
    delAllBtn.addEventListener('click', () => {
      const cnt = dayEventsForDelete.length;
      const [yy, mm, dd] = selectedDate.split('-').map(Number);
      const cntWord = isEN()
        ? `${cnt} ${cnt === 1 ? 'event' : 'events'}`
        : `${cnt} ${cnt === 1 ? 'событие' : cnt < 5 ? 'события' : 'событий'}`;
      const dateWord = `${dd} ${monthsShort()[mm-1]} ${yy}`;
      openConfirm({
        title: isEN() ? '⚠ Delete all events for this day' : '⚠ Удалить все события дня',
        text: isEN()
          ? `${cntWord} on ${dateWord} will be permanently deleted.`
          : `Будет удалено ${cntWord} за ${dateWord}. Это действие необратимо.`,
        confirmText: isEN() ? 'Delete all' : 'Удалить всё',
        onConfirm: () => {
          state.events = state.events.filter(e => e.date !== selectedDate);
          saveState();
          showToast(isEN() ? `${cnt} ${cnt === 1 ? 'event' : 'events'} deleted` : `Удалено ${cnt} событий`, 'success');
          setTimeout(renderJournal, 270);
        },
      });
    });
    header.append(titleEl, delAllBtn, addBtn);
  } else {
    header.append(titleEl, addBtn);
  }
  section.appendChild(header);

  // Список событий
  const list = document.createElement('div');
  list.className = 'journal-events-list';

  const events = selectedDate
    ? eventsForDate(selectedDate)
    : eventsForMonth(currentYear, currentMonth).sort((a, b) => a.date.localeCompare(b.date));

  if (events.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'events-empty';
    empty.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <p>${selectedDate ? (isEN() ? 'No events\nthis day' : 'Нет событий\nв этот день') : (isEN() ? 'No events\nthis month' : 'Нет событий\nв этом месяце')}</p>
    `;
    list.appendChild(empty);
  } else {
    events.forEach(ev => list.appendChild(buildEventCard(ev)));
  }

  section.appendChild(list);
  return section;
}

// ── Карточка события ──
function buildEventCard(ev) {
  const card = document.createElement('div');
  card.className = `event-card ${ev.type}`;

  const top = document.createElement('div');
  top.className = 'event-card-top';

  const badge = document.createElement('span');
  badge.className = `event-type-badge ${ev.type}`;
  // Для «Другое» показываем своё название, если задано
  badge.textContent = ev.customLabel || eventLabels()[ev.type] || ev.type;
  top.appendChild(badge);

  // Дата при просмотре всего месяца
  if (!selectedDate) {
    const dateEl = document.createElement('span');
    dateEl.className = 'event-card-date';
    dateEl.textContent = fmtShort(ev.date);
    top.appendChild(dateEl);
  }

  const delBtn = document.createElement('button');
  delBtn.className = 'event-delete-btn';
  delBtn.title = 'Удалить событие';
  delBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>`;
  delBtn.addEventListener('click', e => {
    e.stopPropagation();
    const label = ev.customLabel || eventLabels()[ev.type] || ev.type;
    const pet   = petName(ev.petId);
    openConfirm({
      title: isEN() ? 'Delete event' : 'Удалить событие',
      text:  isEN()
        ? `Delete "${label}"${pet ? ' for ' + pet : ''}?`
        : `Удалить «${label}»${pet ? ' для ' + pet : ''}?`,
      confirmText: isEN() ? 'Delete' : 'Удалить',
      onConfirm: () => {
        debugLogEventDeleted(ev.id, ev.date);
        state.events = state.events.filter(evItem => evItem.id !== ev.id);
        debugLogEventsState(state.events);
        saveState();
        showToast(isEN() ? 'Event deleted' : 'Событие удалено', 'success');
        // setTimeout гарантирует рендер после fade-out модала подтверждения (0.25s)
        setTimeout(renderJournal, 270);
      },
    });
  });
  top.appendChild(delBtn);

  card.appendChild(top);

  // Питомец
  const pName = petName(ev.petId);
  if (pName) {
    const petEl = document.createElement('div');
    petEl.className = 'event-card-pet';
    petEl.textContent = pName;
    card.appendChild(petEl);

    // Партнёр для вязки
    if (ev.type === 'breeding') {
      const partnerLabel = petName(ev.partnerId) || ev.partnerName;
      if (partnerLabel) {
        const partEl = document.createElement('div');
        partEl.className = 'event-card-desc';
        partEl.textContent = `♂ ${partnerLabel}`;
        card.appendChild(partEl);
      }
    }
  }

  // Описание
  if (ev.description) {
    const descEl = document.createElement('div');
    descEl.className = 'event-card-desc';
    descEl.textContent = ev.description;
    card.appendChild(descEl);
  }

  return card;
}

// ─────────────────────────────────────────────
//  МОДАЛ ДОБАВЛЕНИЯ СОБЫТИЯ
// ─────────────────────────────────────────────

// Открыть модал с предзаполненной датой
export function openAddEventModal(date) {
  const typeSelect   = document.getElementById('f-event-type');
  const descTextarea = document.getElementById('f-event-desc');
  const partnerName  = document.getElementById('f-event-partner-name');
  const customLabel  = document.getElementById('f-event-custom-label');

  if (!typeSelect) return;

  // Заполнить год-select (1900 — текущий год)
  const yearSel = document.getElementById('f-event-year');
  if (yearSel && yearSel.options.length === 0) {
    const now = new Date().getFullYear();
    for (let y = now; y >= 1900; y--) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      yearSel.appendChild(opt);
    }
  }

  // Разобрать переданную дату или взять сегодня
  const d = date ? new Date(date + 'T00:00:00') : new Date();
  fillDayOptions(d.getFullYear(), d.getMonth() + 1, d.getDate());

  typeSelect.value = 'heat';
  descTextarea.value = '';
  if (partnerName) partnerName.value = '';
  if (customLabel) customLabel.value = '';

  // При смене месяца/года — пересчитать дни
  const monthSel = document.getElementById('f-event-month');
  if (monthSel && !monthSel._journalListener) {
    monthSel._journalListener = true;
    const rebuildDays = () => {
      const y = parseInt(document.getElementById('f-event-year')?.value) || new Date().getFullYear();
      const m = parseInt(monthSel.value) || 1;
      fillDayOptions(y, m, null); // null = сохранить текущий выбранный день
    };
    monthSel.addEventListener('change', rebuildDays);
    if (yearSel && !yearSel._journalListener) {
      yearSel._journalListener = true;
      yearSel.addEventListener('change', rebuildDays);
    }
  }

  refreshPetSelects('heat');
  openModal('addEventModal');
}

// Заполнить day-select нужным количеством дней
// targetDay: конкретный день (при открытии модала) или null (при смене месяца — сохранить текущий)
function fillDayOptions(year, month, targetDay) {
  const daySel = document.getElementById('f-event-day');
  if (!daySel) return;
  const daysInMonth = new Date(year, month, 0).getDate();
  // null = сохранить текущий выбор; иначе — принудительно установить targetDay
  const wantDay = targetDay !== null ? targetDay : (parseInt(daySel.value) || 1);
  daySel.innerHTML = '';
  for (let i = 1; i <= daysInMonth; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i < 10 ? '0' + i : i;
    daySel.appendChild(opt);
  }
  daySel.value = Math.min(wantDay, daysInMonth);
  // Синхронизировать год и месяц
  const monthSel = document.getElementById('f-event-month');
  const yearSel  = document.getElementById('f-event-year');
  if (monthSel) monthSel.value = month;
  if (yearSel)  yearSel.value  = year;
}

// Обновить select питомцев (и партнёра) под выбранный тип
export function refreshPetSelects(type) {
  const petSelect      = document.getElementById('f-event-pet');
  const partnerRow     = document.getElementById('f-event-partner-row');
  const partnerSel     = document.getElementById('f-event-partner');
  const customLabelRow = document.getElementById('f-event-custom-label-row');

  if (!petSelect) return;

  let pets = state.pets;

  if (type === 'heat' || type === 'birth') {
    pets = pets.filter(p => p.gender === 'female');
    petSelect.innerHTML = `<option value="">${isEN() ? '— Select female —' : '— Выбрать кошку —'}</option>`;
  } else if (type === 'breeding') {
    pets = pets.filter(p => p.gender === 'female');
    petSelect.innerHTML = `<option value="">${isEN() ? '— Select female —' : '— Выбрать кошку —'}</option>`;
  } else {
    // note / other — любой питомец (опц.)
    petSelect.innerHTML = `<option value="">${isEN() ? '— Pet (opt.) —' : '— Питомец (опц.) —'}</option>`;
  }

  pets.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name || '(без имени)';
    petSelect.appendChild(opt);
  });

  // Партнёр — только для вязки
  if (type === 'breeding') {
    const males = state.pets.filter(p => p.gender === 'male');
    partnerSel.innerHTML = `<option value="">${isEN() ? '— From database —' : '— Из базы —'}</option>`;
    males.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name || '(без имени)';
      partnerSel.appendChild(opt);
    });
    partnerRow.classList.add('visible');
  } else {
    partnerRow.classList.remove('visible');
  }

  // Поле «Название события» — только для «Другое»
  if (customLabelRow) {
    customLabelRow.classList.toggle('visible', type === 'other');
  }
}

// Сохранить новое событие
export function submitAddEvent() {
  const type  = document.getElementById('f-event-type')?.value;
  const day   = document.getElementById('f-event-day')?.value;
  const month = document.getElementById('f-event-month')?.value;
  const year  = document.getElementById('f-event-year')?.value;
  const date  = (year && month && day)
    ? `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    : '';
  const petId       = document.getElementById('f-event-pet')?.value || null;
  const partnerId   = document.getElementById('f-event-partner')?.value || null;
  const partnerN    = document.getElementById('f-event-partner-name')?.value.trim() || '';
  const description = document.getElementById('f-event-desc')?.value.trim() || '';
  const customLabel = document.getElementById('f-event-custom-label')?.value.trim() || '';

  if (!date) {
    showToast(isEN() ? 'Enter event date' : 'Укажите дату события', 'error');
    return;
  }
  if (type === 'other' && !customLabel) {
    showToast(isEN() ? 'Enter event title' : 'Введите название события', 'error');
    return;
  }

  if (!state.events) state.events = [];

  const event = {
    id:          'ev' + Date.now(),
    date,
    type,
    customLabel: type === 'other' ? customLabel : '',
    petId,
    partnerId:   type === 'breeding' ? partnerId : null,
    partnerName: type === 'breeding' ? partnerN  : '',
    description,
  };

  state.events.push(event);
  debugLogEventAdded(event);

  // Авто-создать «ожидаемые роды» через 63 дня при вязке
  if (type === 'breeding') {
    const d = new Date(date);
    d.setDate(d.getDate() + 63);
    const expectedDate = fmt(d);
    const autoEvent = {
      id:          'ev' + (Date.now() + 1),
      date:        expectedDate,
      type:        'expected-birth',
      petId,
      partnerId:   null,
      partnerName: '',
      description: 'Авторасчёт (+63 дня от вязки)',
    };
    state.events.push(autoEvent);
    debugLogEventAdded(autoEvent);
    showToast(isEN()
      ? `Breeding added. Expected birth: ${fmtShort(expectedDate)}`
      : `Вязка добавлена. Ожидаемые роды: ${fmtShort(expectedDate)}`, 'success');
  } else {
    showToast(isEN() ? 'Event added' : 'Событие добавлено', 'success');
  }

  debugLogEventsState(state.events);
  saveState();
  closeModal('addEventModal');

  // Переключить отображение на месяц события
  const [y, m] = date.split('-').map(Number);
  currentYear  = y;
  currentMonth = m - 1;
  renderJournal();
}
