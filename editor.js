// ============================================================
//  ColorDream – Éditeur double canvas
//  - canvasBase  : image/coloriage de fond (jamais effacé)
//  - canvasDraw  : dessin/couleurs par-dessus (effaçable)
//  Optimisé Apple Pencil + touch iPad
// ============================================================

const canvasBase = document.getElementById('baseCanvas');
const ctxBase    = canvasBase.getContext('2d');
const canvasDraw = document.getElementById('drawingCanvas');
const ctxDraw    = canvasDraw.getContext('2d');

// ── État ─────────────────────────────────────────────────────
let currentColor   = '#ff6eb4';
let currentSize    = 12;
let currentOpacity = 1;
let currentTool    = 'pen';
let isDrawing      = false;
let zoom           = 1;
let panX = 0, panY = 0;
let isPanning = false, spaceDown = false;
let panMouseStartX = 0, panMouseStartY = 0, panStartPanX = 0, panStartPanY = 0;
let touchPanActive = false, touchPanStartX = 0, touchPanStartY = 0;
let stabFactor = 0;
let stabX = 0, stabY = 0;
let undoStack      = [];
let redoStack      = [];
const MAX_UNDO     = 25;
const recentColors = [];

// ── Resize des deux canvas ────────────────────────────────────
function resizeCanvas() {
  const wrap = canvasDraw.parentElement;
  const dpr  = window.devicePixelRatio || 1;
  const w    = Math.min(wrap.clientWidth  - 40, 1400);
  const h    = Math.min(wrap.clientHeight - 40, 1000);

  // Sauvegarder le dessin avant resize
  const drawSnapshot = canvasDraw.toDataURL();

  [canvasBase, canvasDraw].forEach(c => {
    c.width        = w * dpr;
    c.height       = h * dpr;
    c.style.width  = w + 'px';
    c.style.height = h + 'px';
  });
  ctxBase.scale(dpr, dpr);
  ctxDraw.scale(dpr, dpr);

  // Recharger le fond
  reloadBase();

  // Restaurer le dessin
  const img = new Image();
  img.onload = () => ctxDraw.drawImage(img, 0, 0, w, h);
  img.src = drawSnapshot;
}

window.addEventListener('resize', resizeCanvas);

// ── Charger le fond (image ou SVG) ───────────────────────────
function reloadBase() {
  const dpr     = window.devicePixelRatio || 1;
  const w       = canvasBase.width / dpr;
  const h       = canvasBase.height / dpr;
  const svgData = sessionStorage.getItem('currentSvg');
  const imgSrc  = sessionStorage.getItem('currentImg');

  ctxBase.fillStyle = '#ffffff';
  ctxBase.fillRect(0, 0, w, h);

  if (svgData) {
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const img  = new Image();
    img.onload = () => {
      const scale = Math.min(w / img.width, h / img.height) * 0.92;
      const x = (w - img.width  * scale) / 2;
      const y = (h - img.height * scale) / 2;
      ctxBase.drawImage(img, x, y, img.width * scale, img.height * scale);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  } else if (imgSrc) {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(w / img.width, h / img.height) * 0.95;
      const x = (w - img.width  * scale) / 2;
      const y = (h - img.height * scale) / 2;
      ctxBase.drawImage(img, x, y, img.width * scale, img.height * scale);
    };
    img.src = imgSrc;
  }
}

// ── Init ─────────────────────────────────────────────────────
function init() {
  const title = sessionStorage.getItem('currentTitle') || 'Dessin libre';
  document.getElementById('editorTitle').textContent = title;
  document.getElementById('activeColorSwatch').style.background = currentColor;
  document.getElementById('customColor').value = currentColor;
  resizeCanvas();
  applyZoom();
  saveUndo();
}

// ── Undo / Redo ───────────────────────────────────────────────
function saveUndo() {
  if (undoStack.length >= MAX_UNDO) undoStack.shift();
  undoStack.push(canvasDraw.toDataURL());
  redoStack = [];
}

function restoreSnapshot(dataUrl) {
  const img = new Image();
  img.src = dataUrl;
  img.onload = () => {
    const dpr = window.devicePixelRatio || 1;
    const w   = canvasDraw.width  / dpr;
    const h   = canvasDraw.height / dpr;
    ctxDraw.clearRect(0, 0, w, h);
    ctxDraw.drawImage(img, 0, 0, w, h);
  };
}

