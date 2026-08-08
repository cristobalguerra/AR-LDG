// Composer — Generador de composiciones visuales (dithering + shapes custom)

// ── Estado ──────────────────────────────────────────────────────────────────
const state = {
  source: null,           // HTMLImageElement | HTMLVideoElement | null
  sourceType: 'none',     // 'image' | 'webcam' | 'none'
  webcamStream: null,
  config: defaultConfig(),
  rafId: null,
};

function defaultConfig() {
  return {
    grid: 60,
    spacing: 0,
    shapeSize: 100,
    lowThr: 85,
    highThr: 170,
    invert: false,
    bg: '#0a0a0a',
    bands: {
      shadow:    { shape: 'circle',   color: '#e8ff47', glyph: '' },
      mid:       { shape: 'square',   color: '#888888', glyph: '' },
      highlight: { shape: 'dot',      color: '#ffffff', glyph: '' },
    },
  };
}

const SHAPES = [
  { id: 'circle',   label: '◯' },
  { id: 'disc',     label: '●' },
  { id: 'square',   label: '▢' },
  { id: 'fillsq',   label: '■' },
  { id: 'triangle', label: '▲' },
  { id: 'diamond',  label: '◆' },
  { id: 'plus',     label: '+' },
  { id: 'cross',    label: '✕' },
  { id: 'line',     label: '|' },
  { id: 'dot',      label: '·' },
  { id: 'ring',     label: '◎' },
  { id: 'none',     label: '∅' },
];

const PRESETS = [
  {
    name: 'Neón',
    cfg: {
      grid: 70, spacing: 0, shapeSize: 100, lowThr: 80, highThr: 175, invert: false, bg: '#0a0a0a',
      bands: { shadow: { shape: 'disc', color: '#e8ff47', glyph: '' }, mid: { shape: 'circle', color: '#e8ff47', glyph: '' }, highlight: { shape: 'dot', color: '#e8ff47', glyph: '' } },
    },
  },
  {
    name: 'ASCII',
    cfg: {
      grid: 90, spacing: 0, shapeSize: 110, lowThr: 70, highThr: 180, invert: false, bg: '#000000',
      bands: { shadow: { shape: 'none', color: '#ffffff', glyph: '#' }, mid: { shape: 'none', color: '#ffffff', glyph: '+' }, highlight: { shape: 'none', color: '#ffffff', glyph: '.' } },
    },
  },
  {
    name: 'Trama',
    cfg: {
      grid: 80, spacing: 1, shapeSize: 90, lowThr: 90, highThr: 170, invert: false, bg: '#f0f0f0',
      bands: { shadow: { shape: 'fillsq', color: '#0a0a0a', glyph: '' }, mid: { shape: 'square', color: '#0a0a0a', glyph: '' }, highlight: { shape: 'dot', color: '#0a0a0a', glyph: '' } },
    },
  },
  {
    name: 'Cruces',
    cfg: {
      grid: 55, spacing: 0, shapeSize: 100, lowThr: 80, highThr: 175, invert: false, bg: '#101418',
      bands: { shadow: { shape: 'plus', color: '#ff4757', glyph: '' }, mid: { shape: 'cross', color: '#e8ff47', glyph: '' }, highlight: { shape: 'dot', color: '#ffffff', glyph: '' } },
    },
  },
  {
    name: 'Diamantes',
    cfg: {
      grid: 50, spacing: 1, shapeSize: 110, lowThr: 90, highThr: 170, invert: false, bg: '#0a0a0a',
      bands: { shadow: { shape: 'diamond', color: '#e8ff47', glyph: '' }, mid: { shape: 'diamond', color: '#888888', glyph: '' }, highlight: { shape: 'none', color: '#000000', glyph: '' } },
    },
  },
  {
    name: 'Mixto',
    cfg: {
      grid: 65, spacing: 0, shapeSize: 100, lowThr: 75, highThr: 180, invert: false, bg: '#0a0a0a',
      bands: { shadow: { shape: 'fillsq', color: '#e8ff47', glyph: '' }, mid: { shape: 'circle', color: '#ffffff', glyph: '' }, highlight: { shape: 'none', color: '#000', glyph: '' } },
    },
  },
];

