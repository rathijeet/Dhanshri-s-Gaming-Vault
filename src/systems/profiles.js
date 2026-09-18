// Workload profiles. Each one says which score column ranks parts, what the
// build must contain, and any hard constraint the engine cannot violate.
//
// Deliberately NOT here: budget split percentages. Indian component prices moved
// too violently through 2026 for a fixed "GPU gets 38%" table to survive contact
// with reality — a 32GB DDR5 kit is now ~30% of a mid build on its own. The
// engine derives spend from live catalogue prices instead. See engine.js.

export const CORE_TYPES   = ['cpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler']
export const OPTIONAL_TYPES = ['os', 'monitor', 'peripheral', 'network']

// `forms` scopes a workload to the tracks whose catalogue can actually answer
// it. dev and cad are laptop-only for now because no desktop PART carries a
// dev_score or cad_score — offering them on the desktop builder would rank
// every component at zero and assemble nonsense. Score the parts catalogue and
// they become desktop workloads by adding one string here.
export const WORKLOADS = [
  {
    id: 'ai',
    forms: ['desktop', 'laptop'],
    label: 'AI / Machine Learning',
    icon: 'neurology',
    blurb: 'Run and fine-tune local LLMs, computer vision, model training.',
    scoreKey: 'ai_score',
    requires: [...CORE_TYPES, 'gpu'],
    // CUDA is non-negotiable for the mainstream local-LLM toolchain, so the
    // engine refuses AMD cards here no matter how well they score elsewhere.
    gpuBrands: ['NVIDIA'],
    anchor: 'gpu',
    examples: ['Run Llama 70B locally', 'Train vision models', 'College AI/ML lab'],
  },
  {
    id: 'creator',
    forms: ['desktop', 'laptop'],
    label: 'Video & Creative',
    icon: 'movie_edit',
    blurb: '4K editing, colour work, 3D rendering, motion graphics.',
    scoreKey: 'creator_score',
    requires: [...CORE_TYPES, 'gpu'],
    anchor: 'cpu',
    examples: ['4K video editing', 'Blender rendering', 'Photo retouching'],
  },
  {
    id: 'gaming',
    forms: ['desktop', 'laptop'],
    label: 'Gaming',
    icon: 'sports_esports',
    blurb: 'High frame rates at the resolution you actually play at.',
    scoreKey: 'gaming_score',
    requires: [...CORE_TYPES, 'gpu'],
    anchor: 'gpu',
    examples: ['1440p high refresh', 'Streaming while playing', 'Esports titles'],
  },
  {
    id: 'office',
    forms: ['desktop', 'laptop'],
    label: 'Office & Study',
    icon: 'business_center',
    blurb: 'Reliable everyday machines for work, study or a computer lab.',
    scoreKey: 'office_score',
    requires: CORE_TYPES,          // integrated graphics is enough
    anchor: 'cpu',
    examples: ['School computer lab', 'Office workstations', 'Student PC'],
  },
  {
    id: 'dev',
    forms: ['laptop'],
    label: 'Software Development',
    icon: 'code',
    blurb: 'IDEs, containers, virtual machines, big repositories.',
    scoreKey: 'dev_score',
    requires: CORE_TYPES,
    anchor: 'cpu',
    examples: ['Docker and Kubernetes locally', 'Android Studio', 'Full-stack web work'],
  },
  {
    id: 'cad',
    forms: ['laptop'],
    label: 'CAD & Engineering',
    icon: 'architecture',
    blurb: 'SolidWorks, AutoCAD, Revit, Fusion 360, large assemblies.',
    scoreKey: 'cad_score',
    requires: [...CORE_TYPES, 'gpu'],
    anchor: 'gpu',
    examples: ['SolidWorks assemblies', 'Revit models', 'AutoCAD and Fusion 360'],
  },
]

// The workloads a given track can honestly answer.
export function workloadsFor(form) {
  return WORKLOADS.filter((w) => !w.forms || w.forms.includes(form))
}

export const WORKLOAD_BY_ID = Object.fromEntries(WORKLOADS.map((w) => [w.id, w]))

// VRAM tiers, stated as what the customer can actually run. This is the sales
// language for AI builds — far more persuasive than an abstract score.
export const VRAM_TIERS = [
  { minVram: 8,  label: '7B models',        detail: 'Good for learning, demos and teaching. Runs 7B models at Q4.' },
  { minVram: 12, label: '13B models',       detail: 'Comfortable with 13–14B models at Q4.' },
  { minVram: 16, label: '14B models',       detail: 'Runs 14B comfortably, light fine-tuning.' },
  { minVram: 24, label: '30B models',       detail: 'The sweet spot — 30B at Q4, real fine-tuning work.' },
  { minVram: 32, label: '30B+ and training', detail: 'Serious local work: 30B+ models and sustained training runs.' },
  { minVram: 48, label: '70B models',       detail: 'Runs 70B models at Q4.' },
  { minVram: 96, label: '70B unquantised',  detail: 'Research-grade: 70B without quantisation.' },
]

// A plain-language verdict on what the finished machine is and is not for.
// A small budget should get a real system and an honest description of its
// limits, not a refusal — and never a claim it cannot live up to.
export function systemNote(build, workload) {
  const vram = build?.gpu?.vram_gb || 0
  const ramGb = build?.ram?.capacity_gb || 0

  if (!build?.gpu) {
    return {
      tier: 'essentials',
      headline: 'A minimal work system',
      text: ramGb && ramGb <= 8
        ? 'Documents, browsing, email and study, one thing at a time. No dedicated graphics, so it will not run modern games or local AI models — and 8GB of memory means keeping the tab count sensible.'
        : 'Documents, browsing, email, video calls and study. It has no dedicated graphics card, so it will not run modern games or local AI models.',
    }
  }

  if (workload?.id === 'ai' && vram > 0 && vram < 8) {
    return {
      tier: 'entry',
      headline: 'Below the useful floor for AI',
      text: `${vram}GB of video memory is not enough to run today's local models properly. It will handle everyday work and light gaming well, but for AI you want at least 8GB, and 24GB to be comfortable.`,
    }
  }

  if (vram && vram < 8) {
    return {
      tier: 'entry',
      headline: 'An entry-level system',
      text: 'Fine for esports titles at 1080p and everyday work. Modern AAA games will need reduced settings.',
    }
  }

  return null   // capable builds speak for themselves through capabilityFor
}

export function capabilityFor(vramGb) {
  if (!vramGb) return null
  let match = null
  for (const t of VRAM_TIERS) if (vramGb >= t.minVram) match = t
  return match
}
