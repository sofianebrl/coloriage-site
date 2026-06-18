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
let undoStack      = [];
const MAX_UNDO     = 25;

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
  resizeCanvas();
  saveUndo();
}

// ── Undo (uniquement le canvas de dessin) ────────────────────
function saveUndo() {
  if (undoStack.length >= MAX_UNDO) undoStack.shift();
  undoStack.push(canvasDraw.toDataURL());
}

function undo() {
  if (undoStack.length <= 1) return;
  undoStack.pop();
  const img = new Image();
  img.src = undoStack[undoStack.length - 1];
  img.onload = () => {
    const dpr = window.devicePixelRatio || 1;
    const w   = canvasDraw.width  / dpr;
    const h   = canvasDraw.height / dpr;
    ctxDraw.clearRect(0, 0, w, h);
    ctxDraw.drawImage(img, 0, 0, w, h);
  };
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
    return;
  }

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
  applyStyle(pos.pressure);
  ctxDraw.lineTo(pos.x, pos.y);
  ctxDraw.stroke();
  ctxDraw.beginPath();
  ctxDraw.moveTo(pos.x, pos.y);
}

function stopDraw() {
  if (!isDrawing) return;
  isDrawing = false;
  ctxDraw.globalAlpha = 1;
  ctxDraw.globalCompositeOperation = 'source-over';
  saveUndo();
}

// Pointer events (Apple Pencil natif)
canvasDraw.addEventListener('pointerdown', startDraw);
canvasDraw.addEventListener('pointermove', draw);
canvasDraw.addEventListener('pointerup',   stopDraw);
canvasDraw.addEventListener('pointerleave',stopDraw);
canvasDraw.addEventListener('touchstart',  startDraw, { passive: false });
canvasDraw.addEventListener('touchmove',   draw,      { passive: false });
canvasDraw.addEventListener('touchend',    stopDraw,  { passive: false });

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
  currentColor = dot.dataset.color;
  document.getElementById('customColor').value = currentColor;
  if (currentTool === 'eraser') setTool('pen');
});

document.getElementById('customColor').addEventListener('input', e => {
  currentColor = e.target.value;
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  if (currentTool === 'eraser') setTool('pen');
});

document.getElementById('sizeSlider').addEventListener('input', e => {
  currentSize = parseInt(e.target.value);
  document.getElementById('sizeVal').textContent = currentSize;
});

document.getElementById('opacitySlider').addEventListener('input', e => {
  currentOpacity = parseInt(e.target.value) / 100;
  document.getElementById('opacityVal').textContent = e.target.value;
});

function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const map = { pen: 'toolPen', brush: 'toolBrush', fill: 'toolFill', eraser: 'toolEraser' };
  document.getElementById(map[tool])?.classList.add('active');
  canvasDraw.style.cursor = tool === 'fill' ? 'cell' : tool === 'eraser' ? 'cell' : 'crosshair';
}

document.getElementById('toolPen').addEventListener('click',    () => setTool('pen'));
document.getElementById('toolBrush').addEventListener('click',  () => setTool('brush'));
document.getElementById('toolFill').addEventListener('click',   () => setTool('fill'));
document.getElementById('toolEraser').addEventListener('click', () => setTool('eraser'));
document.getElementById('undoBtn').addEventListener('click', undo);

document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('Effacer tout ce que tu as colorié ?')) return;
  const dpr = window.devicePixelRatio || 1;
  ctxDraw.clearRect(0, 0, canvasDraw.width / dpr, canvasDraw.height / dpr);
  saveUndo();
});

document.getElementById('saveBtn').addEventListener('click', saveImage);

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
  zoom = 1;
  applyZoom();
});

function applyZoom() {
  canvasBase.style.transform = `scale(${zoom})`;
  canvasDraw.style.transform = `scale(${zoom})`;
}

// ── Raccourcis clavier ────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
  if (e.key === 'p') setTool('pen');
  if (e.key === 'b') setTool('brush');
  if (e.key === 'f') setTool('fill');
  if (e.key === 'e') setTool('eraser');
});

// Lancer
init();