function undo() {
  if (undoStack.length <= 1) return;
  redoStack.push(undoStack.pop());
  restoreSnapshot(undoStack[undoStack.length - 1]);
}

function redo() {
  if (redoStack.length === 0) return;
  const snap = redoStack.pop();
  undoStack.push(snap);
  restoreSnapshot(snap);
}

// ── Couleurs récentes ─────────────────────────────────────────
function addRecentColor(color) {
  const idx = recentColors.indexOf(color);
  if (idx !== -1) recentColors.splice(idx, 1);
  recentColors.unshift(color);
  if (recentColors.length > 6) recentColors.pop();
  renderRecentColors();
}

function renderRecentColors() {
  const bar = document.getElementById('recentColors');
  if (!bar) return;
  bar.innerHTML = '';
  recentColors.forEach(c => {
    const dot = document.createElement('div');
    dot.className = 'color-dot recent-dot';
    dot.style.background = c;
    dot.dataset.color = c;
    dot.title = c;
    dot.addEventListener('click', () => pickColor(c));
    bar.appendChild(dot);
  });
}

function pickColor(color) {
  currentColor = color;
  document.getElementById('customColor').value = color;
  document.getElementById('activeColorSwatch').style.background = color;
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  if (currentTool === 'eraser') setTool('pen');
}

// ── Curseur dynamique ─────────────────────────────────────────
const cursorCanvas = document.createElement('canvas');
cursorCanvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:9999;';
document.body.appendChild(cursorCanvas);
const cursorCtx = cursorCanvas.getContext('2d');

function resizeCursorCanvas() {
  cursorCanvas.width  = window.innerWidth;
  cursorCanvas.height = window.innerHeight;
}
resizeCursorCanvas();
window.addEventListener('resize', resizeCursorCanvas);

let cursorVisible = false;
let lastCursorX = 0, lastCursorY = 0;

function drawCursor(x, y) {
  cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
  if (!cursorVisible) return;
  const r = (currentTool === 'eraser' ? currentSize * 4 : currentSize) / 2 * zoom;
  cursorCtx.beginPath();
  cursorCtx.arc(x, y, Math.max(r, 2), 0, Math.PI * 2);
  cursorCtx.strokeStyle = currentTool === 'eraser' ? 'rgba(255,100,100,0.9)' : 'rgba(0,0,0,0.8)';
  cursorCtx.lineWidth = 1.5;
  cursorCtx.stroke();
  cursorCtx.beginPath();
  cursorCtx.arc(x, y, Math.max(r, 2), 0, Math.PI * 2);
  cursorCtx.strokeStyle = 'rgba(255,255,255,0.6)';
  cursorCtx.lineWidth = 0.7;
  cursorCtx.stroke();
}

canvasDraw.addEventListener('pointerenter', () => {
  cursorVisible = true;
  canvasDraw.style.cursor = 'none';
});

// Redessiner le curseur quand taille/outil change
function refreshCursor() {
  if (cursorVisible) drawCursor(lastCursorX, lastCursorY);
}

