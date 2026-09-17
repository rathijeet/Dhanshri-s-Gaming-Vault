// What's on the monitor.
//
// Each scene is drawn into a plain 2D canvas every frame and mapped onto the
// screen mesh as a texture — no video files, no assets, no bandwidth. The point
// is to show the customer the machine DOING the thing they asked for: a game
// running, a timeline scrubbing, a model training.
//
// Signature: draw(ctx, w, h, t, rgb) where t is elapsed seconds and rgb is the
// user's chosen lighting colour as a CSS string.

// `video` is the path, without extension, to real footage of the machine
// doing the thing — a game actually running, a timeline actually being
// scrubbed. Drop `<name>.mp4` (or .webm) in public/screens/ and it plays; leave it out and the hand-drawn
// scene below stands in, so the viewer never breaks on a missing file.
// See public/screens/README.md before adding anything: this is a commercial
// site, so the footage has to be ours or licensed for it.
export const SCREEN_SCENES = [
  { id: 'gaming',  label: 'Gaming',        icon: 'sports_esports',  video: '/screens/gaming' },
  { id: 'creator', label: 'Video editing', icon: 'movie_edit',      video: '/screens/creator' },
  { id: 'ai',      label: 'AI / training', icon: 'neurology',       video: '/screens/ai' },
  { id: 'office',  label: 'Office',        icon: 'business_center', video: '/screens/office' },
]

const mono = (px) => `${px}px ui-monospace, SFMono-Regular, Menlo, monospace`
const sans = (px, w = 400) => `${w} ${px}px Inter, system-ui, sans-serif`

// ---------------- gaming ----------------
function drawGaming(ctx, w, h, t, rgb) {
  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62)
  sky.addColorStop(0, '#0a1430')
  sky.addColorStop(1, '#3a1d5c')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h * 0.62)

  // sun
  ctx.fillStyle = 'rgba(255,120,90,0.85)'
  ctx.beginPath(); ctx.arc(w * 0.5, h * 0.58, h * 0.20, 0, Math.PI * 2); ctx.fill()

  // ground
  ctx.fillStyle = '#07070f'
  ctx.fillRect(0, h * 0.62, w, h * 0.38)

  // perspective grid rushing toward the viewer
  ctx.strokeStyle = rgb
  ctx.globalAlpha = 0.55
  ctx.lineWidth = 1.5
  const horizon = h * 0.62
  for (let i = -10; i <= 10; i++) {
    ctx.beginPath()
    ctx.moveTo(w / 2 + i * (w / 14), h)
    ctx.lineTo(w / 2 + i * 6, horizon)
    ctx.stroke()
  }
  const speed = (t * 0.55) % 1
  for (let i = 0; i < 12; i++) {
    const p = ((i + speed) / 12) ** 2.6
    const y = horizon + p * (h - horizon)
    ctx.globalAlpha = 0.5 * (1 - p * 0.6)
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }
  ctx.globalAlpha = 1

  // crosshair
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  const cx = w / 2, cy = h * 0.47
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    ctx.beginPath()
    ctx.moveTo(cx + dx * 9, cy + dy * 9)
    ctx.lineTo(cx + dx * 20, cy + dy * 20)
    ctx.stroke()
  }

  // HUD
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fillRect(18, h - 56, 190, 38)
  ctx.fillStyle = '#ff5d6c'
  ctx.fillRect(24, h - 48, 110 + Math.sin(t * 1.4) * 18, 9)
  ctx.fillStyle = rgb
  ctx.fillRect(24, h - 33, 150, 9)
  ctx.fillStyle = '#e9f2ff'
  ctx.font = mono(15)
  ctx.textAlign = 'right'
  ctx.fillText(`${Math.round(158 + Math.sin(t * 3) * 12)} FPS`, w - 20, 32)
  ctx.font = mono(11)
  ctx.fillStyle = rgb
  ctx.fillText('1440p · ULTRA', w - 20, 50)
  ctx.textAlign = 'left'
}

// ---------------- video editing ----------------
function drawCreator(ctx, w, h, t, rgb) {
  ctx.fillStyle = '#12151c'; ctx.fillRect(0, 0, w, h)

  // preview
  const pv = { x: 14, y: 14, w: w - 28, h: h * 0.52 }
  const g = ctx.createLinearGradient(pv.x, pv.y, pv.x + pv.w, pv.y + pv.h)
  const hue = (t * 22) % 360
  g.addColorStop(0, `hsl(${hue},62%,42%)`)
  g.addColorStop(1, `hsl(${(hue + 80) % 360},58%,26%)`)
  ctx.fillStyle = g
  ctx.fillRect(pv.x, pv.y, pv.w, pv.h)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fillRect(pv.x, pv.y, pv.w, 22)
  ctx.fillStyle = '#cdd8e6'; ctx.font = mono(11)
  ctx.fillText('PREVIEW · 3840×2160 · 10-bit', pv.x + 8, pv.y + 15)

  // timeline
  const ty = pv.y + pv.h + 14
  ctx.fillStyle = '#0c0f15'; ctx.fillRect(14, ty, w - 28, h - ty - 14)
  const clips = [
    { x: 0.00, w: 0.22, c: rgb },
    { x: 0.23, w: 0.30, c: '#5aa9ff' },
    { x: 0.54, w: 0.18, c: '#ffb44d' },
    { x: 0.73, w: 0.26, c: '#a97bff' },
  ]
  clips.forEach((c, i) => {
    ctx.fillStyle = c.c
    ctx.globalAlpha = 0.85
    ctx.fillRect(20 + c.x * (w - 40), ty + 10 + (i % 2) * 26, c.w * (w - 40), 21)
  })
  ctx.globalAlpha = 1

  // waveform
  ctx.strokeStyle = 'rgba(120,200,255,0.75)'
  ctx.lineWidth = 1.4
  ctx.beginPath()
  const wy = ty + 74
  for (let x = 0; x < w - 40; x += 3) {
    const a = Math.sin(x * 0.09 + t * 2) * Math.sin(x * 0.021) * 13
    ctx.moveTo(20 + x, wy - a); ctx.lineTo(20 + x, wy + a)
  }
  ctx.stroke()

  // playhead
  const px = 20 + ((t * 0.10) % 1) * (w - 40)
  ctx.strokeStyle = '#ff5d6c'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(px, ty); ctx.lineTo(px, h - 14); ctx.stroke()
}