// ── DOM ─────────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const canvas = $('canvas');
const ctx = canvas.getContext('2d');
const video = $('webcam');
const toast = $('toast');

const elGridDensity = $('gridDensity');
const elGridSpacing = $('gridSpacing');
const elShapeSize   = $('shapeSize');
const elLowThr      = $('lowThr');
const elHighThr     = $('highThr');
const elInvert      = $('invertTones');
const elBgColor     = $('bgColor');
const elGridLabel   = $('gridLabel');
const elSpacingLabel= $('spacingLabel');
const elSizeLabel   = $('sizeLabel');
const elLowLabel    = $('lowLabel');
const elHighLabel   = $('highLabel');
const elSourceStatus= $('sourceStatus');
const elStageMeta   = $('stageMeta');
const elStageHint   = $('stageHint');
const elPresets     = $('presets');
const elFileInput   = $('fileInput');

// ── Canvas sizing ───────────────────────────────────────────────────────────
const CANVAS_TARGET = 1200;     // longest side
let canvasW = 1200, canvasH = 1200;

function setCanvasSize(srcW, srcH) {
  const ratio = srcW / srcH;
  if (ratio >= 1) {
    canvasW = CANVAS_TARGET;
    canvasH = Math.round(CANVAS_TARGET / ratio);
  } else {
    canvasH = CANVAS_TARGET;
    canvasW = Math.round(CANVAS_TARGET * ratio);
  }
  canvas.width = canvasW;
  canvas.height = canvasH;
  elStageMeta.textContent = `${canvasW}×${canvasH}`;
}

// Offscreen for sampling (smaller, fast)
const sampleCanvas = document.createElement('canvas');
const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

// ── Shape picker ────────────────────────────────────────────────────────────
function buildShapePickers() {
  document.querySelectorAll('.shape-picker').forEach((picker) => {
    const band = picker.dataset.band;
    picker.innerHTML = SHAPES.map(s => `
      <button class="shape-btn" data-band="${band}" data-shape="${s.id}" type="button" title="${s.id}">
        <span>${s.label}</span>
      </button>
    `).join('');
    picker.querySelectorAll('.shape-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.config.bands[band].shape = btn.dataset.shape;
        updateShapeSelection();
        render();
      });
    });
  });
  updateShapeSelection();
}

function updateShapeSelection() {
  document.querySelectorAll('.shape-btn').forEach(btn => {
    const band = btn.dataset.band;
    btn.classList.toggle('active', state.config.bands[band].shape === btn.dataset.shape);
  });
  document.querySelectorAll('.band-dot').forEach(d => {
    d.style.background = state.config.bands[d.dataset.band].color;
  });
}

// ── Presets ─────────────────────────────────────────────────────────────────
function buildPresets() {
  elPresets.innerHTML = PRESETS.map((p, i) => `
    <button class="preset-btn" data-idx="${i}" type="button">${p.name}</button>
  `).join('');
  elPresets.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = PRESETS[+btn.dataset.idx];
      state.config = JSON.parse(JSON.stringify(preset.cfg));
      syncUIFromConfig();
      render();
    });
  });
}

function syncUIFromConfig() {
  const c = state.config;
  elGridDensity.value = c.grid;       elGridLabel.textContent = c.grid;
  elGridSpacing.value = c.spacing;    elSpacingLabel.textContent = c.spacing;
  elShapeSize.value   = c.shapeSize;  elSizeLabel.textContent = c.shapeSize + '%';
  elLowThr.value      = c.lowThr;     elLowLabel.textContent = c.lowThr;
  elHighThr.value     = c.highThr;    elHighLabel.textContent = c.highThr;
  elInvert.checked    = c.invert;
  elBgColor.value     = c.bg;
  document.querySelectorAll('input[data-band][data-key="color"]').forEach(inp => {
    inp.value = c.bands[inp.dataset.band].color;
  });
  document.querySelectorAll('input[data-band][data-key="glyph"]').forEach(inp => {
    inp.value = c.bands[inp.dataset.band].glyph || '';
  });
  updateShapeSelection();
}