// ── Position du pointeur ──────────────────────────────────────
function getPos(e) {
  const rect = canvasDraw.getBoundingClientRect();
  let clientX, clientY, pressure = 1;

  if (e.pointerType !== undefined) {
    clientX  = e.clientX;
    clientY  = e.clientY;
    pressure = e.pressure > 0 ? e.pressure : 1;
  } else if (e.touches) {
    const t  = e.touches[0];
    clientX  = t.clientX;
    clientY  = t.clientY;
    if (t.force > 0) pressure = t.force;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  return {
    x: (clientX - rect.left) / zoom,
    y: (clientY - rect.top)  / zoom,
    pressure
  };
}

// ── Style de dessin ───────────────────────────────────────────
function applyStyle(pressure = 1) {
  if (currentTool === 'eraser') {
    const size = currentSize * 4;
    ctxDraw.globalCompositeOperation = 'destination-out';
    ctxDraw.strokeStyle = 'rgba(0,0,0,1)';
    ctxDraw.lineWidth   = size;
    ctxDraw.globalAlpha = 1;
  } else {
    const size = currentTool === 'brush'
      ? Math.max(2, currentSize * pressure * 2)
      : currentSize;
    ctxDraw.globalCompositeOperation = 'source-over';
    ctxDraw.strokeStyle = currentColor;
    ctxDraw.lineWidth   = size;
    ctxDraw.globalAlpha = currentTool === 'brush' ? currentOpacity * 0.75 : currentOpacity;
  }
  ctxDraw.lineCap  = 'round';
  ctxDraw.lineJoin = 'round';
}

// ── Dessin ────────────────────────────────────────────────────
function startDraw(e) {
  e.preventDefault();
  isDrawing = true;
  const pos = getPos(e);

  if (currentTool === 'fill') {
    floodFill(pos.x, pos.y, currentColor);
    isDrawing = false;
    saveUndo();
    addRecentColor(currentColor);
    return;
  }

  if (currentTool === 'eyedrop') {
    const dpr = window.devicePixelRatio || 1;
    const sx = Math.round(pos.x * dpr);
    const sy = Math.round(pos.y * dpr);
    if (sx >= 0 && sy >= 0 && sx < canvasBase.width && sy < canvasBase.height) {
      const bp = ctxBase.getImageData(sx, sy, 1, 1).data;
      const dp = ctxDraw.getImageData(sx, sy, 1, 1).data;
      const [r, g, b] = dp[3] > 10 ? [dp[0], dp[1], dp[2]] : [bp[0], bp[1], bp[2]];
      const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
      pickColor(hex);
      showToast('🎨 Couleur capturée !');
    }
    isDrawing = false;
    setTool('pen');
    return;
  }

  stabX = pos.x; stabY = pos.y;
  applyStyle(pos.pressure);
  ctxDraw.beginPath();
  ctxDraw.moveTo(pos.x, pos.y);
  ctxDraw.lineTo(pos.x + 0.1, pos.y + 0.1);
  ctxDraw.stroke();
}

function draw(e) {
  if (!isDrawing) return;
  e.preventDefault();
  const pos = getPos(e);
  stabX = stabX + (pos.x - stabX) * (1 - stabFactor);
  stabY = stabY + (pos.y - stabY) * (1 - stabFactor);
  applyStyle(pos.pressure);
  ctxDraw.lineTo(stabX, stabY);
  ctxDraw.stroke();
  ctxDraw.beginPath();
  ctxDraw.moveTo(stabX, stabY);
}

function stopDraw() {
  if (!isDrawing) return;
  isDrawing = false;
  ctxDraw.globalAlpha = 1;
  ctxDraw.globalCompositeOperation = 'source-over';
  saveUndo();
  if (currentTool !== 'eraser') addRecentColor(currentColor);
}

// ── Événements unifiés (dessin + pan) ────────────────────────
canvasDraw.addEventListener('pointerdown', e => {
  if (spaceDown) {
    isPanning = true;
    panMouseStartX = e.clientX; panMouseStartY = e.clientY;
    panStartPanX = panX; panStartPanY = panY;
    canvasDraw.style.cursor = 'grabbing';
    canvasDraw.setPointerCapture(e.pointerId);
    return;
  }
  startDraw(e);
});

canvasDraw.addEventListener('pointermove', e => {
  lastCursorX = e.clientX; lastCursorY = e.clientY;
  if (isPanning) {
    panX = panStartPanX + e.clientX - panMouseStartX;
    panY = panStartPanY + e.clientY - panMouseStartY;
    applyZoom();
    return;
  }
  drawCursor(e.clientX, e.clientY);
  draw(e);
});

canvasDraw.addEventListener('pointerup', e => {
  if (isPanning) {
    isPanning = false;
    canvasDraw.style.cursor = spaceDown ? 'grab' : 'none';
    return;
  }
  stopDraw();
});

canvasDraw.addEventListener('pointerleave', e => {
  cursorVisible = false;
  cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);
  if (!isPanning) { stopDraw(); canvasDraw.style.cursor = 'crosshair'; }
});

// Touch : 2 doigts = pan, 1 doigt = dessin
canvasDraw.addEventListener('touchstart', e => {
  if (e.touches.length === 2) {
    e.preventDefault();
    touchPanActive = true;
    touchPanStartX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    touchPanStartY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    panStartPanX = panX; panStartPanY = panY;
    if (isDrawing) stopDraw();
    return;
  }
  startDraw(e);
}, { passive: false });

