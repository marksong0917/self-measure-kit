/*
 * Self-Measure Kit — a 6-step wizard that lets a customer measure their own
 * kitchen, closet or mudroom and produce a quote-ready summary for the shop.
 * Everything runs locally in the browser; nothing is sent anywhere.
 *
 * A note on prices: the rates in CONFIG below are SAMPLE numbers, included so
 * the demo produces a believable budget range. They are aligned with the
 * companion Trade Estimator demo so the two tell one consistent story — but
 * they are NOT any real shop's pricing. A shop making this kit its own edits
 * exactly one place: the CONFIG object.
 */
'use strict';

/* ==========================================================================
 * CONFIG — the one place a shop edits to make this kit its own.
 * Rates are CAD per metre of cabinet run. `levels` are finish-level
 * multipliers applied on top of the base range:
 *   Kitchen  standard x1 · premium x1.5 · luxury x2.2
 *   Closet   standard x1 · premium x1.4 · luxury x1.9
 *   Mudroom / Other use sample base rates with x1 / x1.4 / x1.9.
 * ======================================================================== */
const CONFIG = {
  shopName: 'Maple Works Studio', // sample shop used by this demo

  rates: {
    Kitchen: { base: [1800, 2600], levels: { standard: 1, premium: 1.5, luxury: 2.2 } },
    Closet:  { base: [900, 1400],  levels: { standard: 1, premium: 1.4, luxury: 1.9 } },
    Mudroom: { base: [1100, 1600], levels: { standard: 1, premium: 1.4, luxury: 1.9 } },
    Other:   { base: [1000, 1500], levels: { standard: 1, premium: 1.4, luxury: 1.9 } },
  },

  levelLabels: { standard: 'Standard', premium: 'Premium', luxury: 'Luxury' },

  // Room-size limits in centimetres (min, max per field).
  sizeLimits: {
    lenCm: [50, 3000],
    widCm: [50, 3000],
    heiCm: [180, 500],
  },

  maxPerWallCount: 9, // doors / windows / obstacles stepper cap
};

/* ============================== State ================================== */

const TOTAL_STEPS = 6;
const WALL_DEFS = [
  { id: 'A', sizeField: 'lenCm' },
  { id: 'B', sizeField: 'widCm' },
  { id: 'C', sizeField: 'lenCm' },
  { id: 'D', sizeField: 'widCm' },
];

let currentStep = 1;
let summaryText = '';
const photoNames = [];
const wallState = {};
WALL_DEFS.forEach((w) => {
  wallState[w.id] = { use: false, doors: 0, windows: 0, obstacles: 0 };
});

/* ============================= Helpers ================================= */

const $ = (id) => document.getElementById(id);

function radioValue(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}

function money(n) {
  return '$' + Math.round(n).toLocaleString('en-CA');
}

function readCm(id) {
  const v = parseFloat($(id).value);
  return Number.isFinite(v) ? v : NaN;
}

function setFieldError(inputId, errorId, message) {
  const input = $(inputId);
  const error = $(errorId);
  error.textContent = message || '';
  error.hidden = !message;
  input.toggleAttribute('aria-invalid', Boolean(message));
}

/* =========================== Navigation ================================ */

const stepEls = document.querySelectorAll('.step');
const progressFill = $('progressFill');
const progressLabel = $('progressLabel');

