import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { drawScreen } from './screenContent'

// Procedural 3D build viewer.
//
// Nothing here is a modelled asset — the whole scene is primitives sized from
// the real millimetre figures in pc_components. That is the point: the picture
// is not a decoration, it is the compatibility check rendered. A 360mm card in
// a 360mm cabinet visibly fills it; an oversized cooler visibly punches through
// the side panel and turns red. What the customer sees is what they get.
//
// Units: 1 three.js unit = 100mm.
const MM = 0.01

// Board footprints in mm (width x height as mounted).
const BOARD_SIZE = {
  'E-ATX': [305, 330],
  ATX:     [305, 244],
  mATX:    [244, 244],
  ITX:     [170, 170],
}

function cabinetSize(cabinet) {
  // Derived from the clearances the cabinet actually advertises, so a full
  // tower reads as a full tower without anyone entering "case dimensions".
  const depth  = (cabinet?.max_gpu_length_mm || 400) + 70
  const height = (cabinet?.max_cooler_height_mm || 170) + 300
  const width  = cabinet?.supported_form_factors?.includes('E-ATX') ? 240 : 210
  return { width, height, depth }
}

export default function SystemViewer3D({ build = {}, rgbColor = '#56ffa8', seats = 1, screenScene = 'gaming', focus = 'overview' }) {
  const mountRef = useRef(null)
  const stateRef = useRef(null)
  const modeRef  = useRef(null)   // null | false (tower) | true (lab)
  // The animation loop reads these every frame, so they live in refs rather
  // than triggering a scene rebuild each time the colour or scene changes.
  const sceneRef = useRef(screenScene)
  const rgbRef   = useRef(rgbColor)
  useEffect(() => { sceneRef.current = screenScene }, [screenScene])
  useEffect(() => { rgbRef.current = rgbColor }, [rgbColor])

  // ---- one-time renderer / camera / controls ----
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 500)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)
    renderer.domElement.style.touchAction = 'none'
    renderer.domElement.style.cursor = 'grab'

    scene.add(new THREE.AmbientLight(0xffffff, 0.35))
    const key = new THREE.DirectionalLight(0xffffff, 1.1)
    key.position.set(6, 9, 7)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x88aaff, 0.5)
    rim.position.set(-7, 3, -5)
    scene.add(rim)

    const glow = new THREE.PointLight(new THREE.Color(rgbColor), 22, 22)
    glow.position.set(0, 1.5, 1)
    scene.add(glow)

    // Interior fill — without this the components read as black-on-black behind
    // the glass, which is exactly the "looks like an empty box" failure.
    const interior = new THREE.PointLight(0xdCEBFF, 12, 14)
    interior.position.set(-1.2, 0.6, 0.4)
    scene.add(interior)

    const buildGroup = new THREE.Group()
    scene.add(buildGroup)

    // Simple orbit: drag to rotate, wheel/pinch to zoom. Hand-rolled rather than
    // pulling in OrbitControls so there is no extra module in the bundle.
    // Start on the glass side, slightly front-of-centre: the whole point is to
    // look INTO the machine. Orbiting round to the solid panels is the user's
    // choice, not the default view.
    const orbit = { theta: -Math.PI * 0.28, phi: Math.PI * 0.44, radius: 11, target: new THREE.Vector3(0, 0, 0) }
    let dragging = false
    let last = { x: 0, y: 0 }

    const onDown = (e) => {
      dragging = true
      last = { x: e.clientX, y: e.clientY }
      renderer.domElement.style.cursor = 'grabbing'
      renderer.domElement.setPointerCapture?.(e.pointerId)
    }
    const onMove = (e) => {
      if (!dragging) return
      orbit.theta -= (e.clientX - last.x) * 0.008
      orbit.phi = Math.min(Math.PI - 0.25, Math.max(0.25, orbit.phi - (e.clientY - last.y) * 0.008))
      last = { x: e.clientX, y: e.clientY }
    }
    const onUp = (e) => {
      dragging = false
      renderer.domElement.style.cursor = 'grab'
      renderer.domElement.releasePointerCapture?.(e.pointerId)
    }
    const onWheel = (e) => {
      e.preventDefault()
      orbit.radius = Math.min(34, Math.max(5, orbit.radius + e.deltaY * 0.012))
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointermove', onMove)
    renderer.domElement.addEventListener('pointerup', onUp)
    renderer.domElement.addEventListener('pointercancel', onUp)
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false })

    const resize = () => {
      const w = mount.clientWidth || 1
      const h = mount.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    // Offscreen canvas that becomes the monitor's picture. Redrawn every frame
    // and uploaded as a texture — cheaper and far more flexible than a video.
    const screenCanvas = document.createElement('canvas')
    screenCanvas.width = 640
    screenCanvas.height = 360
    const screenCtx = screenCanvas.getContext('2d')
    const screenTexture = new THREE.CanvasTexture(screenCanvas)
    screenTexture.colorSpace = THREE.SRGBColorSpace

    let raf
    const spinners = []
    const t0 = performance.now()
    let lastT = performance.now()          // THREE.Clock is deprecated in r186
    const tick = () => {
      const now = performance.now()
      const dt = Math.min((now - lastT) / 1000, 0.1)
      lastT = now
      for (const s of spinners) s.rotation.z += dt * s.userData.speed

      if (screenCtx) {
        drawScreen(screenCtx, screenCanvas.width, screenCanvas.height,
          (now - t0) / 1000, rgbRef.current, sceneRef.current)
        screenTexture.needsUpdate = true
      }
      camera.position.set(
        orbit.target.x + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta),
        orbit.target.y + orbit.radius * Math.cos(orbit.phi),
        orbit.target.z + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta)
      )
      camera.lookAt(orbit.target)
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    tick()

    stateRef.current = { scene, camera, renderer, buildGroup, glow, spinners, orbit, screenTexture }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointermove', onMove)
      renderer.domElement.removeEventListener('pointerup', onUp)
      renderer.domElement.removeEventListener('pointercancel', onUp)
      renderer.domElement.removeEventListener('wheel', onWheel)
      scene.traverse((o) => {
        o.geometry?.dispose?.()
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose())
        else o.material?.dispose?.()
      })
      screenTexture.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      stateRef.current = null
    }
    // Renderer is created once; rgbColor changes are applied in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- rebuild scene contents whenever the build changes ----
  useEffect(() => {
    const st = stateRef.current
    if (!st) return
    const { buildGroup, spinners, glow, orbit, screenTexture } = st

    // clear previous
    spinners.length = 0
    while (buildGroup.children.length) {
      const child = buildGroup.children.pop()
      child.traverse?.((o) => {
        o.geometry?.dispose?.()
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose())
        else o.material?.dispose?.()
      })
    }

    const rgb = new THREE.Color(rgbColor)
    glow.color = rgb

    const isLab = seats > 1
    if (isLab) {
      buildLabScene(buildGroup, spinners, build, rgb, seats, screenTexture)
      st.screenAt = null
    } else {
      st.screenAt = buildWorkstationScene(buildGroup, spinners, build, rgb, screenTexture)
    }

    // Only reframe when switching between a tower and a lab. Resetting the
    // camera every time a part changes would throw away the angle the user
    // deliberately dragged to.
    if (modeRef.current !== isLab) {
      modeRef.current = isLab
      orbit.radius = isLab ? Math.min(34, 12 + Math.sqrt(seats) * 2.4) : 21
      orbit.target.set(0, isLab ? 0 : 5.5, 0)
    } else if (isLab) {
      orbit.radius = Math.min(34, 12 + Math.sqrt(seats) * 2.4)
    }
  }, [build, rgbColor, seats])

  // ---- camera framing ----
  useEffect(() => {
    const st = stateRef.current
    if (!st) return
    const { orbit, screenAt } = st
    if (focus === 'monitor' && screenAt) {
      // Sit square in front of the panel — this is the "what does it actually
      // do" view, so the screen should fill the frame, not the chassis.
      orbit.target.set(screenAt.x, screenAt.y, screenAt.z)
      orbit.theta = 0
      orbit.phi = Math.PI / 2
      orbit.radius = screenAt.panelW * 1.55
    } else if (seats <= 1) {
      orbit.target.set(0, 5.5, 0)
      orbit.theta = -Math.PI * 0.28
      orbit.phi = Math.PI * 0.44
      orbit.radius = 21
    }
  }, [focus, seats, build])

  return <div ref={mountRef} className="w-full h-full" />
}