// ── Inputs wiring ───────────────────────────────────────────────────────────
function wireInputs() {
  const bind = (el, label, key, parse = Number, suffix = '') => {
    el.addEventListener('input', () => {
      state.config[key] = parse(el.value);
      if (label) label.textContent = state.config[key] + suffix;
      // clamp thresholds
      if (key === 'lowThr' && state.config.lowThr >= state.config.highThr) {
        state.config.highThr = state.config.lowThr + 5;
        elHighThr.value = state.config.highThr;
        elHighLabel.textContent = state.config.highThr;
      }
      if (key === 'highThr' && state.config.highThr <= state.config.lowThr) {
        state.config.lowThr = state.config.highThr - 5;
        elLowThr.value = state.config.lowThr;
        elLowLabel.textContent = state.config.lowThr;
      }
      render();
    });
  };
  bind(elGridDensity, elGridLabel, 'grid');
  bind(elGridSpacing, elSpacingLabel, 'spacing');
  bind(elShapeSize,   elSizeLabel,   'shapeSize', Number, '%');
  bind(elLowThr,      elLowLabel,    'lowThr');
  bind(elHighThr,     elHighLabel,   'highThr');

  elInvert.addEventListener('change', () => { state.config.invert = elInvert.checked; render(); });
  elBgColor.addEventListener('input', () => { state.config.bg = elBgColor.value; render(); });

  document.querySelectorAll('input[data-band][data-key="color"]').forEach(inp => {
    inp.addEventListener('input', () => {
      state.config.bands[inp.dataset.band].color = inp.value;
      updateShapeSelection();
      render();
    });
  });
  document.querySelectorAll('input[data-band][data-key="glyph"]').forEach(inp => {
    inp.addEventListener('input', () => {
      state.config.bands[inp.dataset.band].glyph = inp.value;
      render();
    });
  });
}

// ── Source handling ─────────────────────────────────────────────────────────
$('btnUpload').addEventListener('click', () => elFileInput.click());
elFileInput.addEventListener('change', () => {
  const f = elFileInput.files[0];
  if (!f) return;
  loadImageFile(f);
  elFileInput.value = '';
});

$('btnWebcam').addEventListener('click', () => toggleWebcam());
$('btnDemo').addEventListener('click', () => loadDemoImage());
$('btnAnim').addEventListener('click', () => toggleAnimation());

async function loadImageFile(file) {
  stopWebcam();
  stopAnimation();
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    state.source = img;
    state.sourceType = 'image';
    setCanvasSize(img.naturalWidth, img.naturalHeight);
    elSourceStatus.textContent = `Imagen: ${file.name}`;
    elStageHint.textContent = '';
    render();
    URL.revokeObjectURL(url);
  };
  img.onerror = () => { toastMsg('No se pudo cargar la imagen'); URL.revokeObjectURL(url); };
  img.src = url;
}

async function toggleWebcam() {
  if (state.sourceType === 'webcam') { stopWebcam(); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
    state.webcamStream = stream;
    video.srcObject = stream;
    await video.play();
    state.source = video;
    state.sourceType = 'webcam';
    setCanvasSize(video.videoWidth || 1280, video.videoHeight || 720);
    elSourceStatus.textContent = 'Webcam activa';
    elStageHint.textContent = '';
    loopWebcam();
  } catch (err) {
    toastMsg('No se pudo abrir la webcam');
    console.error(err);
  }
}

function stopWebcam() {
  if (state.webcamStream) {
    state.webcamStream.getTracks().forEach(t => t.stop());
    state.webcamStream = null;
  }
  if (state.rafId) cancelAnimationFrame(state.rafId);
  state.rafId = null;
  if (state.sourceType === 'webcam') {
    state.source = null;
    state.sourceType = 'none';
    elSourceStatus.textContent = 'Sin fuente';
  }
}

function loopWebcam() {
  if (state.sourceType !== 'webcam') return;
  render();
  state.rafId = requestAnimationFrame(loopWebcam);
}