function showStep(n) {
  currentStep = n;
  stepEls.forEach((s) => s.classList.toggle('active', Number(s.dataset.step) === n));
  const shown = Math.min(n, TOTAL_STEPS);
  progressFill.style.width = (shown / TOTAL_STEPS) * 100 + '%';
  progressLabel.textContent = n > TOTAL_STEPS ? 'Summary ready' : `Step ${n} of ${TOTAL_STEPS}`;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* =========================== Validation ================================ */

function validateSpace() {
  const ok = Boolean(radioValue('space'));
  $('errSpace').hidden = ok;
  return ok;
}

function validateSize() {
  let allOk = true;
  Object.entries(CONFIG.sizeLimits).forEach(([id, [min, max]]) => {
    const v = readCm(id);
    const label = { lenCm: 'length', widCm: 'width', heiCm: 'ceiling height' }[id];
    const message = !Number.isFinite(v)
      ? `Please enter the ${label} in cm.`
      : (v < min || v > max)
        ? `Enter a ${label} between ${min.toLocaleString('en-CA')} and ${max.toLocaleString('en-CA')} cm.`
        : '';
    setFieldError(id, 'err-' + id, message);
    if (message) allOk = false;
  });
  if (allOk) buildWalls();
  return allOk;
}

function validateWalls() {
  const ok = WALL_DEFS.some((w) => wallState[w.id].use);
  $('errWalls').hidden = ok;
  return ok;
}

function validateContact() {
  const nameOk = $('cName').value.trim().length > 1;
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test($('cEmail').value.trim());
  setFieldError('cName', 'errName', nameOk ? '' : 'Please add your name.');
  setFieldError('cEmail', 'errEmail', emailOk ? '' : 'Please add a valid email so the shop can send the quote.');
  return nameOk && emailOk;
}

const validators = { 1: validateSpace, 2: validateSize, 3: validateWalls, 6: validateContact };

document.querySelectorAll('[data-next]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const validate = validators[currentStep];
    if (!validate || validate()) showStep(currentStep + 1);
  });
});
document.querySelectorAll('[data-back]').forEach((btn) => {
  btn.addEventListener('click', () => showStep(Math.max(1, currentStep - 1)));
});

// Clear a field's error as soon as the user starts fixing it.
const FIELD_ERRORS = { lenCm: 'err-lenCm', widCm: 'err-widCm', heiCm: 'err-heiCm', cName: 'errName', cEmail: 'errEmail' };
Object.entries(FIELD_ERRORS).forEach(([id, errorId]) => {
  $(id).addEventListener('input', () => setFieldError(id, errorId, ''));
});

/* ============================== Walls ================================== */

function stepperHTML(wallId, key, labelText, value) {
  return `<div class="count"><span>${labelText}</span>
    <div class="stepper">
      <button type="button" data-wall="${wallId}" data-key="${key}" data-dir="-1" aria-label="Fewer ${labelText}">−</button>
      <output id="out-${wallId}-${key}">${value}</output>
      <button type="button" data-wall="${wallId}" data-key="${key}" data-dir="1" aria-label="More ${labelText}">+</button>
    </div></div>`;
}

function buildWalls() {
  const list = $('wallList');
  list.innerHTML = '';
  WALL_DEFS.forEach((w) => {
    const st = wallState[w.id];
    const len = Math.round(readCm(w.sizeField) || 0);
    const div = document.createElement('div');
    div.className = 'wall' + (st.use ? '' : ' off');
    div.id = 'wall-' + w.id;
    div.innerHTML = `
      <div class="wall-head">
        <label><input type="checkbox" id="use-${w.id}" ${st.use ? 'checked' : ''}> Wall ${w.id} — cabinets / storage here</label>
        <span class="wall-len">${len} cm long</span>
      </div>
      <div class="wall-counts">
        ${stepperHTML(w.id, 'doors', 'Doors', st.doors)}
        ${stepperHTML(w.id, 'windows', 'Windows', st.windows)}
        ${stepperHTML(w.id, 'obstacles', 'Obstacles (rad, vent…)', st.obstacles)}
      </div>`;
    list.appendChild(div);
    $('use-' + w.id).addEventListener('change', (e) => {
      st.use = e.target.checked;
      div.classList.toggle('off', !st.use);
      if (st.use) $('errWalls').hidden = true;
    });
  });
  list.querySelectorAll('.stepper button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const st = wallState[btn.dataset.wall];
      const key = btn.dataset.key;
      st[key] = Math.max(0, Math.min(CONFIG.maxPerWallCount, st[key] + Number(btn.dataset.dir)));
      $(`out-${btn.dataset.wall}-${key}`).textContent = st[key];
    });
  });
}

