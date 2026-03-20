// ═══════════════════════════════════════════════
//  GENERATIONS PANEL — Карта поколений (SVG-граф)
// ═══════════════════════════════════════════════
import { state }    from '../state.js';
import { calcAge }  from '../helpers.js';
import { switchTab } from '../ui/navigation.js';
import { selectPet } from '../modules/cattery.js';
import { isEN }    from '../i18n.js';

// ── Константы раскладки ──────────────────────
const NODE_W  = 164;
const NODE_H  = 70;
const H_GAP   = 64;   // горизонтальный зазор между узлами
const V_GAP   = 108;  // вертикальный зазор между уровнями
const MIN_SCALE = 0.25;
const MAX_SCALE = 3;

// ── Состояние трансформации ──────────────────
let _transform = { x: 0, y: 0, scale: 1 };
let _wrapEl    = null;
let _tooltipEl = null;
let _vpEl      = null;   // <g id="gen-viewport">

// ═══════════════════════════════════════════════
//  ГЛАВНАЯ ФУНКЦИЯ
// ═══════════════════════════════════════════════
export function renderGenerationsPanel() {
  const panel = document.getElementById('panel-generations');
  if (!panel) return;

  // Сброс трансформации при каждом входе
  _transform = { x: 0, y: 0, scale: 1 };

  const pets    = state.pets    || [];
  const litters = state.litters || [];

  panel.innerHTML = _buildPanelHTML(pets.length);

  _wrapEl    = panel.querySelector('.gen-canvas-wrap');
  _tooltipEl = panel.querySelector('.gen-node-tooltip');

  // Кнопки тулбара
  panel.querySelector('#gen-btn-zoom-in')?.addEventListener('click',  () => _applyZoom(0.2));
  panel.querySelector('#gen-btn-zoom-out')?.addEventListener('click', () => _applyZoom(-0.2));

  if (pets.length === 0) return;

  const { nodes, edges } = _buildGraph(pets, litters);
  _layoutNodes(nodes, edges);
  _renderSVG(nodes, edges);
  _setupInteraction(nodes, edges);

  panel.querySelector('#gen-btn-center')?.addEventListener('click', () => _centerGraph(nodes));

  // Центрирование после отрисовки
  requestAnimationFrame(() => _centerGraph(nodes));
}

// ═══════════════════════════════════════════════
//  ПОСТРОЕНИЕ ГРАФА
// ═══════════════════════════════════════════════
function _buildGraph(pets, litters) {
  const petIds = new Set(pets.map(p => p.id));

  const nodes = pets.map(pet => ({
    id:    pet.id,
    pet,
    x:     0,
    y:     0,
    level: 0,
  }));

  const edges = [];

  // Связи из помётов: parent → kitten (у которого есть petId в базе)
  for (const litter of litters) {
    for (const kitten of (litter.kittens || [])) {
      if (!kitten.petId || !petIds.has(kitten.petId)) continue;

      if (litter.motherId && petIds.has(litter.motherId)) {
        edges.push({ from: litter.motherId, to: kitten.petId, type: 'mother' });
      }
      if (litter.fatherId && petIds.has(litter.fatherId)) {
        edges.push({ from: litter.fatherId, to: kitten.petId, type: 'father' });
      }
    }
  }

  return { nodes, edges };
}