// ---------------- AI / training ----------------
const CODE = [
  'model = AutoModelForCausalLM.from_pretrained(',
  '    "meta-llama/Llama-3-70B", device_map="auto")',
  'tok = AutoTokenizer.from_pretrained(MODEL_ID)',
  'trainer = SFTTrainer(model, train_dataset=ds,',
  '    peft_config=lora, max_seq_length=4096)',
  'trainer.train()',
  '',
  '>>> loading shards ......... done',
  '>>> cuda:0  allocated 21.4 GiB / 24.0 GiB',
]
function drawAI(ctx, w, h, t, rgb) {
  ctx.fillStyle = '#05070c'; ctx.fillRect(0, 0, w, h)

  ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(0, 0, w, 24)
  ctx.fillStyle = rgb; ctx.font = mono(11)
  ctx.fillText('train.py — python3.12 — CUDA 12.6', 12, 16)

  const lines = Math.min(CODE.length, Math.floor(t * 2.2) % (CODE.length + 5))
  ctx.font = mono(12)
  for (let i = 0; i < lines; i++) {
    ctx.fillStyle = CODE[i].startsWith('>>>') ? rgb : '#9fb4cc'
    ctx.fillText(CODE[i], 12, 44 + i * 16)
  }
  if (Math.floor(t * 2) % 2 === 0) {
    ctx.fillStyle = rgb
    ctx.fillRect(12 + (CODE[lines - 1] || '').length * 7.2, 34 + (lines - 1) * 16, 7, 13)
  }

  // training progress
  const py = h - 52
  const pct = (t * 0.06) % 1
  ctx.fillStyle = '#1b2330'; ctx.fillRect(12, py, w - 24, 12)
  ctx.fillStyle = rgb; ctx.fillRect(12, py, (w - 24) * pct, 12)
  ctx.fillStyle = '#cdd8e6'; ctx.font = mono(11)
  ctx.fillText(`epoch 3/10  loss ${(1.82 - pct * 0.9).toFixed(3)}  ${Math.round(pct * 100)}%`, 12, py - 8)

  // GPU utilisation sparkline
  ctx.strokeStyle = rgb; ctx.globalAlpha = 0.8; ctx.lineWidth = 1.6
  ctx.beginPath()
  for (let x = 0; x < w - 24; x += 4) {
    const v = 14 + Math.abs(Math.sin(x * 0.05 + t * 3)) * 14
    x === 0 ? ctx.moveTo(12, h - 14 - v) : ctx.lineTo(12 + x, h - 14 - v)
  }
  ctx.stroke(); ctx.globalAlpha = 1
}

// ---------------- office ----------------
function drawOffice(ctx, w, h, t, rgb) {
  ctx.fillStyle = '#f4f6fa'; ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0, 0, w, 26)
  ctx.fillStyle = '#64748b'; ctx.font = sans(12, 600)
  ctx.fillText('Q3 Budget.xlsx', 12, 18)

  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1
  for (let r = 0; r < 9; r++) {
    ctx.beginPath(); ctx.moveTo(0, 26 + r * 20); ctx.lineTo(w * 0.62, 26 + r * 20); ctx.stroke()
  }
  for (let c = 0; c <= 4; c++) {
    ctx.beginPath(); ctx.moveTo(c * (w * 0.62 / 4), 26); ctx.lineTo(c * (w * 0.62 / 4), h); ctx.stroke()
  }
  ctx.fillStyle = '#475569'; ctx.font = mono(10)
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 4; c++) {
      ctx.fillText(`${((r * 4 + c) * 137 % 900 + 100)}`, 8 + c * (w * 0.62 / 4), 40 + r * 20)
    }
  }

  // chart
  const cx0 = w * 0.66
  ctx.fillStyle = '#ffffff'; ctx.fillRect(cx0, 36, w - cx0 - 12, h - 52)
  for (let i = 0; i < 6; i++) {
    const bh = 22 + Math.abs(Math.sin(t * 0.6 + i)) * 52
    ctx.fillStyle = i % 2 ? rgb : '#5aa9ff'
    ctx.fillRect(cx0 + 12 + i * 20, h - 26 - bh, 13, bh)
  }
}

const DRAWERS = { gaming: drawGaming, creator: drawCreator, ai: drawAI, office: drawOffice }

export function drawScreen(ctx, w, h, t, rgb, sceneId) {
  const fn = DRAWERS[sceneId] || drawGaming
  ctx.save()
  fn(ctx, w, h, t, rgb)
  ctx.restore()
}