/* ============================== Photos ================================= */
/* Preview only — in this demo nothing uploads anywhere. */

$('photoInput').addEventListener('change', (e) => {
  const grid = $('photoGrid');
  Array.from(e.target.files).forEach((file) => {
    photoNames.push(file.name);
    const fig = document.createElement('figure');
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.alt = file.name;
    const cap = document.createElement('figcaption');
    cap.textContent = file.name;
    fig.appendChild(img);
    fig.appendChild(cap);
    grid.appendChild(fig);
  });
});

/* ============================== Summary ================================ */

function estimateRange(spaceType, level, runCm) {
  const rate = CONFIG.rates[spaceType] || CONFIG.rates.Other;
  const mult = rate.levels[level] || 1;
  const metres = runCm / 100;
  return {
    mult,
    text: `${money(metres * rate.base[0] * mult)} – ${money(metres * rate.base[1] * mult)}`,
  };
}

function buildSummary() {
  const space = radioValue('space') || 'Other';
  const level = radioValue('level') || 'standard';
  const len = Math.round(readCm('lenCm') || 0);
  const wid = Math.round(readCm('widCm') || 0);
  const hei = Math.round(readCm('heiCm') || 0);
  const wallLen = { A: len, B: wid, C: len, D: wid };

  let runCm = 0;
  const wallLines = [];
  WALL_DEFS.forEach((w) => {
    const st = wallState[w.id];
    if (!st.use) return;
    runCm += wallLen[w.id];
    wallLines.push(
      `  Wall ${w.id}: ${wallLen[w.id]} cm run — ${st.doors} door(s), ${st.windows} window(s), ${st.obstacles} obstacle(s)`
    );
  });

  const range = estimateRange(space, level, runCm);
  const notes = $('cNotes').value.trim();

  const lines = [
    `SELF-MEASURE SUMMARY — ${CONFIG.shopName} (demo)`,
    '',
    `Space: ${space}`,
    `Room: ${len} × ${wid} cm, ceiling ${hei} cm`,
    '',
    'Cabinet / storage walls:',
    ...wallLines,
    `Estimated cabinet run: ${runCm} cm (${(runCm / 100).toFixed(1)} m)`,
    '',
    `Style: ${radioValue('door') || 'not chosen'} · ${radioValue('finish') || 'not chosen'} · Hardware: ${radioValue('hardware') || 'not chosen'}`,
    `Finish level: ${CONFIG.levelLabels[level]} (x${range.mult})`,
    `Photos: ${photoNames.length ? photoNames.length + ' attached (' + photoNames.join(', ') + ')' : 'none yet'}`,
    '',
    `Rough budget range: ${range.text}`,
    '(Sample prices, for demo only — the shop confirms a real quote after review.)',
    '',
    `Contact: ${$('cName').value.trim()} · ${$('cEmail').value.trim()}${$('cPhone').value.trim() ? ' · ' + $('cPhone').value.trim() : ''}`,
    `Best time: ${$('cTime').value}`,
  ];
  if (notes) lines.push(`Notes: ${notes}`);
  return lines.join('\n');
}

$('btnSummary').addEventListener('click', () => {
  if (!validateContact()) return;
  summaryText = buildSummary();
  $('summaryPanel').textContent = summaryText;
  $('copiedMsg').hidden = true;
  showStep(7);
});

/* ========================= Copy / download ============================= */

$('btnCopy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(summaryText);
  } catch (err) {
    // Clipboard API unavailable (older browser / permissions) — fall back.
    const ta = document.createElement('textarea');
    ta.value = summaryText;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  $('copiedMsg').hidden = false;
});

$('btnDownload').addEventListener('click', () => {
  const blob = new Blob([summaryText], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'measure-summary.txt';
  a.click();
  URL.revokeObjectURL(a.href);
});

/* ================================ Init ================================= */

buildWalls();
showStep(1);
