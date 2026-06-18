// ============================================================
//  ColorDream – Éditeur de dessin / coloriage
//  Optimisé Apple Pencil + touch iPad
// ============================================================

const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

// ── État de l'app ────────────────────────────────────────────
let currentColor = '#000000';
let currentSize  = 8;
let currentOpacity = 1;
let currentTool  = 'pen';   // pen | brush | fill | eraser
let isDrawing    = false;
let lastX = 0, lastY = 0;
let zoom = 1;
let undoStack = [];
let MAX_UNDO = 20;

// ── Init canvas ──────────────────────────────────────────────
function resizeCanvas() {
  const wrap = canvas.parentElement;
  const dpr  = window.devicePixelRatio || 1;
  const w = Math.min(wrap.clientWidth  - 40, 1400);
  const h = Math.min(wrap.clientHeight - 40, 1000);
  // Sauvegarder le contenu
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
  ctx.scale(dpr, dpr);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  // Recharger l'image SVG si présente
  const svgData = sessionStorage.getItem('currentSvg');
  if (svgData) loadSvgOntoCanvas(svgData);
  else ctx.putImageData(imgData, 0, 0);
}

window.addEventListener('resize', resizeCanvas);

// ── Chargement SVG de coloriage ──────────────────────────────
function loadSvgOntoCanvas(svgContent) {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url  = URL.createObjectURL(blob);
  const img  = new Image();
  img.onload = () => {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width  / dpr;
    const h = canvas.height / dpr;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    // Centrer le SVG
    const scale = Math.min(w / img.width, h / img.height) * 0.9;
    const x = (w - img.width  * scale) / 2;
    const y = (h - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    URL.revokeObjectURL(url);
    saveUndo();
  };
  img.src = url;
}

// Charger une image PNG sur le canvas
function loadImgOntoCanvas(src) {
  const img = new Image();
  img.onload = () => {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width  / dpr;
    const h = canvas.height / dpr;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    const scale = Math.min(w / img.width, h / img.height) * 0.95;
    const x = (w - img.width  * scale) / 2;
    const y = (h - img.height * scale) / 2;
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    saveUndo();
  };
  img.src = src;
}

// Init : lire depuis sessionStorage (pas de fetch, compatible file://)
function init() {
  const title   = sessionStorage.getItem('currentTitle') || 'Dessin libre';
  const svgData = sessionStorage.getItem('currentSvg');
  const imgSrc  = sessionStorage.getItem('currentImg');
  document.getElementById('editorTitle').textContent = title;

  resizeCanvas();

  if (svgData) {
    loadSvgOntoCanvas(svgData);
  } else if (imgSrc) {
    loadImgOntoCanvas(imgSrc);
  } else {
    const dpr = window.devicePixelRatio || 1;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    saveUndo();
  }
}

// ── Undo ─────────────────────────────────────────────────────
function saveUndo() {
  if (undoStack.length >= MAX_UNDO) undoStack.shift();
  undoStack.push(canvas.toDataURL());
}

function undo() {
  if (undoStack.length <= 1) return;
  undoStack.pop();
  const img = new Image();
  img.src = undoStack[undoStack.length - 1];
  img.onload = () => {
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
  };
}

// ── Dessin ───────────────────────────────────────────────────
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const dpr  = window.devicePixelRatio || 1;
  let clientX, clientY, pressure = 1;

  if (e.touches) {
    const t = e.touches[0];
    clientX = t.clientX;
    clientY = t.clientY;
    // Apple Pencil pressure
    if (t.force !== undefined && t.force > 0) pressure = t.force;
  } else if (e.pointerType !== undefined) {
    clientX  = e.clientX;
    clientY  = e.clientY;
    pressure = e.pressure || 1;
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

function setDrawStyle(pressure = 1) {
  const size = currentTool === 'eraser'
    ? currentSize * 3
    : currentSize * (currentTool === 'brush' ? pressure * 1.8 : 1);

  ctx.lineWidth   = Math.max(1, size);
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.globalAlpha = currentOpacity * (currentTool === 'brush' ? 0.7 : 1);

  if (currentTool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = currentColor;
  }
}

function startDraw(e) {
  e.preventDefault();
  isDrawing = true;
  const pos = getPos(e);
  lastX = pos.x;
  lastY = pos.y;
  setDrawStyle(pos.pressure);
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);

  if (currentTool === 'fill') {
    floodFill(Math.round(pos.x), Math.round(pos.y), currentColor);
    isDrawing = false;
    saveUndo();
    return;
  }

  // Point unique
  ctx.lineTo(lastX + 0.1, lastY + 0.1);
  ctx.stroke();
}

function draw(e) {
  if (!isDrawing) return;
  e.preventDefault();
  const pos = getPos(e);
  setDrawStyle(pos.pressure);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  lastX = pos.x;
  lastY = pos.y;
}

function stopDraw(e) {
  if (!isDrawing) return;
  isDrawing = false;
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  saveUndo();
}

// Events souris
canvas.addEventListener('mousedown',  startDraw);
canvas.addEventListener('mousemove',  draw);
canvas.addEventListener('mouseup',    stopDraw);
canvas.addEventListener('mouseleave', stopDraw);

// Events touch (iPad + Apple Pencil)
canvas.addEventListener('touchstart', startDraw, { passive: false });
canvas.addEventListener('touchmove',  draw,      { passive: false });
canvas.addEventListener('touchend',   stopDraw,  { passive: false });

// Events pointer (Apple Pencil via PointerEvent)
canvas.addEventListener('pointerdown', startDraw);
canvas.addEventListener('pointermove', draw);
canvas.addEventListener('pointerup',   stopDraw);

// ── Flood Fill ───────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return [r, g, b, 255];
}