// ═══════════════════════════════════════════════
//  РАСКЛАДКА УЗЛОВ
// ═══════════════════════════════════════════════
function _layoutNodes(nodes, edges) {
  const nodeMap    = new Map(nodes.map(n => [n.id, n]));
  const childrenOf = new Map(nodes.map(n => [n.id, []]));
  const parentsOf  = new Map(nodes.map(n => [n.id, []]));

  for (const e of edges) {
    childrenOf.get(e.from)?.push(e.to);
    parentsOf.get(e.to)?.push(e.from);
  }

  // Уровень 0 = листья (нет потомков в базе) → показываем наверху
  // Уровень N = предки → показываем внизу
  const levMap = new Map();

  // Инициализация: листья → уровень 0
  for (const n of nodes) {
    if ((childrenOf.get(n.id) || []).length === 0) {
      levMap.set(n.id, 0);
    }
  }

  // Распространение уровней наверх (к предкам)
  let changed = true;
  let guard   = nodes.length * 4;
  while (changed && guard-- > 0) {
    changed = false;
    for (const e of edges) {
      const childLev  = levMap.get(e.to)  ?? 0;
      const parentLev = levMap.get(e.from) ?? -1;
      if (parentLev < childLev + 1) {
        levMap.set(e.from, childLev + 1);
        changed = true;
      }
    }
  }

  nodes.forEach(n => { n.level = levMap.get(n.id) ?? 0; });

  // Группировка по уровням
  const byLevel = new Map();
  nodes.forEach(n => {
    if (!byLevel.has(n.level)) byLevel.set(n.level, []);
    byLevel.get(n.level).push(n);
  });

  // Позиционирование: сначала уровень 0, потом 1, 2...
  const levels = [...byLevel.keys()].sort((a, b) => a - b);

  levels.forEach(lv => {
    const levelNodes = byLevel.get(lv);

    // Сортировка по средней X позиции потомков (уменьшает пересечения)
    if (lv > 0) {
      levelNodes.sort((a, b) => {
        const xA = _avgChildX(a.id, childrenOf, nodeMap);
        const xB = _avgChildX(b.id, childrenOf, nodeMap);
        return xA - xB;
      });
    }

    const totalW = levelNodes.length * NODE_W + (levelNodes.length - 1) * H_GAP;
    const startX = -totalW / 2;

    levelNodes.forEach((n, i) => {
      n.x = startX + i * (NODE_W + H_GAP);
      n.y = lv * (NODE_H + V_GAP);
    });
  });
}