// ---------- materials ----------
const steel = (c = 0x1c2430) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.75, roughness: 0.42 })
const glass = () => new THREE.MeshStandardMaterial({
  color: 0x9fdcff, metalness: 0.1, roughness: 0.06,
  transparent: true, opacity: 0.07, side: THREE.DoubleSide,
})
const emissive = (c, strength = 1.5) => new THREE.MeshStandardMaterial({
  color: c, emissive: c, emissiveIntensity: strength, roughness: 0.35,
})
const ALERT = 0xff4d4d

function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
}

// Object3D.position is a read-only accessor — it must be mutated via .set(),
// never replaced by assignment.
function at(mesh, x, y, z) {
  mesh.position.set(x, y, z)
  return mesh
}

// A monitor's panel size comes from its spec sheet, so a 27" reads bigger than
// a 24" on screen — same principle as the cabinet clearances.
function monitorInches(monitor) {
  const spec = (Array.isArray(monitor?.specs) ? monitor.specs : []).find((s) => /size/i.test(s.label || ''))
  const m = String(spec?.value || '').match(/(\d{2})/)
  return m ? parseInt(m[1], 10) : 24
}

// ---------- the full workstation ----------
// The tower on its own is not what the customer is buying — they want to see
// the desk they'll sit at. Monitor, keyboard and mouse are part of the picture.
function buildWorkstationScene(group, spinners, build, rgb, screenTexture) {
  const DESK_H = 7.5, DESK_W = 15, DESK_D = 7, TOP = 0.28

  // desk
  const deskMat = steel(0x2a2118)
  group.add(at(box(DESK_W, TOP, DESK_D, deskMat), 0, DESK_H, 0))
  for (const sx of [-1, 1]) {
    group.add(at(box(0.3, DESK_H, DESK_D * 0.86, steel(0x1a1f27)), sx * (DESK_W / 2 - 0.4), DESK_H / 2, 0))
  }

  // floor + neon footprint
  group.add(at(box(DESK_W + 8, 0.06, DESK_D + 8, steel(0x0b0f14)), 0, 0, 0))
  const halo = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(DESK_W + 8, 0.06, DESK_D + 8)),
    new THREE.LineBasicMaterial({ color: rgb, transparent: true, opacity: 0.35 })
  )
  halo.position.y = 0.02
  group.add(halo)

  // tower, standing on the floor to the right of the desk
  const tower = new THREE.Group()
  buildTowerScene(tower, spinners, build, rgb)
  const { height } = cabinetSize(build.case)
  tower.position.set(DESK_W / 2 + 1.6, (height * MM) / 2, 0)
  group.add(tower)

  // monitor, sized from the panel you actually chose
  const inches = monitorInches(build.monitor)
  const panelW = inches * 0.871 * 25.4 * MM
  const panelH = inches * 0.490 * 25.4 * MM
  const deskTop = DESK_H + TOP / 2
  const screenY = deskTop + 0.9 + panelH / 2

  group.add(at(box(panelW + 0.16, panelH + 0.16, 0.1, steel(0x0d1118)), -1.4, screenY, -1.6))
  const screenMat = screenTexture
    ? new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false })
    : emissive(rgb, 0.55)
  const screen = at(new THREE.Mesh(new THREE.PlaneGeometry(panelW, panelH), screenMat), -1.4, screenY, -1.51)
  group.add(screen)
  group.add(at(box(0.35, 0.9, 0.35, steel(0x1a1f27)), -1.4, deskTop + 0.45, -1.6))
  group.add(at(box(1.9, 0.09, 1.1, steel(0x1a1f27)), -1.4, deskTop + 0.05, -1.6))

  // keyboard and mouse
  const kb = at(box(4.2, 0.16, 1.4, steel(0x141922)), -1.4, deskTop + 0.1, 0.9)
  group.add(kb)
  group.add(at(box(4.0, 0.03, 1.2, emissive(rgb, 0.7)), -1.4, deskTop + 0.19, 0.9))
  group.add(at(box(0.7, 0.22, 1.1, steel(0x141922)), 1.9, deskTop + 0.12, 0.9))

  return { x: -1.4, y: screenY, z: -1.51, panelW }
}