canvasDraw.addEventListener('touchmove', e => {
  if (touchPanActive && e.touches.length === 2) {
    e.preventDefault();
    panX = panStartPanX + (e.touches[0].clientX + e.touches[1].clientX) / 2 - touchPanStartX;
    panY = panStartPanY + (e.touches[0].clientY + e.touches[1].clientY) / 2 - touchPanStartY;
    applyZoom();
    return;
  }
  draw(e);
}, { passive: false });

canvasDraw.addEventListener('touchend', e => {
  if (touchPanActive) {
    if (e.touches.length < 2) touchPanActive = false;
    return;
  }
  stopDraw();
}, { passive: false });

// ── Flood Fill (sur canvas de dessin) ────────────────────────
function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1,3), 16),
    parseInt(hex.slice(3,5), 16),
    parseInt(hex.slice(5,7), 16),
    255
  ];
}

function colorsMatch(a, b, tol = 35) {
  return Math.abs(a[0]-b[0]) <= tol &&
         Math.abs(a[1]-b[1]) <= tol &&
         Math.abs(a[2]-b[2]) <= tol &&
         Math.abs(a[3]-b[3]) <= tol;
}

function floodFill(px, py, hex) {
  const dpr = window.devicePixelRatio || 1;

  // Lire la couleur sur le canvas de BASE pour les contours
  const W  = Math.floor(canvasBase.width);
  const H  = Math.floor(canvasBase.height);
  const baseData = ctxBase.getImageData(0, 0, W, H).data;

  // Lire et modifier le canvas de DESSIN
  const drawImg  = ctxDraw.getImageData(0, 0, W, H);
  const drawData = drawImg.data;

  const sx = Math.round(px * dpr);
  const sy = Math.round(py * dpr);
  if (sx < 0 || sy < 0 || sx >= W || sy >= H) return;

  const idx    = (sy * W + sx) * 4;
  // Couleur cible = ce qui est visible (base + draw)
  const targetBase = [baseData[idx], baseData[idx+1], baseData[idx+2], baseData[idx+3]];
  const targetDraw = [drawData[idx], drawData[idx+1], drawData[idx+2], drawData[idx+3]];
  const fill   = hexToRgb(hex);

  const stack   = [[sx, sy]];
  const visited = new Uint8Array(W * H);

  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const i  = y * W + x;
    if (visited[i]) continue;
    const ci = i * 4;

    const bPixel = [baseData[ci], baseData[ci+1], baseData[ci+2], baseData[ci+3]];
    const dPixel = [drawData[ci], drawData[ci+1], drawData[ci+2], drawData[ci+3]];

    // Stopper sur les contours noirs du coloriage
    const isDark = bPixel[0] < 80 && bPixel[1] < 80 && bPixel[2] < 80;
    if (isDark) continue;

    if (!colorsMatch(bPixel, targetBase) && !colorsMatch(dPixel, targetDraw)) continue;

    visited[i] = 1;
    drawData[ci]   = fill[0];
    drawData[ci+1] = fill[1];
    drawData[ci+2] = fill[2];
    drawData[ci+3] = fill[3];
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  ctxDraw.putImageData(drawImg, 0, 0);
}

// ── Sauvegarder (fusion des deux canvas) ─────────────────────
function saveImage() {
  const merged = document.createElement('canvas');
  merged.width  = canvasBase.width;
  merged.height = canvasBase.height;
  const mCtx = merged.getContext('2d');
  mCtx.drawImage(canvasBase, 0, 0);
  mCtx.drawImage(canvasDraw, 0, 0);

  // Miniature pour l'historique
  const thumb = document.createElement('canvas');
  const ratio = Math.min(300 / merged.width, 300 / merged.height);
  thumb.width  = Math.round(merged.width  * ratio);
  thumb.height = Math.round(merged.height * ratio);
  thumb.getContext('2d').drawImage(merged, 0, 0, thumb.width, thumb.height);
  const title   = sessionStorage.getItem('currentTitle') || 'Dessin libre';
  const history = JSON.parse(localStorage.getItem('cdHistory') || '[]');
  history.unshift({ title, thumbnail: thumb.toDataURL('image/jpeg', 0.75), date: new Date().toLocaleDateString('fr-FR') });
  if (history.length > 12) history.pop();
  localStorage.setItem('cdHistory', JSON.stringify(history));

  const link = document.createElement('a');
  link.download = 'mon-coloriage.png';
  link.href = merged.toDataURL('image/png');
  link.click();
}

