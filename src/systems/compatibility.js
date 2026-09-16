// Pure compatibility rules. No DB, no React — every function takes plain objects
// so this is trivially testable and can run on either side of the wire.
//
// A build is a map of { [type]: component }.

const PSU_HEADROOM = 1.3   // never size a PSU to its exact load

// Power actually DRAWN by the build. Coolers are excluded on purpose: their
// rating lives in cooling_capacity_watts because it is heat dissipated, not
// power consumed, and summing it here would inflate every PSU requirement.
export function totalDraw(build) {
  return Object.values(build).reduce((sum, c) => {
    if (!c || c.type === 'cooler') return sum
    return sum + (Number(c.tdp_watts) || 0)
  }, 0)
}

export function requiredPsuWatts(build) {
  return Math.ceil(totalDraw(build) * PSU_HEADROOM)
}

// Each rule returns null when it passes, or a human-readable problem when it
// fails. Messages are customer-facing — they appear next to the 3D view.
const RULES = [
  function socketMatch({ cpu, motherboard }) {
    if (!cpu || !motherboard || !cpu.socket || !motherboard.socket) return null
    return cpu.socket === motherboard.socket
      ? null
      : `${cpu.brand} ${cpu.name} is ${cpu.socket}, but the ${motherboard.name} board is ${motherboard.socket}.`
  },

  function memoryType({ ram, motherboard }) {
    if (!ram || !motherboard || !ram.ram_type || !motherboard.ram_type) return null
    return ram.ram_type === motherboard.ram_type
      ? null
      : `${ram.name} is ${ram.ram_type}, but the ${motherboard.name} board takes ${motherboard.ram_type}.`
  },

  function boardFitsCase({ motherboard, case: cabinet }) {
    if (!motherboard || !cabinet) return null
    const supported = cabinet.supported_form_factors
    if (!Array.isArray(supported) || !supported.length || !motherboard.form_factor) return null
    return supported.includes(motherboard.form_factor)
      ? null
      : `A ${motherboard.form_factor} board does not fit the ${cabinet.name} (takes ${supported.join(', ')}).`
  },

  function gpuFitsCase({ gpu, case: cabinet }) {
    if (!gpu?.length_mm || !cabinet?.max_gpu_length_mm) return null
    return gpu.length_mm <= cabinet.max_gpu_length_mm
      ? null
      : `${gpu.name} is ${gpu.length_mm}mm long — the ${cabinet.name} takes up to ${cabinet.max_gpu_length_mm}mm.`
  },

  function coolerFitsCase({ cooler, case: cabinet }) {
    if (!cooler?.height_mm || !cabinet?.max_cooler_height_mm) return null
    return cooler.height_mm <= cabinet.max_cooler_height_mm
      ? null
      : `${cooler.name} is ${cooler.height_mm}mm tall — the ${cabinet.name} takes up to ${cabinet.max_cooler_height_mm}mm.`
  },

  function coolerHandlesCpu({ cooler, cpu }) {
    if (!cooler?.cooling_capacity_watts || !cpu?.tdp_watts) return null
    return cooler.cooling_capacity_watts >= cpu.tdp_watts
      ? null
      : `${cooler.name} is rated to ${cooler.cooling_capacity_watts}W but ${cpu.name} puts out ${cpu.tdp_watts}W.`
  },

  function psuSufficient(build) {
    const { psu } = build
    if (!psu?.psu_watts) return null
    const needed = requiredPsuWatts(build)
    return psu.psu_watts >= needed
      ? null
      : `This build draws ${totalDraw(build)}W and wants a ${needed}W supply — the ${psu.name} is ${psu.psu_watts}W.`
  },
]

export function validateBuild(build) {
  const issues = []
  for (const rule of RULES) {
    const problem = rule(build)
    if (problem) issues.push({ rule: rule.name, message: problem })
  }
  return { ok: issues.length === 0, issues }
}

// Can this candidate part join the build as-is? Used while assembling, where
// most slots are still empty — partial builds must not fail on absent parts.
export function canAdd(candidate, build) {
  const { ok } = validateBuild({ ...build, [candidate.type]: candidate })
  return ok
}

// Workload constraints that are not physical fit — currently just CUDA.
export function meetsWorkloadConstraints(candidate, workload) {
  if (candidate.type === 'gpu' && Array.isArray(workload?.gpuBrands)) {
    return workload.gpuBrands.includes(candidate.brand)
  }
  return true
}