function colorsMatch(a, b, tolerance = 30) {
  return Math.abs(a[0]-b[0]) <= tolerance &&
         Math.abs(a[1]-b[1]) <= tolerance &&
         Math.abs(a[2]-b[2]) <= tolerance &&
         Math.abs(a[3]-b[3]) <= tolerance;
}

function floodFill(startX, startY, fillColorHex) {
  const dpr  = window.devicePixelRatio || 1;
  const W    = Math.floor(canvas.width);
  const H    = Math.floor(canvas.height);
  const imgData = ctx.getImageData(0, 0, W, H);
  const data    = imgData.data;

  const sx = Math.round(startX * dpr);
  const sy = Math.round(startY * dpr);
  if (sx < 0 || sy < 0 || sx >= W || sy >= H) return;

  const idx    = (sy * W + sx) * 4;
  const target = [data[idx], data[idx+1], data[idx+2], data[idx+3]];
  const fill   = hexToRgb(fillColorHex);

  if (colorsMatch(target, fill, 10)) return;

  const stack = [[sx, sy]];
  const visited = new Uint8Array(W * H);

  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const i = y * W + x;
    if (visited[i]) continue;
    const ci = i * 4;
    if (!colorsMatch([data[ci], data[ci+1], data[ci+2], data[ci+3]], target, 30)) continue;
    visited[i] = 1;
    data[ci]   = fill[0];
    data[ci+1] = fill[1];
    data[ci+2] = fill[2];
    data[ci+3] = fill[3];
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  ctx.putImageData(imgData, 0, 0);
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
  canvas.style.cursor = tool === 'fill' ? 'cell' : tool === 'eraser' ? 'cell' : 'crosshair';
}

document.getElementById('toolPen').addEventListener('click',    () => setTool('pen'));
document.getElementById('toolBrush').addEventListener('click',  () => setTool('brush'));
document.getElementById('toolFill').addEventListener('click',   () => setTool('fill'));
document.getElementById('toolEraser').addEventListener('click', () => setTool('eraser'));

document.getElementById('undoBtn').addEventListener('click', undo);

document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('Effacer tout le dessin ?')) return;
  const dpr = window.devicePixelRatio || 1;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  const svgData = sessionStorage.getItem('currentSvg');
  if (svgData) loadSvgOntoCanvas(svgData);
  saveUndo();
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'mon-coloriage.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

// ── Zoom ─────────────────────────────────────────────────────
document.getElementById('zoomIn').addEventListener('click', () => {
  zoom = Math.min(zoom * 1.25, 4);
  canvas.style.transform = `scale(${zoom})`;
});
document.getElementById('zoomOut').addEventListener('click', () => {
  zoom = Math.max(zoom / 1.25, 0.3);
  canvas.style.transform = `scale(${zoom})`;
});
document.getElementById('zoomReset').addEventListener('click', () => {
  zoom = 1;
  canvas.style.transform = 'scale(1)';
});

// Raccourcis clavier
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
  if (e.key === 'p') setTool('pen');
  if (e.key === 'b') setTool('brush');
  if (e.key === 'f') setTool('fill');
  if (e.key === 'e') setTool('eraser');
});

// Lancer
init();