// ---------- the tower ----------
function buildTowerScene(group, spinners, build, rgb) {
  const { case: cabinet, motherboard, gpu, cooler, ram, psu, storage } = build
  const size = cabinetSize(cabinet)
  const W = size.width * MM, H = size.height * MM, D = size.depth * MM

  // chassis: solid back/floor/roof, glass left panel
  const shellMat = steel(0x161c26)
  const frame = new THREE.Group()
  frame.add(at(box(W, 0.06, D, shellMat), 0, -H / 2, 0))       // floor
  frame.add(at(box(W, 0.06, D, shellMat), 0, H / 2, 0))        // roof
  frame.add(at(box(0.06, H, D, shellMat), W / 2, 0, 0))        // right panel
  frame.add(at(box(W, H, 0.06, shellMat), 0, 0, -D / 2))       // back panel
  frame.add(at(box(0.03, H * 0.94, D * 0.94, glass()), -W / 2, 0, 0))  // glass side
  // neon edge outline, the brand cue
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, D)),
    new THREE.LineBasicMaterial({ color: rgb, transparent: true, opacity: 0.55 })
  )
  frame.add(edges)
  group.add(frame)

  // motherboard against the back wall
  const [bw, bh] = BOARD_SIZE[motherboard?.form_factor] || BOARD_SIZE.ATX
  const boardZ = -D / 2 + 0.12
  const boardY = H / 2 - (bh * MM) / 2 - 0.45
  // Mounted against the right-hand panel like a real tower, so everything
  // bolted to it faces the viewer through the glass.
  const boardX = W / 2 - 0.12
  const board = box(0.035, bh * MM, bw * MM, steel(0x0f3d2a))
  board.position.set(boardX, boardY, boardZ + (bw * MM) / 2 - 0.1)
  group.add(board)

  // CPU cooler — real height, and it turns red if it cannot fit
  if (cooler) {
    const ch = (cooler.height_mm || 150) * MM
    const tooTall = cabinet?.max_cooler_height_mm && cooler.height_mm > cabinet.max_cooler_height_mm
    const body = box(0.9, ch, 0.9, steel(tooTall ? ALERT : 0x39424f))
    body.position.set(boardX - 0.55, boardY + (bh * MM) / 2 - ch / 2 - 0.25, boardZ + 0.55)
    group.add(body)
    const fan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.06, 20),
      emissive(tooTall ? new THREE.Color(ALERT) : rgb, 1.1)
    )
    fan.rotation.z = Math.PI / 2
    fan.position.set(boardX - 1.08, body.position.y, body.position.z)
    fan.userData.speed = 2.2
    spinners.push(fan)
    group.add(fan)
  }

  // RAM sticks — one per module in the kit
  const modules = Math.min(Number(ram?.module_count) || 2, 4)
  for (let i = 0; i < modules; i++) {
    const stick = box(0.12, 1.15, 0.05, emissive(rgb, 0.55))
    stick.position.set(boardX - 0.12, boardY + (bh * MM) / 2 - 0.62, boardZ + 1.15 + i * 0.16)
    group.add(stick)
  }

  // GPU — length straight from the catalogue, red and overhanging if it fouls
  if (gpu) {
    const len = (gpu.length_mm || 300) * MM
    const overLength = cabinet?.max_gpu_length_mm && gpu.length_mm > cabinet.max_gpu_length_mm
    const card = box(1.1, 0.30, len, steel(overLength ? ALERT : 0x2a3342))
    card.position.set(boardX - 0.6, boardY - 0.35, boardZ + len / 2 + 0.06)
    group.add(card)
    const strip = box(1.12, 0.05, len * 0.82, emissive(overLength ? new THREE.Color(ALERT) : rgb, 1.8))
    strip.position.set(boardX - 0.6, boardY - 0.14, card.position.z)
    group.add(strip)
    for (let i = 0; i < 2; i++) {
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 18), emissive(rgb, 0.8))
      f.position.set(boardX - 0.6, boardY - 0.15, boardZ + len * (0.3 + i * 0.42))
      f.userData.speed = 3.4 - i * 0.5
      spinners.push(f)
      group.add(f)
    }
  }

  // PSU in the basement
  if (psu) {
    const p = box(W * 0.8, 0.86, 1.5, steel(0x11161e))
    p.position.set(0, -H / 2 + 0.5, -D / 2 + 0.95)
    group.add(p)
  }

  // storage sliver
  if (storage) {
    const s = box(0.5, 0.05, 0.9, emissive(rgb, 0.35))
    s.position.set(boardX - 0.1, boardY - 1.25, boardZ + 0.6)
    group.add(s)
  }

  // intake fans on the front face
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.05, 8, 22), emissive(rgb, 1.3))
    f.position.set(0, H / 2 - 1.0 - i * 0.95, D / 2 - 0.1)
    f.userData.speed = 1.6 + i * 0.35
    spinners.push(f)
    group.add(f)
  }

  // No position set here — the tower is placed by whoever builds the scene
  // around it (buildWorkstationScene stands it on the floor).
}