// ── Animation source ────────────────────────────────────────────────────────
const animCanvas = document.createElement('canvas');
animCanvas.width = 1024; animCanvas.height = 1024;
const animCtx = animCanvas.getContext('2d');
let animStart = 0;

function toggleAnimation() {
  if (state.sourceType === 'anim') { stopAnimation(); return; }
  stopWebcam();
  state.source = animCanvas;
  state.sourceType = 'anim';
  setCanvasSize(animCanvas.width, animCanvas.height);
  elSourceStatus.textContent = 'Animación en vivo';
  elStageHint.textContent = '';
  animStart = performance.now();
  loopAnimation();
}

function stopAnimation() {
  if (state.sourceType !== 'anim') return;
  if (state.rafId) cancelAnimationFrame(state.rafId);
  state.rafId = null;
  state.source = null;
  state.sourceType = 'none';
  elSourceStatus.textContent = 'Sin fuente';
}

function loopAnimation() {
  if (state.sourceType !== 'anim') return;
  const t = (performance.now() - animStart) / 1000;
  drawAnimationFrame(animCtx, animCanvas.width, animCanvas.height, t);
  render();
  state.rafId = requestAnimationFrame(loopAnimation);
}

function drawAnimationFrame(g, w, h, t) {
  // Background gradient — slowly drifting
  const bg = g.createLinearGradient(0, 0, w, h);
  const phase = t * 0.2;
  bg.addColorStop(0, `hsl(${(phase * 40) % 360}, 8%, 6%)`);
  bg.addColorStop(1, '#000');
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);

  const cx = w / 2, cy = h / 2;
  const R = Math.min(w, h) * 0.34;

  // Orbiting accent disc behind
  const obx = cx + Math.cos(t * 0.7) * R * 0.5;
  const oby = cy + Math.sin(t * 0.7) * R * 0.5;
  const ogr = g.createRadialGradient(obx, oby, 0, obx, oby, R * 0.9);
  ogr.addColorStop(0, '#bbbbbb');
  ogr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = ogr;
  g.fillRect(0, 0, w, h);

  // Rotating sphere with directional light
  const lightAngle = t * 0.9;
  const lx = cx + Math.cos(lightAngle) * R * 0.55;
  const ly = cy - R * 0.25 + Math.sin(lightAngle * 0.6) * R * 0.15;
  const grad = g.createRadialGradient(lx, ly, R * 0.05, cx, cy, R * 1.1);
  grad.addColorStop(0.00, '#ffffff');
  grad.addColorStop(0.25, '#dddddd');
  grad.addColorStop(0.55, '#666666');
  grad.addColorStop(0.85, '#1a1a1a');
  grad.addColorStop(1.00, '#000000');
  g.save();
  g.beginPath();
  g.arc(cx, cy, R, 0, Math.PI * 2);
  g.clip();
  g.fillStyle = grad;
  g.fillRect(cx - R, cy - R, R * 2, R * 2);

  // Texture: scrolling longitudes (fake rotation of sphere)
  const rot = t * 0.5;
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2 + rot;
    const xs = Math.cos(ang);
    // skip back half
    if (xs < -0.05) continue;
    // x position projected onto disc
    const px = cx + xs * R;
    // width depends on cos for foreshortening
    const lw = Math.max(2, R * 0.04 * Math.abs(xs));
    g.fillStyle = `rgba(0,0,0,${0.15 + 0.25 * xs})`;
    g.beginPath();
    g.ellipse(px, cy, lw, R * Math.sqrt(1 - 0), 0, 0, Math.PI * 2);
    g.fill();
  }
  // Latitude rings (static)
  for (let j = -3; j <= 3; j++) {
    const y = cy + (j / 4) * R;
    const w2 = R * Math.sqrt(Math.max(0, 1 - ((j / 4) ** 2)));
    g.strokeStyle = 'rgba(0,0,0,0.18)';
    g.lineWidth = R * 0.012;
    g.beginPath();
    g.ellipse(cx, y, w2, R * 0.04, 0, 0, Math.PI * 2);
    g.stroke();
  }
  g.restore();

  // Rim glow
  g.save();
  g.globalCompositeOperation = 'lighter';
  const rim = g.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.08);
  rim.addColorStop(0, 'rgba(255,255,255,0)');
  rim.addColorStop(1, 'rgba(255,255,255,0.18)');
  g.fillStyle = rim;
  g.beginPath();
  g.arc(cx, cy, R * 1.08, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function loadDemoImage() {
  stopWebcam();
  stopAnimation();
  // Generated radial gradient as quick fallback demo
  const tmp = document.createElement('canvas');
  tmp.width = 1024; tmp.height = 1024;
  const tctx = tmp.getContext('2d');
  const grad = tctx.createRadialGradient(512, 420, 50, 512, 512, 700);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.4, '#888888');
  grad.addColorStop(1, '#000000');
  tctx.fillStyle = grad;
  tctx.fillRect(0, 0, 1024, 1024);
  // Soft shape on top
  tctx.globalCompositeOperation = 'screen';
  tctx.fillStyle = '#444';
  tctx.beginPath();
  tctx.arc(380, 380, 180, 0, Math.PI * 2); tctx.fill();
  tctx.beginPath();
  tctx.arc(700, 600, 120, 0, Math.PI * 2); tctx.fill();
  const img = new Image();
  img.onload = () => {
    state.source = img;
    state.sourceType = 'image';
    setCanvasSize(1024, 1024);
    elSourceStatus.textContent = 'Demo';
    elStageHint.textContent = '';
    render();
  };
  img.src = tmp.toDataURL();
}