// Средняя X-координата центров потомков узла
function _avgChildX(nodeId, childrenOf, nodeMap) {
  const children = childrenOf.get(nodeId) || [];
  if (children.length === 0) return 0;
  const xs = children.map(cid => {
    const n = nodeMap.get(cid);
    return n ? n.x + NODE_W / 2 : 0;
  });
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// ═══════════════════════════════════════════════
//  РЕНДЕР SVG
// ═══════════════════════════════════════════════
function _renderSVG(nodes, edges) {
  if (!_wrapEl) return;

  const NS = 'http://www.w3.org/2000/svg';

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width',  '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('id', 'gen-svg');

  // ─── Defs: фильтры и градиенты ──────────────
  const defs = document.createElementNS(NS, 'defs');
  defs.innerHTML = `
    <filter id="gf-cyan" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="0 0 0 0 0.247  0 0 0 0 0.824  0 0 0 0 1  0 0 0 0.5 0" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="gf-emerald" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur"/>
      <feColorMatrix in="blur" type="matrix"
        values="0 0 0 0 0.157  0 0 0 0 0.851  0 0 0 0 0.541  0 0 0 0.5 0" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  `;
  svg.appendChild(defs);

  // ─── Фоновый прямоугольник ───────────────────
  const bg = document.createElementNS(NS, 'rect');
  bg.setAttribute('width',  '100%');
  bg.setAttribute('height', '100%');
  bg.setAttribute('fill', '#050816');
  svg.appendChild(bg);

  // ─── Группа viewport (для zoom/pan) ─────────
  const vp = document.createElementNS(NS, 'g');
  vp.id = 'gen-viewport';
  svg.appendChild(vp);
  _vpEl = vp;

  // ─── Звёзды ──────────────────────────────────
  // Генерируем в большой области вокруг графа
  const bounds = _getBounds(nodes);
  const starMargin = 300;
  const starG = document.createElementNS(NS, 'g');
  starG.setAttribute('class', 'gen-stars');
  for (let i = 0; i < 120; i++) {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', (bounds.minX - starMargin) + Math.random() * (bounds.w + starMargin * 2));
    c.setAttribute('cy', (bounds.minY - starMargin) + Math.random() * (bounds.h + starMargin * 2));
    c.setAttribute('r',  (Math.random() * 1.2 + 0.2).toFixed(2));
    c.setAttribute('fill', '#e8eeff');
    c.setAttribute('opacity', (Math.random() * 0.45 + 0.08).toFixed(2));
    starG.appendChild(c);
  }
  vp.appendChild(starG);

  // ─── Рёбра ───────────────────────────────────
  const edgesG = document.createElementNS(NS, 'g');
  edgesG.id = 'gen-edges';
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  for (const edge of edges) {
    const from = nodeMap.get(edge.from);
    const to   = nodeMap.get(edge.to);
    if (!from || !to) continue;

    // Родитель (from) находится НИЖЕ потомка (to)
    // Соединяем: верх родителя → низ потомка
    const x1 = from.x + NODE_W / 2;
    const y1 = from.y;              // верх родителя
    const x2 = to.x + NODE_W / 2;
    const y2 = to.y + NODE_H;      // низ потомка
    const midY = (y1 + y2) / 2;

    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d',
      `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
    );
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', edge.type === 'mother' ? '#8a4fff' : '#3fd2ff');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('opacity', '0.3');
    path.setAttribute('class', 'gen-edge');
    path.dataset.from = edge.from;
    path.dataset.to   = edge.to;
    edgesG.appendChild(path);
  }
  vp.appendChild(edgesG);

  // ─── Узлы ────────────────────────────────────
  const nodesG = document.createElementNS(NS, 'g');
  nodesG.id = 'gen-nodes';

  for (const node of nodes) {
    nodesG.appendChild(_buildNodeEl(node, NS));
  }
  vp.appendChild(nodesG);

  // Очистить и вставить SVG
  _wrapEl.querySelectorAll('svg').forEach(el => el.remove());
  _wrapEl.appendChild(svg);
}

// ─── Построить SVG-элемент одного узла ──────
function _buildNodeEl(node, NS) {
  const pet     = node.pet;
  const isOwn   = pet.cattery === 'own';
  const color   = isOwn ? '#3fd2ff' : '#28d98a';
  const filterId = isOwn ? 'gf-cyan' : 'gf-emerald';
  const genderColor = pet.gender === 'female' ? '#e879b8' : '#4a9eff';
  const genderSym   = pet.gender === 'female' ? '♀' : '♂';

  const g = document.createElementNS(NS, 'g');
  g.setAttribute('class', 'gen-node');
  g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
  g.dataset.id = pet.id;
  g.style.cursor = 'pointer';

  // Glow-прямоугольник позади узла
  const glow = document.createElementNS(NS, 'rect');
  glow.setAttribute('class', 'gen-node-glow');
  glow.setAttribute('x', '-6'); glow.setAttribute('y', '-6');
  glow.setAttribute('width',  NODE_W + 12);
  glow.setAttribute('height', NODE_H + 12);
  glow.setAttribute('rx', '16');
  glow.setAttribute('fill', 'none');
  glow.setAttribute('stroke', color);
  glow.setAttribute('stroke-width', '1');
  glow.setAttribute('opacity', '0.18');
  glow.setAttribute('filter', `url(#${filterId})`);
  g.appendChild(glow);

  // Основной прямоугольник
  const rect = document.createElementNS(NS, 'rect');
  rect.setAttribute('class', 'gen-node-rect');
  rect.setAttribute('x', '0'); rect.setAttribute('y', '0');
  rect.setAttribute('width',  NODE_W);
  rect.setAttribute('height', NODE_H);
  rect.setAttribute('rx', '10');
  rect.setAttribute('fill', '#0d1630');
  rect.setAttribute('stroke', color);
  rect.setAttribute('stroke-width', '1.5');
  g.appendChild(rect);

  // Акцентная полоса вверху
  const bar = document.createElementNS(NS, 'rect');
  bar.setAttribute('x', '12'); bar.setAttribute('y', '0');
  bar.setAttribute('width', NODE_W - 24);
  bar.setAttribute('height', '2');
  bar.setAttribute('rx', '1');
  bar.setAttribute('fill', color);
  bar.setAttribute('opacity', '0.55');
  g.appendChild(bar);

  // Имя питомца
  const nameEl = document.createElementNS(NS, 'text');
  nameEl.setAttribute('x', '12');
  nameEl.setAttribute('y', '24');
  nameEl.setAttribute('fill', '#e8eeff');
  nameEl.setAttribute('font-size', '11');
  nameEl.setAttribute('font-family', 'Exo 2, sans-serif');
  nameEl.setAttribute('font-weight', '600');
  nameEl.setAttribute('clip-path', `url(#clip-${pet.id})`);
  nameEl.textContent = _truncate(pet.name || 'Без имени', 19);
  g.appendChild(nameEl);

  // EMS-код
  if (pet.ems) {
    const emsEl = document.createElementNS(NS, 'text');
    emsEl.setAttribute('x', '12');
    emsEl.setAttribute('y', '39');
    emsEl.setAttribute('fill', color);
    emsEl.setAttribute('font-size', '9.5');
    emsEl.setAttribute('font-family', 'Rajdhani, sans-serif');
    emsEl.setAttribute('font-weight', '600');
    emsEl.setAttribute('letter-spacing', '0.05em');
    emsEl.setAttribute('opacity', '0.9');
    emsEl.textContent = _truncate(pet.ems, 22);
    g.appendChild(emsEl);
  }

  // Питомник
  const catteryName = pet.catteryName
    ? _truncate(pet.catteryName, 20)
    : (isOwn
        ? (isEN() ? 'My Cattery' : 'Мой питомник')
        : (isEN() ? 'Other Cattery' : 'Другой питомник'));
  const catEl = document.createElementNS(NS, 'text');
  catEl.setAttribute('x', '12');
  catEl.setAttribute('y', '55');
  catEl.setAttribute('fill', '#7a8db8');
  catEl.setAttribute('font-size', '8.5');
  catEl.setAttribute('font-family', 'Rajdhani, sans-serif');
  catEl.textContent = catteryName;
  g.appendChild(catEl);

  // Бейдж пола
  const sexEl = document.createElementNS(NS, 'text');
  sexEl.setAttribute('x', NODE_W - 14);
  sexEl.setAttribute('y', '18');
  sexEl.setAttribute('fill', genderColor);
  sexEl.setAttribute('font-size', '13');
  sexEl.setAttribute('text-anchor', 'middle');
  sexEl.textContent = genderSym;
  g.appendChild(sexEl);

  return g;
}

// ═══════════════════════════════════════════════
//  ИНТЕРАКТИВНОСТЬ
// ═══════════════════════════════════════════════
function _setupInteraction(nodes, edges) {
  if (!_wrapEl) return;

  const svg = _wrapEl.querySelector('#gen-svg');
  if (!svg) return;

  const nodeMap   = new Map(nodes.map(n => [n.id, n]));
  const edgeEl    = svg.querySelectorAll('.gen-edge');
  const nodeEls   = svg.querySelectorAll('.gen-node');

  // ── Pan ──────────────────────────────────────
  let isPanning = false;
  let panStart  = { x: 0, y: 0 };
  let panOrigin = { x: 0, y: 0 };

  _wrapEl.addEventListener('mousedown', e => {
    if (e.target.closest('.gen-node')) return;
    isPanning = true;
    panStart  = { x: e.clientX, y: e.clientY };
    panOrigin = { x: _transform.x, y: _transform.y };
    _wrapEl.classList.add('is-panning');
  });

  const _onMouseMove = e => {
    if (!isPanning) return;
    _transform.x = panOrigin.x + (e.clientX - panStart.x);
    _transform.y = panOrigin.y + (e.clientY - panStart.y);
    _updateTransform();
  };

  const _onMouseUp = () => {
    if (!isPanning) return;
    isPanning = false;
    _wrapEl?.classList.remove('is-panning');
  };

  window.addEventListener('mousemove', _onMouseMove);
  window.addEventListener('mouseup',   _onMouseUp);

  // ── Zoom ─────────────────────────────────────
  _wrapEl.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    // Zoom к курсору
    const rect   = _wrapEl.getBoundingClientRect();
    const cx     = e.clientX - rect.left;
    const cy     = e.clientY - rect.top;
    const oldS   = _transform.scale;
    const newS   = Math.max(MIN_SCALE, Math.min(MAX_SCALE, oldS + delta));
    const ratio  = newS / oldS;
    _transform.x = cx + (_transform.x - cx) * ratio;
    _transform.y = cy + (_transform.y - cy) * ratio;
    _transform.scale = newS;
    _updateTransform();
  }, { passive: false });

  // ── Hover по узлам ───────────────────────────
  nodeEls.forEach(el => {
    const petId = el.dataset.id;
    const node  = nodeMap.get(petId);
    if (!node) return;

    el.addEventListener('mouseenter', e => {
      _highlightNode(el, true);
      _highlightEdges(petId, edgeEl, nodeEls, true);
      _showTooltip(node.pet, e);
    });

    el.addEventListener('mousemove', e => {
      _moveTooltip(e);
    });

    el.addEventListener('mouseleave', () => {
      _highlightNode(el, false);
      _highlightEdges(petId, edgeEl, nodeEls, false);
      _hideTooltip();
    });

    // Клик → перейти к питомцу в питомнике
    el.addEventListener('click', () => {
      switchTab('cattery');
      setTimeout(() => selectPet(petId), 60);
    });
  });
}

// ═══════════════════════════════════════════════
//  ТРАНСФОРМАЦИЯ
// ═══════════════════════════════════════════════
function _updateTransform() {
  if (!_vpEl) return;
  _vpEl.setAttribute(
    'transform',
    `translate(${_transform.x.toFixed(2)}, ${_transform.y.toFixed(2)}) scale(${_transform.scale.toFixed(4)})`
  );
}

export function _applyZoom(delta) {
  _transform.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, _transform.scale + delta));
  _updateTransform();
}