// ---------- the lab ----------
function buildLabScene(group, spinners, build, rgb, seats, screenTexture) {
  const cols = Math.ceil(Math.sqrt(seats))
  const rows = Math.ceil(seats / cols)
  const gap = 3.0

  const deskMat = steel(0x232a35)
  const towerMat = steel(0x161c26)

  for (let i = 0; i < seats; i++) {
    const r = Math.floor(i / cols)
    const c = i % cols
    const x = (c - (cols - 1) / 2) * gap
    const z = (r - (rows - 1) / 2) * gap

    const desk = box(2.2, 0.1, 1.3, deskMat)
    desk.position.set(x, 0, z)
    group.add(desk)

    // monitor
    const panelMat = screenTexture
      ? new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false })
      : emissive(rgb, 0.4)
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.9), panelMat)
    panel.position.set(x, 0.62, z - 0.42)
    group.add(panel)
    const stand = box(0.12, 0.35, 0.12, deskMat)
    stand.position.set(x, 0.25, z - 0.45)
    group.add(stand)

    // mini tower with a glowing strip
    const tower = box(0.5, 1.05, 1.0, towerMat)
    tower.position.set(x + 0.78, 0.6, z + 0.15)
    group.add(tower)
    const strip = box(0.03, 0.75, 0.06, emissive(rgb, 1.7))
    strip.position.set(x + 0.53, 0.6, z + 0.6)
    group.add(strip)

    const f = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 18), emissive(rgb, 1.1))
    f.position.set(x + 0.78, 0.6, z + 0.66)
    f.userData.speed = 1.4 + (i % 3) * 0.3
    spinners.push(f)
    group.add(f)
  }

  // floor
  const floor = box(cols * gap + 3, 0.04, rows * gap + 3, steel(0x0c1016))
  floor.position.y = -0.55
  group.add(floor)

  const grid = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(cols * gap + 3, 0.04, rows * gap + 3)),
    new THREE.LineBasicMaterial({ color: rgb, transparent: true, opacity: 0.4 })
  )
  grid.position.y = -0.55
  group.add(grid)
}