// ── UI Controls ──────────────────────────────────────────────
document.getElementById('colorPalette').addEventListener('click', e => {
  const dot = e.target.closest('.color-dot');
  if (!dot) return;
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  dot.classList.add('active');
  pickColor(dot.dataset.color);
});

document.getElementById('customColor').addEventListener('input', e => {
  pickColor(e.target.value);
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
});

document.getElementById('sizeSlider').addEventListener('input', e => {
  currentSize = parseInt(e.target.value);
  document.getElementById('sizeVal').textContent = currentSize;
  refreshCursor();
});

document.getElementById('opacitySlider').addEventListener('input', e => {
  currentOpacity = parseInt(e.target.value) / 100;
  document.getElementById('opacityVal').textContent = e.target.value;
});

function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const map = { pen: 'toolPen', brush: 'toolBrush', fill: 'toolFill', eraser: 'toolEraser', eyedrop: 'toolEyedrop' };
  document.getElementById(map[tool])?.classList.add('active');
  canvasDraw.style.cursor = cursorVisible ? 'none' : (tool === 'fill' || tool === 'eyedrop' ? 'cell' : 'crosshair');
  refreshCursor();
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = 'cd-toast cd-toast-' + type;
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('cd-toast-in'));
  setTimeout(() => {
    t.classList.remove('cd-toast-in');
    t.addEventListener('transitionend', () => t.remove());
  }, 2200);
}

document.getElementById('toolPen').addEventListener('click',      () => setTool('pen'));
document.getElementById('toolBrush').addEventListener('click',    () => setTool('brush'));
document.getElementById('toolFill').addEventListener('click',     () => setTool('fill'));
document.getElementById('toolEraser').addEventListener('click',   () => setTool('eraser'));
document.getElementById('toolEyedrop').addEventListener('click',  () => setTool('eyedrop'));
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('redoBtn').addEventListener('click', redo);

document.getElementById('stabSlider').addEventListener('input', e => {
  stabFactor = parseInt(e.target.value) / 10;
  document.getElementById('stabVal').textContent = e.target.value;
});

document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('Effacer tout ce que tu as colorié ?')) return;
  const dpr = window.devicePixelRatio || 1;
  ctxDraw.clearRect(0, 0, canvasDraw.width / dpr, canvasDraw.height / dpr);
  saveUndo();
});

document.getElementById('saveBtn').addEventListener('click', () => {
  saveImage();
  showToast('✅ Coloriage sauvegardé !');
});

// ── Zoom ─────────────────────────────────────────────────────
const canvasWrap = document.querySelector('.editor-canvas-wrap');

document.getElementById('zoomIn').addEventListener('click', () => {
  zoom = Math.min(zoom * 1.25, 4);
  applyZoom();
});
document.getElementById('zoomOut').addEventListener('click', () => {
  zoom = Math.max(zoom / 1.25, 0.3);
  applyZoom();
});
document.getElementById('zoomReset').addEventListener('click', () => {
  zoom = 1; panX = 0; panY = 0;
  applyZoom();
});

function applyZoom() {
  const t = `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${zoom})`;
  canvasBase.style.transform = t;
  canvasDraw.style.transform = t;
}

// ── Raccourcis clavier ────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === ' ' && !e.ctrlKey) { e.preventDefault(); if (!spaceDown) { spaceDown = true; canvasDraw.style.cursor = 'grab'; } return; }
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
  if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) { e.preventDefault(); redo(); }
  if (!e.ctrlKey && !e.metaKey) {
    if (e.key === 'p') setTool('pen');
    if (e.key === 'b') setTool('brush');
    if (e.key === 'f') setTool('fill');
    if (e.key === 'e') setTool('eraser');
    if (e.key === 'i') setTool('eyedrop');
    if (e.key === '[') {
      currentSize = Math.max(1, currentSize - 2);
      document.getElementById('sizeSlider').value = currentSize;
      document.getElementById('sizeVal').textContent = currentSize;
      refreshCursor();
    }
    if (e.key === ']') {
      currentSize = Math.min(60, currentSize + 2);
      document.getElementById('sizeSlider').value = currentSize;
      document.getElementById('sizeVal').textContent = currentSize;
      refreshCursor();
    }
  }
});

document.addEventListener('keyup', e => {
  if (e.key === ' ') {
    spaceDown = false;
    if (!isPanning) canvasDraw.style.cursor = cursorVisible ? 'none' : 'crosshair';
  }
});

// Lancer
init();