function _centerGraph(nodes) {
  if (!_wrapEl || nodes.length === 0) return;
  const wr = _wrapEl.getBoundingClientRect();
  if (!wr.width || !wr.height) return;

  const b = _getBounds(nodes);
  const scaleX = wr.width  / (b.w + 120);
  const scaleY = wr.height / (b.h + 120);
  const scale  = Math.min(scaleX, scaleY, 1.2);

  _transform.scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
  const cx = b.minX + b.w / 2;
  const cy = b.minY + b.h / 2;
  _transform.x = wr.width  / 2 - cx * _transform.scale;
  _transform.y = wr.height / 2 - cy * _transform.scale;
  _updateTransform();
}

function _getBounds(nodes) {
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs) + NODE_W;
  const maxY = Math.max(...ys) + NODE_H;
  return { minX, minY, w: maxX - minX, h: maxY - minY };
}

// ═══════════════════════════════════════════════
//  HIGHLIGHT
// ═══════════════════════════════════════════════
function _highlightNode(el, active) {
  el.classList.toggle('highlighted', active);
}

function _highlightEdges(petId, edgeEls, nodeEls, active) {
  if (!active) {
    // Сбросить всё
    edgeEls.forEach(e => e.classList.remove('highlighted', 'dimmed'));
    nodeEls.forEach(n => n.classList.remove('dimmed'));
    return;
  }

  // Найти связанные узлы
  const related = new Set([petId]);
  edgeEls.forEach(e => {
    const from = e.dataset.from;
    const to   = e.dataset.to;
    if (from === petId || to === petId) {
      related.add(from);
      related.add(to);
      e.classList.add('highlighted');
      e.classList.remove('dimmed');
    } else {
      e.classList.add('dimmed');
      e.classList.remove('highlighted');
    }
  });

  nodeEls.forEach(n => {
    n.classList.toggle('dimmed', !related.has(n.dataset.id));
  });
}