// ── Render loop ─────────────────────────────────────────────────────────────
function render() {
  const c = state.config;
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, canvasW, canvasH);
  if (!state.source) return;

  // Downsample source to grid resolution for luminance sampling.
  // We map grid columns to canvas width, and grid rows to maintain pixel-aspect.
  const cols = Math.max(4, c.grid | 0);
  const cellPx = canvasW / cols;
  const rows = Math.max(4, Math.round(canvasH / cellPx));

  sampleCanvas.width = cols;
  sampleCanvas.height = rows;
  // cover-fit source into sample canvas
  drawSourceCover(sampleCtx, state.source, cols, rows);
  const data = sampleCtx.getImageData(0, 0, cols, rows).data;

  const padding = c.spacing;
  const drawSize = (cellPx - padding) * (c.shapeSize / 100);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      let lum = 0.2126 * data[i] + 0.7152 * data[i+1] + 0.0722 * data[i+2];
      if (c.invert) lum = 255 - lum;
      let band;
      if (lum <= c.lowThr) band = 'shadow';
      else if (lum <= c.highThr) band = 'mid';
      else band = 'highlight';
      const cx = x * cellPx + cellPx / 2;
      const cy = y * cellPx + cellPx / 2;
      drawBand(ctx, band, cx, cy, drawSize, c.bands[band]);
    }
  }
}

function drawSourceCover(targetCtx, src, w, h) {
  const sw = src.videoWidth || src.naturalWidth || src.width;
  const sh = src.videoHeight || src.naturalHeight || src.height;
  if (!sw || !sh) { targetCtx.clearRect(0, 0, w, h); return; }
  const srcRatio = sw / sh;
  const dstRatio = w / h;
  let sx = 0, sy = 0, scrop = sw, hcrop = sh;
  if (srcRatio > dstRatio) {
    scrop = sh * dstRatio;
    sx = (sw - scrop) / 2;
  } else {
    hcrop = sw / dstRatio;
    sy = (sh - hcrop) / 2;
  }
  targetCtx.clearRect(0, 0, w, h);
  targetCtx.drawImage(src, sx, sy, scrop, hcrop, 0, 0, w, h);
}

function drawBand(g, band, cx, cy, size, bandCfg) {
  if (bandCfg.shape === 'none' && !bandCfg.glyph) return;
  g.save();
  g.fillStyle = bandCfg.color;
  g.strokeStyle = bandCfg.color;
  if (bandCfg.glyph) {
    g.font = `${size}px "Space Grotesk", monospace`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(bandCfg.glyph, cx, cy);
  } else {
    drawShape(g, bandCfg.shape, cx, cy, size);
  }
  g.restore();
}