// ═══════════════════════════════════════════════
//  ТУЛТИП
// ═══════════════════════════════════════════════
function _showTooltip(pet, e) {
  if (!_tooltipEl) return;
  const isOwn  = pet.cattery === 'own';
  const color  = isOwn ? '#3fd2ff' : '#28d98a';
  const age    = pet.dob ? calcAge(pet.dob) : '—';
  const cattery = pet.catteryName || (isOwn
    ? (isEN() ? 'My Cattery' : 'Мой питомник')
    : (isEN() ? 'Other Cattery' : 'Другой питомник'));
  const gender  = pet.gender === 'female' ? '♀' : '♂';
  const gColor  = pet.gender === 'female' ? '#e879b8' : '#4a9eff';

  const photoHTML = pet.photo
    ? `<img src="${pet.photo}" alt="">`
    : `<div class="gen-tooltip-avatar">${gender}</div>`;

  _tooltipEl.innerHTML = `
    <div class="gen-tooltip-inner">
      <div class="gen-tooltip-photo">${photoHTML}</div>
      <div class="gen-tooltip-info">
        <div class="gen-tooltip-name">${_escHtml(pet.name || (isEN() ? 'No name' : 'Без имени'))}</div>
        ${pet.ems ? `<div class="gen-tooltip-ems" style="color:${color}">${_escHtml(pet.ems)}</div>` : ''}
        <div class="gen-tooltip-cattery">${_escHtml(cattery)}</div>
        <div class="gen-tooltip-meta">
          <span class="gen-tooltip-gender" style="color:${gColor}">${gender}</span>
          <span class="gen-tooltip-age">${age}</span>
        </div>
      </div>
    </div>
  `;

  _tooltipEl.classList.add('visible');
  _moveTooltip(e);
}

function _moveTooltip(e) {
  if (!_tooltipEl || !_wrapEl) return;
  const wr = _wrapEl.getBoundingClientRect();
  let x = e.clientX - wr.left + 14;
  let y = e.clientY - wr.top  - 10;

  // Не выходить за правый/нижний край
  const ttW = _tooltipEl.offsetWidth  || 220;
  const ttH = _tooltipEl.offsetHeight || 80;
  if (x + ttW > wr.width  - 8) x = e.clientX - wr.left - ttW - 14;
  if (y + ttH > wr.height - 8) y = e.clientY - wr.top  - ttH - 4;

  _tooltipEl.style.left = `${x}px`;
  _tooltipEl.style.top  = `${y}px`;
}

function _hideTooltip() {
  _tooltipEl?.classList.remove('visible');
}

// ═══════════════════════════════════════════════
//  HTML СКЕЛЕТ ПАНЕЛИ
// ═══════════════════════════════════════════════
function _buildPanelHTML(petCount) {
  const countLabel = petCount > 0
    ? `${petCount}\u00a0${_declension(petCount)}`
    : 'Нет питомцев';

  const emptyHTML = petCount === 0 ? `
    <div class="gen-empty-state">
      <svg class="gen-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
        <line x1="12" y1="7" x2="5" y2="17"/><line x1="12" y1="7" x2="19" y2="17"/>
      </svg>
      <div class="gen-empty-title">Карта поколений пуста</div>
      <div class="gen-empty-sub">Добавьте питомцев, чтобы увидеть карту</div>
    </div>
  ` : '';

  const legendHTML = petCount > 0 ? `
    <div class="gen-legend">
      <div class="gen-legend-item">
        <span class="gen-legend-dot gen-legend-cyan"></span>
        <span>Мой питомник</span>
      </div>
      <div class="gen-legend-item">
        <span class="gen-legend-dot gen-legend-emerald"></span>
        <span>Другой питомник</span>
      </div>
      <div class="gen-legend-item">
        <span class="gen-legend-line"></span>
        <span>Родственная связь</span>
      </div>
    </div>
    <div class="gen-zoom-hint">Колесо мыши — масштаб · Тяни — перемещение</div>
  ` : '';

  return `
    <div class="generations-panel">
      <div class="gen-toolbar">
        <div class="gen-toolbar-left">
          <div class="gen-toolbar-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
              <line x1="12" y1="7" x2="5" y2="17"/><line x1="12" y1="7" x2="19" y2="17"/>
            </svg>
            Карта поколений
          </div>
          <span class="gen-pet-count">${countLabel}</span>
        </div>
        <div class="gen-toolbar-controls">
          <button class="gen-ctrl-btn" id="gen-btn-center" title="Центрировать граф">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M3 12h2M19 12h2M12 3v2M12 19v2"/>
            </svg>
            Центрировать
          </button>
          <div class="gen-zoom-sep"></div>
          <button class="gen-ctrl-btn" id="gen-btn-zoom-out" title="Уменьшить">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button class="gen-ctrl-btn" id="gen-btn-zoom-in" title="Увеличить">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="gen-canvas-wrap">
        ${emptyHTML}
        <div class="gen-node-tooltip" id="genTooltip"></div>
      </div>
      ${legendHTML}
    </div>
  `;
}

// ═══════════════════════════════════════════════
//  УТИЛИТЫ
// ═══════════════════════════════════════════════
function _truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function _escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function _declension(n) {
  const mod10  = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11)               return 'питомец';
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'питомца';
  return 'питомцев';
}