function drawShape(g, shape, cx, cy, size) {
  const r = size / 2;
  const lw = Math.max(1, size * 0.12);
  switch (shape) {
    case 'circle':
      g.lineWidth = lw;
      g.beginPath(); g.arc(cx, cy, r - lw / 2, 0, Math.PI * 2); g.stroke();
      break;
    case 'disc':
      g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
      break;
    case 'square':
      g.lineWidth = lw;
      g.strokeRect(cx - r + lw / 2, cy - r + lw / 2, size - lw, size - lw);
      break;
    case 'fillsq':
      g.fillRect(cx - r, cy - r, size, size);
      break;
    case 'triangle':
      g.beginPath();
      g.moveTo(cx, cy - r);
      g.lineTo(cx + r * 0.866, cy + r * 0.5);
      g.lineTo(cx - r * 0.866, cy + r * 0.5);
      g.closePath(); g.fill();
      break;
    case 'diamond':
      g.beginPath();
      g.moveTo(cx, cy - r);
      g.lineTo(cx + r, cy);
      g.lineTo(cx, cy + r);
      g.lineTo(cx - r, cy);
      g.closePath(); g.fill();
      break;
    case 'plus': {
      const t = size * 0.28;
      g.fillRect(cx - t/2, cy - r, t, size);
      g.fillRect(cx - r, cy - t/2, size, t);
      break;
    }
    case 'cross': {
      g.lineWidth = lw;
      g.beginPath();
      g.moveTo(cx - r, cy - r); g.lineTo(cx + r, cy + r);
      g.moveTo(cx + r, cy - r); g.lineTo(cx - r, cy + r);
      g.stroke();
      break;
    }
    case 'line':
      g.fillRect(cx - lw / 2, cy - r, lw, size);
      break;
    case 'dot':
      g.beginPath(); g.arc(cx, cy, Math.max(1, size * 0.18), 0, Math.PI * 2); g.fill();
      break;
    case 'ring':
      g.lineWidth = lw * 0.7;
      g.beginPath(); g.arc(cx, cy, r - lw / 2, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(cx, cy, r * 0.45, 0, Math.PI * 2); g.fill();
      break;
    case 'none':
    default:
      break;
  }
}

// ── Actions ─────────────────────────────────────────────────────────────────
$('btnDownload').addEventListener('click', () => {
  if (!state.source) { toastMsg('Necesitás una fuente primero'); return; }
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `composicion-${Date.now()}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
});

$('btnShare').addEventListener('click', async () => {
  const cfgJson = JSON.stringify(state.config);
  const cfgB64 = btoa(unescape(encodeURIComponent(cfgJson)));
  const url = `${location.origin}${location.pathname}?cfg=${cfgB64}`;
  try {
    await navigator.clipboard.writeText(url);
    toastMsg('Link copiado al portapapeles');
  } catch {
    prompt('Copiá el link:', url);
  }
});

// ── URL load ────────────────────────────────────────────────────────────────
function loadConfigFromURL() {
  const params = new URLSearchParams(location.search);
  const cfg = params.get('cfg');
  if (!cfg) return;
  try {
    const json = decodeURIComponent(escape(atob(cfg)));
    const parsed = JSON.parse(json);
    state.config = { ...defaultConfig(), ...parsed, bands: { ...defaultConfig().bands, ...(parsed.bands || {}) } };
    syncUIFromConfig();
  } catch (err) {
    console.warn('Bad cfg in URL', err);
  }
}

// ── Panel toggle ────────────────────────────────────────────────────────────
$('panelToggle').addEventListener('click', () => {
  document.body.classList.toggle('panel-collapsed');
});

// ── Toast ───────────────────────────────────────────────────────────────────
let toastTimer;
function toastMsg(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

// ── Init ────────────────────────────────────────────────────────────────────
function init() {
  buildShapePickers();
  buildPresets();
  syncUIFromConfig();
  wireInputs();
  setCanvasSize(1024, 1024);
  loadConfigFromURL();
  loadDemoImage();
}
init();
