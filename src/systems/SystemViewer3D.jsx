import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { SCREEN_SCENES, drawScreen } from './screenContent'

// Procedural 3D build viewer.
//
// Nothing here is a modelled asset — the room and everything standing in it are
// primitives sized from the real millimetre figures in pc_components. That is
// the point: the picture is not a decoration, it is the compatibility check
// rendered. A 360mm card in a 360mm cabinet visibly fills it; an oversized
// cooler visibly punches through the side panel and turns red. What the
// customer sees is what they get.
//
// Units: 1 three.js unit = 100mm.
const MM = 0.01

// Containers tried for each monitor clip, in order.
const VIDEO_EXTS = ['.mp4', '.webm']

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

// ---------- the room ----------
// A desk floating in the void reads as a render. A room with a floor, walls,
// a rug and a chair reads as somebody's setup — which is what the customer is
// actually trying to picture.
const ROOM = { w: 46, h: 28, d: 38 }
const DESK  = { w: 18, d: 8, h: 7.5, top: 0.3, x: -1, z: -ROOM.d / 2 + 5.2 }
// The cabinet stands ON the desk next to the panel rather than on the floor.
// Standing it on the floor meant either a wide shot with an unreadable screen
// or a readable screen with no cabinet in it — on the desk, one frame holds
// both, which is how a shop puts a machine in front of you anyway.
const MON_X = DESK.x - 2.2
const TOWER_X = DESK.x + 4.6

export default function SystemViewer3D({ build = {}, rgbColor = '#56ffa8', seats = 1, screenScene = 'gaming', focus = 'overview' }) {
  const mountRef = useRef(null)
  const stateRef = useRef(null)
  const modeRef  = useRef(null)   // null | false (room) | true (lab)
  // The animation loop reads these every frame, so they live in refs rather
  // than triggering a scene rebuild each time the colour or scene changes.
  const sceneRef = useRef(screenScene)
  const rgbRef   = useRef(rgbColor)
  useEffect(() => {
    sceneRef.current = screenScene
    const st = stateRef.current
    if (!st) return
    st.activeScene = screenScene
    refreshScreens(st)
  }, [screenScene])
  useEffect(() => { rgbRef.current = rgbColor }, [rgbColor])

  // ---- one-time renderer / camera / controls ----
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x05080a)
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 500)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    // Bloom costs a full-screen pass, so the pixel ratio comes down to pay for
    // it. On a phone the glow is worth far more than the extra samples.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    // Filmic tone mapping plus a real environment is the difference between
    // "shaded boxes" and "a photo of a desk". Without an environment map every
    // metallic surface has nothing to reflect and renders near-black, which is
    // exactly how the cabinet used to disappear into the background.
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    mount.appendChild(renderer.domElement)
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.touchAction = 'none'
    renderer.domElement.style.cursor = 'grab'

    const pmrem = new THREE.PMREMGenerator(renderer)
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
    // The environment is what gives metal and glass something to reflect —
    // without it they render near-black. Kept low, because this is a room lit
    // by its own RGB after dark, not a showroom at noon.
    scene.environment = envRT.texture
    scene.environmentIntensity = 0.5
    pmrem.dispose()

    scene.add(new THREE.AmbientLight(0x3a4a60, 0.22))

    // Streetlight through the window on the left wall — the one shadow caster,
    // so the furniture sits on the floor instead of hovering over it.
    const key = new THREE.DirectionalLight(0x9db9ff, 0.62)
    key.position.set(-26, 26, 16)
    key.target.position.set(0, 6, -12)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.near = 4
    key.shadow.camera.far = 90
    key.shadow.camera.left = -28
    key.shadow.camera.right = 28
    key.shadow.camera.top = 28
    key.shadow.camera.bottom = -6
    key.shadow.bias = -0.0012
    key.shadow.normalBias = 0.035
    scene.add(key)
    scene.add(key.target)

    const rim = new THREE.DirectionalLight(0x8fb4ff, 0.18)
    rim.position.set(14, 8, -18)
    scene.add(rim)

    // Everything else — the RGB wash, the monitor spill, the lamp — belongs to
    // whichever scene is built, because it has to stand where the furniture
    // does. Point light intensity is in candela and falls off with the square
    // of the distance, so those numbers look large next to these and are not.
    const buildGroup = new THREE.Group()
    scene.add(buildGroup)

    // Simple orbit: drag to rotate, wheel/pinch to zoom. Hand-rolled rather than
    // pulling in OrbitControls so there is no extra module in the bundle.
    const orbit = {
      theta: 0.12, phi: Math.PI * 0.47, radius: 24,
      target: new THREE.Vector3(0, 8, -12),
      maxRadius: 34,
    }
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
      // Stop short of the floor and the ceiling — orbiting under the rug is
      // never what anyone wanted.
      orbit.phi = Math.min(1.62, Math.max(0.45, orbit.phi - (e.clientY - last.y) * 0.008))
      last = { x: e.clientX, y: e.clientY }
    }
    const onUp = (e) => {
      dragging = false
      renderer.domElement.style.cursor = 'grab'
      renderer.domElement.releasePointerCapture?.(e.pointerId)
    }
    const onWheel = (e) => {
      e.preventDefault()
      st.userZoomed = true
      orbit.radius = Math.min(orbit.maxRadius, Math.max(4, orbit.radius + e.deltaY * 0.014))
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointermove', onMove)
    renderer.domElement.addEventListener('pointerup', onUp)
    renderer.domElement.addEventListener('pointercancel', onUp)
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false })

    // Bloom is the whole reason an RGB build reads as an RGB build: without it
    // a lit strip is just a pale rectangle, and with it the colour spills into
    // the room the way it does in the shop.
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    // Threshold above 1 so only the emitters bloom. A bright office screen is a
    // bright screen, not a floodlight.
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.36, 0.28, 1.02)
    composer.addPass(bloom)
    composer.addPass(new OutputPass())

    const resize = () => {
      const w = mount.clientWidth || 1
      const h = mount.clientHeight || 1
      renderer.setSize(w, h)
      composer.setSize(w, h)
      bloom.resolution.set(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      // A framing chosen for a wide desktop canvas crops badly on a phone, so
      // the distance is recomputed from the aspect rather than hard-coded.
      if (!st.userZoomed) applyFit(st)
    }

    // Offscreen canvases redrawn every frame and uploaded as textures — cheaper
    // and far more flexible than video. "active" is the one monitor the
    // customer is sitting at and follows whatever scene they swipe to; the
    // per-workload ones let a lab show one machine gaming, the next editing and
    // the next training a model, all at once.
    const makeScreen = (w, h) => {
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      return { canvas, ctx: canvas.getContext('2d'), texture }
    }
    const screens = { active: makeScreen(768, 432) }
    for (const s of SCREEN_SCENES) screens[s.id] = makeScreen(384, 216)

    // Real footage wins wherever the shop has supplied it. A clip that is
    // missing, blocked or undecodable simply never registers, and the drawn
    // scene it would have replaced keeps playing — the viewer must not depend
    // on a file that may not be there.
    const videos = {}
    const videoEls = []
    for (const s of SCREEN_SCENES) {
      if (!s.video) continue
      const el = document.createElement('video')
      el.loop = true
      el.muted = true            // required, or autoplay is refused
      el.defaultMuted = true
      el.playsInline = true
      el.preload = 'auto'
      // Try each container in turn. A path that does not exist is served the
      // SPA's index.html, which fails to decode and lands here exactly as a
      // missing file would — so both cases fall through to the next extension
      // and finally to the drawn scene.
      let ext = 0
      let settled = false
      const tryNext = () => {
        if (settled || ext >= VIDEO_EXTS.length) return
        el.src = s.video + VIDEO_EXTS[ext++]
        el.load()
      }
      el.addEventListener('error', tryNext)
      el.addEventListener('canplay', () => {
        if (settled) return
        settled = true
        const tex = new THREE.VideoTexture(el)
        tex.colorSpace = THREE.SRGBColorSpace
        videos[s.id] = tex
        el.play().catch(() => {})
        refreshScreens(stateRef.current)
      })
      tryNext()
      videoEls.push(el)
    }

    const st = {
      scene, camera, renderer, composer, buildGroup, orbit, screens, key,
      videos, screenMeshes: [], activeScene: sceneRef.current,
      spinners: [], live: new Set(['active']), fit: null, userZoomed: false,
    }
    stateRef.current = st

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    let raf
    const t0 = performance.now()
    let lastT = performance.now()          // THREE.Clock is deprecated in r186
    const tick = () => {
      const now = performance.now()
      const dt = Math.min((now - lastT) / 1000, 0.1)
      lastT = now
      for (const s of st.spinners) s.rotation.z += dt * s.userData.speed

      for (const id of st.live) {
        const sc = screens[id]
        if (!sc?.ctx) continue
        const shown = id === 'active' ? sceneRef.current : id
        if (videos[shown]) continue          // real footage is playing instead
        drawScreen(sc.ctx, sc.canvas.width, sc.canvas.height, (now - t0) / 1000, rgbRef.current, shown)
        sc.texture.needsUpdate = true
      }

      camera.position.set(
        orbit.target.x + orbit.radius * Math.sin(orbit.phi) * Math.sin(orbit.theta),
        orbit.target.y + orbit.radius * Math.cos(orbit.phi),
        orbit.target.z + orbit.radius * Math.sin(orbit.phi) * Math.cos(orbit.theta)
      )
      camera.lookAt(orbit.target)
      composer.render()
      raf = requestAnimationFrame(tick)
    }
    tick()

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
      for (const s of Object.values(screens)) s.texture.dispose()
      for (const t of Object.values(videos)) t.dispose()
      for (const el of videoEls) { el.pause(); el.removeAttribute('src'); el.load() }
      envRT.dispose()
      composer.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      stateRef.current = null
    }
    // Renderer is created once; colour and scene changes are applied below.
  }, [])

  // ---- rebuild scene contents whenever the build changes ----
  useEffect(() => {
    const st = stateRef.current
    if (!st) return
    const { buildGroup, orbit } = st

    st.spinners.length = 0
    st.screenMeshes.length = 0
    while (buildGroup.children.length) {
      const child = buildGroup.children.pop()
      child.traverse?.((o) => {
        o.geometry?.dispose?.()
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose())
        else o.material?.dispose?.()
      })
    }

    const rgb = new THREE.Color(rgbColor)
    const isLab = seats > 1
    const layout = isLab
      ? buildLabScene(buildGroup, st, rgb, build, seats)
      : buildRoomScene(buildGroup, st, rgb, build)

    st.layout = layout
    st.live = new Set(layout.scenes)
    refreshScreens(st)

    // Shadows are decided per mesh rather than per material: glass and anything
    // emissive casting a shadow is the classic giveaway that a scene is fake.
    buildGroup.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = !o.userData.noShadow
      o.receiveShadow = !o.userData.noShadow
    })

    if (modeRef.current !== isLab) {
      modeRef.current = isLab
      st.userZoomed = false
      orbit.theta = layout.theta
      orbit.phi = layout.phi
    }
    const sh = layout.shadow
    if (sh) {
      const { key } = st
      key.position.set(...sh.pos)
      key.target.position.set(...sh.target)
      key.shadow.camera.left = -sh.extent
      key.shadow.camera.right = sh.extent
      key.shadow.camera.top = sh.extent
      key.shadow.camera.bottom = -sh.extent * 0.35
      key.shadow.camera.far = sh.extent * 6 + 40
      key.shadow.camera.updateProjectionMatrix()
    }

    st.fit = layout.fitWide
    st.orbit.maxRadius = layout.maxRadius
    if (!st.userZoomed) applyFit(st)
  }, [build, rgbColor, seats])

  // ---- camera framing ----
  useEffect(() => {
    const st = stateRef.current
    if (!st?.layout) return
    const { orbit, layout } = st
    // "monitor" is the test drive: the customer asked what this machine does,
    // so the desk fills the frame with the cabinet still in shot beside it.
    // A cabinet and a 24" panel are close to the same size in real life, so a
    // frame that holds both whole can only make the screen so big. Rather than
    // compromise either, the customer gets to pick which shot they are in.
    const fit = (focus === 'screen' && layout.fitScreen)
      || (focus === 'station' && layout.fitDesk)
      || (focus === 'monitor' && (layout.opensWide ? layout.fitWide : layout.fitDesk))
      || layout.fitWide
    orbit.target.copy(fit.target)
    orbit.theta = fit.theta ?? layout.theta
    orbit.phi = fit.phi ?? layout.phi
    st.fit = fit
    st.userZoomed = false
    applyFit(st)
  }, [focus, seats, build])

  return <div ref={mountRef} className="w-full h-full" />
}

// Which picture belongs on a given panel right now: the shop's footage if it
// has loaded, otherwise the scene drawn into a canvas.
function screenTextureFor(st, id) {
  const sceneId = id === 'active' ? st.activeScene : id
  return st.videos[sceneId] || st.screens[id]?.texture || null
}

function refreshScreens(st) {
  if (!st) return
  for (const { mesh, id } of st.screenMeshes) {
    const tex = screenTextureFor(st, id)
    if (mesh.material.map === tex) continue
    mesh.material.map = tex
    mesh.material.needsUpdate = true
  }
}

// A lit panel: unlit material so the picture is the picture, not something the
// room's lights have had an opinion about.
function screenPanel(st, id, w, h) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: screenTextureFor(st, id), toneMapped: false })
  )
  st.screenMeshes.push({ mesh, id })
  return noShadow(mesh)
}

// Pull the camera back to the closest distance that still holds every point of
// the subject on screen, at whatever aspect ratio the canvas happens to be.
//
// The earlier version measured a flat box at the target's depth, which is only
// right when everything is at that depth. It is not: the cabinet stands well in
// front of the panel, so it overflowed a frame that was sized for the panel's
// plane. Testing the actual corners against the actual frustum has no such
// blind spot, and it costs a thirty-step bisection once per reframe.
function applyFit(st) {
  const fit = st?.fit
  if (!fit?.points?.length) return

  const cam = st.camera
  const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2)
  const tanH = tanV * (cam.aspect || 1)

  // target -> camera, from the same spherical convention the orbit uses
  const dir = new THREE.Vector3(
    Math.sin(fit.phi) * Math.sin(fit.theta),
    Math.cos(fit.phi),
    Math.sin(fit.phi) * Math.cos(fit.theta)
  )
  const fwd = dir.clone().negate()
  const right = new THREE.Vector3().crossVectors(fwd, UP).normalize()
  const up = new THREE.Vector3().crossVectors(right, fwd).normalize()

  const eye = new THREE.Vector3()
  const v = new THREE.Vector3()
  const holds = (r) => {
    eye.copy(fit.target).addScaledVector(dir, r)
    for (const p of fit.points) {
      v.copy(p).sub(eye)
      const depth = v.dot(fwd)
      if (depth <= 0.2) return false
      if (Math.abs(v.dot(right)) > tanH * depth) return false
      if (Math.abs(v.dot(up)) > tanV * depth) return false
    }
    return true
  }

  let hi = st.orbit.maxRadius
  if (!holds(hi)) { st.orbit.radius = hi; return }
  let lo = 1
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2
    if (holds(mid)) hi = mid
    else lo = mid
  }
  st.orbit.radius = Math.min(st.orbit.maxRadius, Math.max(3, hi * (fit.pad ?? 1.03)))
}

const UP = new THREE.Vector3(0, 1, 0)

// The corners of a box, as the points a framing has to hold.
function corners(cx, cy, cz, hx, hy, hz, out = []) {
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    out.push(new THREE.Vector3(cx + sx * hx, cy + sy * hy, cz + sz * hz))
  }
  return out
}

function centreOf(points) {
  const b = new THREE.Box3()
  for (const p of points) b.expandByPoint(p)
  return b.getCenter(new THREE.Vector3())
}

// ---------- materials ----------
const matte   = (c, r = 0.62) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.04, roughness: r })
const metal   = (c, r = 0.34) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.92, roughness: r, envMapIntensity: 1.2 })
const plastic = (c, r = 0.48) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.0, roughness: r })
const fabric  = (c) => new THREE.MeshStandardMaterial({ color: c, metalness: 0, roughness: 0.96 })
const glassMat = () => new THREE.MeshStandardMaterial({
  color: 0xa9d4ff, metalness: 0.3, roughness: 0.05,
  transparent: true, opacity: 0.06, side: THREE.DoubleSide, envMapIntensity: 0.8,
})
const emissive = (c, strength = 1.5) => new THREE.MeshStandardMaterial({
  color: 0x0a0a0a, emissive: c, emissiveIntensity: strength, roughness: 0.35,
})
const ALERT = 0xff4d4d

function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
}

// Every real object has a fillet on its edges; a hard 90° edge is the single
// loudest "this is a cube" signal in a render.
function rbox(w, h, d, material, radius = 0.06) {
  const r = Math.min(radius, Math.min(w, h, d) / 2.05)
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), material)
}

function cyl(rTop, rBot, h, material, seg = 20) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), material)
}

// Object3D.position is a read-only accessor — it must be mutated via .set(),
// never replaced by assignment.
function at(mesh, x, y, z) {
  mesh.position.set(x, y, z)
  return mesh
}

// A point light that belongs to the scene graph, so it is torn down with the
// rest of the build instead of lingering where the furniture used to be.
function lamp(group, color, intensity, distance, x, y, z) {
  const l = new THREE.PointLight(color, intensity, distance, 2)
  l.position.set(x, y, z)
  group.add(l)
  return l
}

function noShadow(mesh) {
  mesh.userData.noShadow = true
  return mesh
}

// A monitor's panel size comes from its spec sheet, so a 27" reads bigger than
// a 24" on screen — same principle as the cabinet clearances.
function monitorInches(monitor) {
  const spec = (Array.isArray(monitor?.specs) ? monitor.specs : []).find((s) => /size/i.test(s.label || ''))
  const m = String(spec?.value || '').match(/(\d{2})/)
  return m ? parseInt(m[1], 10) : 24
}

// ---------- the room ----------
function buildRoomScene(group, st, rgb, build) {

  buildShell(group, rgb)
  const deskTop = DESK.h + DESK.top / 2
  buildDesk(group, rgb)

  // Turned so the glass panel faces the room rather than the wall — nobody
  // builds a window into a case and then points it at the skirting board.
  const tower = new THREE.Group()
  buildTowerScene(tower, st.spinners, build, rgb)
  const size = cabinetSize(build.case)
  const towerX = TOWER_X
  const towerY = deskTop + (size.height * MM) / 2
  const towerZ = DESK.z - 0.9
  tower.position.set(towerX, towerY, towerZ)
  tower.rotation.y = 0.5
  group.add(tower)

  const mon = buildMonitor(group, st, build, deskTop, rgb)
  buildPeripherals(group, deskTop, rgb)
  buildChair(group, rgb)
  buildDressing(group, rgb)

  // The RGB rig. This is the room the customer's colour choice actually makes:
  // a wash up the wall behind the panel, a strip throwing colour down onto the
  // floor under the desk, and the cabinet lighting its own corner.
  const backZ = -ROOM.d / 2
  lamp(group, rgb, 38, 22, DESK.x, mon.y + 1.5, backZ + 1.2)
  lamp(group, rgb, 15, 11, DESK.x, DESK.h - 1.2, DESK.z + DESK.d / 2)
  lamp(group, rgb, 26, 11, towerX, towerY, towerZ)
  lamp(group, rgb, 35, 18, DESK.x, 13.5, backZ + 1.0)
  // and the two lights that are not RGB: the monitor itself, and one dim warm
  // bulb overhead so the room is not a single colour.
  lamp(group, 0xa8c8ff, 40, 18, mon.x, mon.y, mon.z + 2.4)
  lamp(group, 0xffc98a, 150, 52, 0, ROOM.h - 3.5, -2)

  // The desk, the chair and the cabinet all together — this is the shot the
  // customer opens the test drive for.
  // The frame has to hold the monitor on the left and the cabinet on the
  // right — "where is the CPU" is the first thing anyone asks of a photo of a
  // desk, and the answer cannot be off-screen.
  // What the close shot must hold: the whole panel, the whole cabinet, and
  // enough desk in front that the keyboard is not sliced in half.
  const tw = size.width * MM, th = size.height * MM, tdp = size.depth * MM
  const deskPts = []
  corners(mon.x, mon.y, mon.z, mon.panelW / 2, mon.panelH / 2, 0.15, deskPts)
  corners(towerX, towerY, towerZ,
    (tw * Math.cos(0.5) + tdp * Math.sin(0.5)) / 2, th / 2,
    (tdp * Math.cos(0.5) + tw * Math.sin(0.5)) / 2, deskPts)
  corners(mon.x + 0.5, deskTop - 0.5, DESK.z + 2.6, 3.2, 0.4, 1.4, deskPts)
  const screenPts = corners(mon.x, mon.y, mon.z, mon.panelW / 2 + 0.16, mon.panelH / 2 + 0.16, 0.1)
  return {
    scenes: ['active'],
    theta: 0.16,
    phi: Math.PI * 0.47,
    maxRadius: 32,
    shadow: { extent: 28, pos: [-26, 26, 16], target: [0, 6, -12] },
    fitDesk: {
      target: centreOf(deskPts),
      points: deskPts,
      theta: 0.1,
      phi: Math.PI * 0.492,
      pad: 1.03,
    },
    fitScreen: {
      target: centreOf(screenPts),
      points: screenPts,
      theta: 0,
      phi: Math.PI / 2,
      pad: 1.02,
    },
    fitWide: {
      target: new THREE.Vector3(1, 7.5, -9),
      points: corners(1, 8, -9, 13, 7.5, 9),
      theta: 0.16,
      phi: Math.PI * 0.455,
      pad: 1.04,
    },
  }
}

// floor, three walls, ceiling, window, skirting
function buildShell(group, rgb) {
  const { w, h, d } = ROOM

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w + 20, d + 26), matte(0x2b2016, 0.78))
  floor.rotation.x = -Math.PI / 2
  group.add(at(floor, 0, 0, 13))

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(w, d), matte(0x171b1d, 0.95))
  ceiling.rotation.x = Math.PI / 2
  group.add(noShadow(at(ceiling, 0, h, 0)))

  const wallMat = matte(0x1b2420, 0.9)
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat)
  group.add(at(back, 0, h / 2, -d / 2))
  const leftW = new THREE.Mesh(new THREE.PlaneGeometry(d, h), wallMat)
  leftW.rotation.y = Math.PI / 2
  group.add(at(leftW, -w / 2, h / 2, 0))
  const rightW = new THREE.Mesh(new THREE.PlaneGeometry(d, h), wallMat)
  rightW.rotation.y = -Math.PI / 2
  group.add(at(rightW, w / 2, h / 2, 0))

  // skirting board — a 60mm strip that instantly reads as an actual room
  const skirt = matte(0x121814, 0.8)
  group.add(at(box(w, 0.9, 0.2, skirt), 0, 0.45, -d / 2 + 0.1))
  group.add(at(box(0.2, 0.9, d, skirt), -w / 2 + 0.1, 0.45, 0))
  group.add(at(box(0.2, 0.9, d, skirt), w / 2 - 0.1, 0.45, 0))

  // window on the left wall, which is where the key light comes from
  const wx = -w / 2 + 0.16
  group.add(at(noShadow(new THREE.Mesh(new THREE.PlaneGeometry(12, 9),
    new THREE.MeshBasicMaterial({ color: 0x24354f }))), wx, 14, -2))
  const frame = matte(0x0e1412, 0.7)
  for (const [fy, fz, fh, fd] of [[9.4, -2, 0.35, 12.4], [18.6, -2, 0.35, 12.4]]) {
    group.add(at(box(0.3, fh, fd, frame), wx - 0.06, fy, fz))
  }
  for (const fz of [-8.2, -2, 4.2]) {
    group.add(at(box(0.3, 9.4, 0.28, frame), wx - 0.06, 14, fz))
  }

  // rug under the whole setup
  const rug = rbox(24, 0.12, 17, fabric(0x1d2a26), 0.05)
  group.add(at(rug, DESK.x + 1, 0.07, DESK.z + 5.5))
  const rugEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(22.6, 0.12, 15.8)),
    new THREE.LineBasicMaterial({ color: rgb, transparent: true, opacity: 0.28 })
  )
  group.add(at(rugEdge, DESK.x + 1, 0.14, DESK.z + 5.5))
}

function buildDesk(group, rgb) {
  const { w, d, h, top, x, z } = DESK

  const wood = matte(0x3a2a1c, 0.55)
  group.add(at(rbox(w, top, d, wood, 0.06), x, h, z))

  // steel legs with feet, and a modesty panel across the back
  const legMat = metal(0x1a2028, 0.42)
  for (const sx of [-1, 1]) {
    const lx = x + sx * (w / 2 - 0.7)
    group.add(at(box(0.28, h - 0.2, d * 0.8, legMat), lx, (h - 0.2) / 2 + 0.1, z))
    group.add(at(rbox(0.7, 0.16, d * 0.9, legMat, 0.05), lx, 0.1, z))
    group.add(at(rbox(0.7, 0.16, d * 0.9, legMat, 0.05), lx, h - 0.35, z))
  }
  group.add(at(box(w - 2.6, 2.4, 0.16, matte(0x241a11, 0.7)), x, h - 2.2, z - d / 2 + 0.3))

  // under-desk RGB strip: the customer picked a colour, they should see it
  const strip = noShadow(at(box(w - 1.6, 0.12, 0.12, emissive(rgb, 1.1)), x, h - 0.32, z + d / 2 - 0.25))
  group.add(strip)
}

function buildMonitor(group, st, build, deskTop, rgb) {
  const inches = monitorInches(build.monitor)
  const panelW = inches * 0.871 * 25.4 * MM
  const panelH = inches * 0.490 * 25.4 * MM
  const x = MON_X
  const z = DESK.z - DESK.d / 2 + 1.4
  const standH = 1.9
  const y = deskTop + standH + panelH / 2 + 0.35

  // base, neck, and a shell that is thicker at the centre like a real panel
  group.add(at(cyl(1.25, 1.35, 0.12, metal(0x20262e, 0.4), 32), x, deskTop + 0.06, z))
  group.add(at(cyl(0.2, 0.26, standH, metal(0x20262e, 0.4), 20), x, deskTop + standH / 2, z))

  const shell = rbox(panelW + 0.18, panelH + 0.5, 0.26, matte(0x0d1116, 0.55), 0.07)
  group.add(at(shell, x, y - 0.16, z - 0.14))
  group.add(at(rbox(panelW * 0.34, panelH * 0.38, 0.22, matte(0x11161c, 0.5), 0.06), x, y - 0.16, z - 0.3))

  group.add(at(screenPanel(st, 'active', panelW, panelH), x, y, z))

  // power LED on the chin
  group.add(noShadow(at(box(0.12, 0.05, 0.03, emissive(rgb, 3)), x + panelW / 2 - 0.4, y - panelH / 2 - 0.22, z + 0.01)))

  // one desk speaker, on the side the cabinet is not
  for (const sx of [-1]) {
    const sp = new THREE.Group()
    sp.add(at(rbox(1.1, 2.3, 1.1, matte(0x14181e, 0.65), 0.08), 0, 1.15, 0))
    const cone = noShadow(at(cyl(0.34, 0.34, 0.06, plastic(0x0a0d11, 0.6), 20), 0, 1.35, 0.56))
    cone.rotation.x = Math.PI / 2
    sp.add(cone)
    sp.position.set(x + sx * (panelW / 2 + 1.5), deskTop, z + 0.4)
    sp.rotation.y = -sx * 0.4
    group.add(sp)
  }

  return { x, y, z, panelW, panelH }
}

function buildPeripherals(group, deskTop, rgb) {
  const x = MON_X
  const z = DESK.z + 2.2

  // mousepad
  group.add(noShadow(at(rbox(13, 0.05, 4.4, fabric(0x11161a), 0.02), x + 0.6, deskTop + 0.03, z)))

  // keyboard: tray, keycap field, underglow
  const kbW = 4.9, kbD = 1.75
  group.add(at(rbox(kbW, 0.24, kbD, matte(0x12171e, 0.6), 0.05), x, deskTop + 0.15, z))
  const cols = 15, rows = 5
  const caps = new THREE.InstancedMesh(
    new RoundedBoxGeometry(kbW / cols - 0.06, 0.09, kbD / rows - 0.06, 2, 0.02),
    plastic(0x252b34, 0.72),
    cols * rows
  )
  const m = new THREE.Matrix4()
  let i = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      m.setPosition(
        x - kbW / 2 + (c + 0.5) * (kbW / cols),
        deskTop + 0.31,
        z - kbD / 2 + (r + 0.5) * (kbD / rows)
      )
      caps.setMatrixAt(i++, m)
    }
  }
  caps.instanceMatrix.needsUpdate = true
  caps.castShadow = true
  group.add(caps)
  group.add(noShadow(at(box(kbW - 0.1, 0.03, kbD - 0.1, emissive(rgb, 2.2)), x, deskTop + 0.05, z)))

  // mouse — a squashed sphere, because a mouse is not a brick
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), matte(0x12171e, 0.5))
  mouse.scale.set(0.72, 0.52, 1.15)
  group.add(at(mouse, x + 4.1, deskTop + 0.24, z - 0.1))
  group.add(noShadow(at(box(0.08, 0.1, 0.34, emissive(rgb, 2.4)), x + 4.1, deskTop + 0.5, z - 0.25)))

  // headphones on a stand, and a mug — the props that sell a desk as used
  const standX = x - 6.4
  group.add(at(cyl(0.55, 0.7, 0.1, metal(0x1c222a), 20), standX, deskTop + 0.05, DESK.z - 1.6))
  group.add(at(cyl(0.14, 0.14, 2.6, metal(0x1c222a), 14), standX, deskTop + 1.35, DESK.z - 1.6))
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.16, 10, 24, Math.PI), matte(0x14191f, 0.55))
  band.rotation.y = Math.PI / 2
  group.add(at(band, standX, deskTop + 2.6, DESK.z - 1.6))
  for (const sz of [-1, 1]) {
    const cup = at(cyl(0.42, 0.42, 0.3, matte(0x14191f, 0.55), 20), standX, deskTop + 2.6, DESK.z - 1.6 + sz * 0.85)
    cup.rotation.x = Math.PI / 2
    group.add(cup)
  }
  const mug = cyl(0.42, 0.36, 0.95, matte(0xd8dee6, 0.5), 20)
  group.add(at(mug, x + 4.4, deskTop + 0.48, DESK.z + 2.6))
}

// A five-star gaming chair. Nothing here is load-bearing for the quote, but an
// empty desk reads as a showroom render and a chair reads as a room.
function buildChair(group, rgb) {
  const chair = new THREE.Group()
  const shell = matte(0x14181d, 0.62)
  const trim = matte(0x1d232a, 0.7)

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const leg = box(0.34, 0.2, 2.6, metal(0x1e242c, 0.38))
    leg.position.set(Math.sin(a) * 1.3, 0.45, Math.cos(a) * 1.3)
    leg.rotation.y = a
    chair.add(leg)
    const caster = cyl(0.3, 0.3, 0.22, plastic(0x0d1014, 0.55), 16)
    caster.rotation.z = Math.PI / 2
    caster.position.set(Math.sin(a) * 2.5, 0.3, Math.cos(a) * 2.5)
    chair.add(caster)
  }
  chair.add(at(cyl(0.34, 0.42, 2.6, metal(0x272e37, 0.35), 18), 0, 1.7, 0))
  chair.add(at(rbox(2.4, 0.4, 1.8, trim, 0.1), 0, 3.0, 0))

  // seat, tilted a degree or two like a chair actually sits
  const seat = rbox(5.2, 0.9, 5.0, shell, 0.35)
  seat.rotation.x = -0.04
  chair.add(at(seat, 0, 3.6, 0))
  for (const sx of [-1, 1]) {
    chair.add(at(rbox(0.8, 0.7, 4.4, trim, 0.3), sx * 2.2, 3.9, 0))
  }

  // backrest with racing bolsters, headrest, and the customer's colour on the
  // stitching so the chair belongs to this build
  const back = new THREE.Group()
  const pad = rbox(4.8, 7.4, 0.9, shell, 0.35)
  back.add(at(pad, 0, 3.7, 0))
  for (const sx of [-1, 1]) {
    back.add(at(rbox(0.8, 6.6, 1.5, trim, 0.32), sx * 2.3, 3.6, 0.35))
  }
  back.add(noShadow(at(box(0.12, 6.2, 0.06, emissive(rgb, 2.2)), -1.5, 3.7, 0.5)))
  back.add(noShadow(at(box(0.12, 6.2, 0.06, emissive(rgb, 2.2)), 1.5, 3.7, 0.5)))
  back.add(at(rbox(2.8, 1.5, 1.0, trim, 0.3), 0, 8.0, 0.2))
  back.position.set(0, 3.9, -2.2)
  back.rotation.x = 0.16
  chair.add(back)

  for (const sx of [-1, 1]) {
    chair.add(at(box(0.3, 1.5, 0.3, trim), sx * 2.4, 4.7, -0.6))
    chair.add(at(rbox(0.9, 0.35, 2.6, shell, 0.14), sx * 2.4, 5.5, -0.2))
  }

  // Pushed out to the left and turned away: a chair parked dead centre hides
  // the machine the whole picture exists to show.
  chair.position.set(DESK.x - 8.6, 0, DESK.z + 6.4)
  chair.rotation.y = Math.PI + 1.15
  chair.scale.setScalar(0.88)
  group.add(chair)
}

// wall shelf, framed prints, a floor lamp and the cable from the tower to the
// desk — the difference between a product shot and a photograph
function buildDressing(group, rgb) {
  const backZ = -ROOM.d / 2 + 0.2
  const shelf = matte(0x33251a, 0.6)
  group.add(at(rbox(9, 0.3, 1.8, shelf, 0.05), -13, 16.5, backZ + 0.9))
  for (let i = 0; i < 4; i++) {
    group.add(at(box(0.35, 1.6 + (i % 2) * 0.4, 1.1, matte([0x2f4a3c, 0x4a3b2f, 0x2f3a4a, 0x43304a][i], 0.7)),
      -16 + i * 0.55, 17.5 + (i % 2) * 0.2, backZ + 0.9))
  }

  // Backlit prints, because a dark rectangle on a dark wall is just a hole
  for (const [px, py, pw, ph, glowStrength] of [[9, 18, 5.5, 4, 0.55], [15, 16.5, 4, 5.5, 0.3]]) {
    group.add(at(box(pw + 0.3, ph + 0.3, 0.16, matte(0x0d1210, 0.6)), px, py, backZ + 0.08))
    group.add(noShadow(at(new THREE.Mesh(new THREE.PlaneGeometry(pw, ph),
      emissive(rgb, glowStrength * 0.22)), px, py, backZ + 0.18)))
  }

  // wall LED wash above the desk
  group.add(noShadow(at(box(20, 0.16, 0.16, emissive(rgb, 1.6)), DESK.x, 13.5, backZ + 0.25)))

  // floor lamp in the far corner
  const lampX = -ROOM.w / 2 + 4, lampZ = -ROOM.d / 2 + 4
  group.add(at(cyl(1.1, 1.3, 0.2, metal(0x22282f), 20), lampX, 0.2, lampZ))
  group.add(at(cyl(0.12, 0.12, 14, metal(0x22282f), 12), lampX, 7, lampZ))
  group.add(noShadow(at(cyl(1.5, 2.1, 2.6, emissive(0xffe2b8, 0.3), 24), lampX, 15, lampZ)))
  lamp(group, 0xffd9a0, 90, 28, lampX, 14.5, lampZ)

  // power cable, tower to the wall
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(TOWER_X, 7.2, DESK.z - 3.2),
    new THREE.Vector3(TOWER_X + 0.6, 4.0, DESK.z - 3.9),
    new THREE.Vector3(TOWER_X + 0.2, 0.3, backZ + 2.2),
    new THREE.Vector3(TOWER_X - 1.4, 0.2, backZ + 1.0),
  ])
  group.add(noShadow(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.09, 8, false), matte(0x0c0f13, 0.8))))
}

// ---------- the tower ----------
function buildTowerScene(group, spinners, build, rgb) {
  const { case: cabinet, motherboard, gpu, cooler, ram, psu, storage } = build
  const size = cabinetSize(cabinet)
  const W = size.width * MM, H = size.height * MM, D = size.depth * MM

  // chassis: solid back/floor/roof, glass left panel
  const shellMat = matte(0x191f28, 0.48)
  const frame = new THREE.Group()
  frame.add(at(box(W, 0.06, D, shellMat), 0, -H / 2, 0))       // floor
  frame.add(at(box(W, 0.06, D, shellMat), 0, H / 2, 0))        // roof
  frame.add(at(box(0.06, H, D, shellMat), W / 2, 0, 0))        // right panel
  frame.add(at(box(W, H, 0.06, shellMat), 0, 0, -D / 2))       // back panel
  frame.add(noShadow(at(box(0.03, H * 0.94, D * 0.94, glassMat()), -W / 2, 0, 0)))
  // front: a mesh bezel rather than an open hole
  frame.add(at(box(W * 0.96, H * 0.98, 0.08, matte(0x10151c, 0.7)), 0, 0, D / 2 - 0.04))
  // neon edge outline, the brand cue
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, D)),
    new THREE.LineBasicMaterial({ color: rgb, transparent: true, opacity: 0.5 })
  )
  frame.add(edges)
  // feet and a power button, so it stands on the floor like an object
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    frame.add(at(cyl(0.16, 0.18, 0.12, plastic(0x0b0e12, 0.6), 12), sx * (W / 2 - 0.25), -H / 2 - 0.09, sz * (D / 2 - 0.3)))
  }
  const power = noShadow(at(cyl(0.12, 0.12, 0.05, emissive(rgb, 3), 14), 0, H / 2 - 0.3, D / 2 + 0.02))
  power.rotation.x = Math.PI / 2
  frame.add(power)
  group.add(frame)

  // motherboard against the back wall
  const [bw, bh] = BOARD_SIZE[motherboard?.form_factor] || BOARD_SIZE.ATX
  const boardZ = -D / 2 + 0.12
  const boardY = H / 2 - (bh * MM) / 2 - 0.45
  // Mounted against the right-hand panel like a real tower, so everything
  // bolted to it faces the viewer through the glass.
  const boardX = W / 2 - 0.12
  const board = box(0.035, bh * MM, bw * MM, matte(0x0f3d2a, 0.62))
  board.position.set(boardX, boardY, boardZ + (bw * MM) / 2 - 0.1)
  group.add(board)

  // CPU cooler — real height, and it turns red if it cannot fit
  if (cooler) {
    const ch = (cooler.height_mm || 150) * MM
    const tooTall = cabinet?.max_cooler_height_mm && cooler.height_mm > cabinet.max_cooler_height_mm
    const body = box(0.9, ch, 0.9, metal(tooTall ? ALERT : 0x3b444f, 0.3))
    body.position.set(boardX - 0.55, boardY + (bh * MM) / 2 - ch / 2 - 0.25, boardZ + 0.55)
    group.add(body)
    const fan = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.06, 20),
      emissive(tooTall ? new THREE.Color(ALERT) : rgb, 1.1)
    )
    fan.rotation.z = Math.PI / 2
    fan.position.set(boardX - 1.08, body.position.y, body.position.z)
    fan.userData.speed = 2.2
    noShadow(fan)
    spinners.push(fan)
    group.add(fan)
  }

  // RAM sticks — one per module in the kit
  const modules = Math.min(Number(ram?.module_count) || 2, 4)
  for (let i = 0; i < modules; i++) {
    const stick = box(0.12, 1.15, 0.05, emissive(rgb, 0.9))
    stick.position.set(boardX - 0.12, boardY + (bh * MM) / 2 - 0.62, boardZ + 1.15 + i * 0.16)
    group.add(noShadow(stick))
  }

  // GPU — length straight from the catalogue, red and overhanging if it fouls
  if (gpu) {
    const len = (gpu.length_mm || 300) * MM
    const overLength = cabinet?.max_gpu_length_mm && gpu.length_mm > cabinet.max_gpu_length_mm
    const card = box(1.1, 0.30, len, matte(overLength ? ALERT : 0x2b3442, 0.5))
    card.position.set(boardX - 0.6, boardY - 0.35, boardZ + len / 2 + 0.06)
    group.add(card)
    const strip = box(1.12, 0.05, len * 0.82, emissive(overLength ? new THREE.Color(ALERT) : rgb, 2.2))
    strip.position.set(boardX - 0.6, boardY - 0.14, card.position.z)
    group.add(noShadow(strip))
    for (let i = 0; i < 2; i++) {
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 18), emissive(rgb, 1.2))
      f.position.set(boardX - 0.6, boardY - 0.15, boardZ + len * (0.3 + i * 0.42))
      f.userData.speed = 3.4 - i * 0.5
      noShadow(f)
      spinners.push(f)
      group.add(f)
    }
  }

  // PSU in the basement
  if (psu) {
    const p = box(W * 0.8, 0.86, 1.5, matte(0x11161e, 0.55))
    p.position.set(0, -H / 2 + 0.5, -D / 2 + 0.95)
    group.add(p)
  }

  // storage sliver
  if (storage) {
    const s = box(0.5, 0.05, 0.9, emissive(rgb, 0.7))
    s.position.set(boardX - 0.1, boardY - 1.25, boardZ + 0.6)
    group.add(noShadow(s))
  }

  // intake fans on the front face
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.05, 8, 22), emissive(rgb, 1.8))
    f.position.set(0, H / 2 - 1.0 - i * 0.95, D / 2 - 0.02)
    f.userData.speed = 1.6 + i * 0.35
    noShadow(f)
    spinners.push(f)
    group.add(f)
  }

  // No position set here — the tower is placed by whoever builds the scene
  // around it (buildRoomScene stands it on the floor beside the desk).
}

// ---------- the lab ----------
// The old lab was a grid of 26cm desks floating on a slab — a diagram of a
// lab, not a lab. This one is built at the same millimetre scale as the single
// workstation and put inside a room, so 25 machines read as a room with 25
// machines in it. Everything repeated is instanced: the draw call count is
// fixed at about twenty whether it is 4 seats or 60.
const LAB = {
  pitchX: 15, pitchZ: 17,
  deskW: 13, deskD: 7, deskH: 7.5, top: 0.3,
  inches: 22,
}

function instancedAt(group, geo, mat, list) {
  const mesh = new THREE.InstancedMesh(geo, mat, list.length)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()
  const p = new THREE.Vector3()
  const sc = new THREE.Vector3()
  list.forEach((t, i) => {
    p.set(t.x, t.y, t.z)
    e.set(t.rx || 0, t.ry || 0, t.rz || 0)
    q.setFromEuler(e)
    sc.set(t.sx ?? 1, t.sy ?? 1, t.sz ?? 1)
    m.compose(p, q, sc)
    mesh.setMatrixAt(i, m)
  })
  mesh.instanceMatrix.needsUpdate = true
  group.add(mesh)
  return mesh
}

function buildLabScene(group, st, rgb, build, seats) {
  const { pitchX, pitchZ, deskW, deskD, deskH, top, inches } = LAB
  const deskTop = deskH + top / 2
  // Slightly wider than square: a classroom is wider than it is deep.
  const cols = Math.max(2, Math.min(seats, Math.ceil(Math.sqrt(seats * 1.5))))
  const rows = Math.ceil(seats / cols)

  const roomW = cols * pitchX + 20
  const roomD = rows * pitchZ + 26
  const roomH = 32

  const panelW = inches * 0.871 * 25.4 * MM
  const panelH = inches * 0.490 * 25.4 * MM
  const standH = 1.6
  const screenY = deskTop + standH + panelH / 2 + 0.3

  const size = cabinetSize(build?.case)
  const tw = size.width * MM, th = size.height * MM, td = size.depth * MM

  const stations = []
  for (let i = 0; i < seats; i++) {
    const r = Math.floor(i / cols)
    const c = i % cols
    stations.push({
      x: (c - (cols - 1) / 2) * pitchX,
      z: (r - (rows - 1) / 2) * pitchZ,
      scene: SCREEN_SCENES[i % SCREEN_SCENES.length].id,
    })
  }

  buildLabShell(group, rgb, roomW, roomD, roomH, rows)

  // ---- the furniture, one instanced mesh per part ----
  const wood = matte(0x3a2a1c, 0.6)
  const steelMat = metal(0x1a2028, 0.45)
  const shellMat = matte(0x0d1116, 0.55)
  const bodyMat = matte(0x191f28, 0.5)
  const seatMat = fabric(0x1b2128)
  const capMat = plastic(0x22272f, 0.72)

  instancedAt(group, new RoundedBoxGeometry(deskW, top, deskD, 2, 0.06), wood,
    stations.map((s) => ({ x: s.x, y: deskH, z: s.z })))
  instancedAt(group, new THREE.BoxGeometry(0.3, deskH - 0.2, deskD * 0.8), steelMat,
    stations.flatMap((s) => [-1, 1].map((sx) => ({ x: s.x + sx * (deskW / 2 - 0.6), y: (deskH - 0.2) / 2 + 0.1, z: s.z }))))

  // monitor: shell, stand, base
  instancedAt(group, new RoundedBoxGeometry(panelW + 0.16, panelH + 0.45, 0.24, 2, 0.06), shellMat,
    stations.map((s) => ({ x: s.x, y: screenY - 0.14, z: s.z - deskD / 2 + 1.05 })))
  instancedAt(group, new THREE.CylinderGeometry(0.18, 0.22, standH, 14), steelMat,
    stations.map((s) => ({ x: s.x, y: deskTop + standH / 2, z: s.z - deskD / 2 + 1.2 })))
  instancedAt(group, new THREE.CylinderGeometry(1.0, 1.1, 0.1, 22), steelMat,
    stations.map((s) => ({ x: s.x, y: deskTop + 0.05, z: s.z - deskD / 2 + 1.2 })))

  // screens, grouped by what that machine is running — this is the whole point
  // of a lab view: one desk gaming, the next editing, the next training.
  for (const scene of SCREEN_SCENES) {
    const mine = stations.filter((s) => s.scene === scene.id)
    if (!mine.length) continue
    const mesh = instancedAt(group, new THREE.PlaneGeometry(panelW, panelH),
      new THREE.MeshBasicMaterial({ map: screenTextureFor(st, scene.id), toneMapped: false }),
      mine.map((s) => ({ x: s.x, y: screenY, z: s.z - deskD / 2 + 1.18 })))
    noShadow(mesh)
    st.screenMeshes.push({ mesh, id: scene.id })
  }

  // keyboard, keycap slab and mouse
  instancedAt(group, new RoundedBoxGeometry(4.6, 0.22, 1.6, 2, 0.05), shellMat,
    stations.map((s) => ({ x: s.x, y: deskTop + 0.14, z: s.z + 1.5 })))
  instancedAt(group, new RoundedBoxGeometry(4.2, 0.08, 1.25, 2, 0.03), capMat,
    stations.map((s) => ({ x: s.x, y: deskTop + 0.29, z: s.z + 1.5 })))
  const mouseGeo = new THREE.SphereGeometry(0.5, 14, 10)
  instancedAt(group, mouseGeo, shellMat,
    stations.map((s) => ({ x: s.x + 3.3, y: deskTop + 0.22, z: s.z + 1.4, sx: 0.7, sy: 0.5, sz: 1.1 })))

  // cabinet, standing on the floor under the right-hand side of each desk
  instancedAt(group, new RoundedBoxGeometry(tw, th, td, 2, 0.06), bodyMat,
    stations.map((s) => ({ x: s.x + deskW / 2 - tw / 2 - 0.5, y: th / 2 + 0.1, z: s.z - 0.4 })))
  const strip = instancedAt(group, new THREE.BoxGeometry(0.14, th * 0.7, 0.14), emissive(rgb, 3.2),
    stations.map((s) => ({ x: s.x + deskW / 2 - tw - 0.55, y: th / 2 + 0.1, z: s.z - 0.4 + td / 2 - 0.3 })))
  noShadow(strip)

  // chairs
  instancedAt(group, new RoundedBoxGeometry(4.2, 0.5, 4.0, 2, 0.2), seatMat,
    stations.map((s) => ({ x: s.x, y: 3.6, z: s.z + deskD / 2 + 2.6 })))
  instancedAt(group, new RoundedBoxGeometry(4.0, 5.2, 0.5, 2, 0.2), seatMat,
    stations.map((s) => ({ x: s.x, y: 6.3, z: s.z + deskD / 2 + 4.5, rx: 0.12 })))
  instancedAt(group, new THREE.CylinderGeometry(0.28, 0.34, 3.2, 12), steelMat,
    stations.map((s) => ({ x: s.x, y: 1.9, z: s.z + deskD / 2 + 2.6 })))
  instancedAt(group, new THREE.CylinderGeometry(1.7, 1.9, 0.22, 18), steelMat,
    stations.map((s) => ({ x: s.x, y: 0.2, z: s.z + deskD / 2 + 2.6 })))

  // ---- light: strip fittings overhead, plus the room's own RGB ----
  const spanZ = Math.max(roomD / 2 - 8, 4)
  for (const lz of [-spanZ, 0, spanZ]) {
    lamp(group, 0xdcecff, 420, roomD, 0, roomH - 4, lz)
  }
  for (const s of stations.filter((_, i) => i % Math.ceil(seats / 6) === 0)) {
    lamp(group, rgb, 55, 26, s.x, 2.5, s.z)
  }

  const half = Math.max(roomW, roomD) * 0.5
  const gridX = (cols - 1) / 2 * pitchX + deskW / 2 + 2
  const gridZ = (rows - 1) / 2 * pitchZ + deskD / 2 + 3
  const labPts = corners(0, screenY / 2 + 1, 1, gridX, screenY / 2 + 1, gridZ)
  // Nearest station to the camera, middle of its row: the desk a visitor would
  // actually walk up to.
  const front = stations.reduce((best, st2) =>
    (st2.z > best.z || (st2.z === best.z && Math.abs(st2.x) < Math.abs(best.x))) ? st2 : best, stations[0])
  const stationPts = corners(front.x, screenY, front.z - deskD / 2 + 1.18,
    panelW / 2 + 0.15, panelH / 2 + 0.3, 0.1)
  corners(front.x + deskW / 2 - tw / 2 - 0.5, th / 2 + 0.1, front.z - 0.4, tw / 2, th / 2, td / 2, stationPts)
  return {
    scenes: SCREEN_SCENES.map((s) => s.id),
    opensWide: true,
    theta: -0.28,
    phi: Math.PI * 0.40,
    maxRadius: half * 4 + 60,
    shadow: { extent: half, pos: [half * 0.6, roomH * 1.6, half * 0.9], target: [0, 4, 0] },
    // A lab opens on the room — that is what the customer came to see — with
    // the close-up one tap away.
    fitDesk: {
      target: centreOf(stationPts),
      points: stationPts,
      theta: 0.42,
      phi: Math.PI * 0.47,
      pad: 1.15,
    },
    fitScreen: {
      target: centreOf(stationPts.slice(0, 8)),
      points: stationPts.slice(0, 8),
      theta: 0,
      phi: Math.PI / 2,
      pad: 1.02,
    },
    fitWide: {
      target: centreOf(labPts),
      points: labPts,
      theta: -0.28,
      phi: Math.PI * 0.40,
      pad: 1.02,
    },
  }
}

// floor, walls, ceiling with tube fittings, and a whiteboard at the front
function buildLabShell(group, rgb, w, d, h, rows) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), matte(0x2c3330, 0.72))
  floor.rotation.x = -Math.PI / 2
  group.add(at(floor, 0, 0, 0))

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(w, d), matte(0x1b211f, 0.95))
  ceiling.rotation.x = Math.PI / 2
  group.add(noShadow(at(ceiling, 0, h, 0)))

  const wallMat = matte(0x222c28, 0.9)
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat)
  group.add(at(back, 0, h / 2, -d / 2))
  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(d, h), wallMat)
    side.rotation.y = -sx * Math.PI / 2
    group.add(at(side, sx * w / 2, h / 2, 0))
  }

  const skirt = matte(0x151a18, 0.8)
  group.add(at(box(w, 1.0, 0.25, skirt), 0, 0.5, -d / 2 + 0.12))
  for (const sx of [-1, 1]) group.add(at(box(0.25, 1.0, d, skirt), sx * (w / 2 - 0.12), 0.5, 0))

  // ceiling tube fittings, one run per row of desks
  const runs = Math.max(2, rows)
  const tubes = []
  for (let i = 0; i < runs; i++) {
    tubes.push({ x: 0, y: h - 1.2, z: (i - (runs - 1) / 2) * (d / runs) })
  }
  noShadow(instancedAt(group, new THREE.BoxGeometry(w * 0.62, 0.35, 1.1), matte(0x2a3230, 0.6), tubes))
  // Thick enough to survive being a couple of pixels tall when the camera is
  // back far enough to hold sixty desks — a thinner strip aliases into dashes.
  const glow = instancedAt(group, new THREE.BoxGeometry(w * 0.6, 0.34, 0.9), emissive(0xeaf4ff, 1.1),
    tubes.map((t) => ({ ...t, y: t.y - 0.3 })))
  noShadow(glow)

  // whiteboard and a teacher's desk at the front of the room
  group.add(at(box(w * 0.4, 9, 0.3, matte(0x101614, 0.6)), 0, 15, -d / 2 + 0.2))
  group.add(noShadow(at(new THREE.Mesh(new THREE.PlaneGeometry(w * 0.4 - 0.6, 8.4),
    new THREE.MeshBasicMaterial({ color: 0xdfe8ee })), 0, 15, -d / 2 + 0.36)))
  group.add(at(rbox(16, 0.3, 7, matte(0x3a2a1c, 0.6), 0.06), 0, 7.5, -d / 2 + 6))
  for (const sx of [-1, 1]) {
    group.add(at(box(0.3, 7.3, 5.6, metal(0x1a2028, 0.45)), sx * 7, 3.65, -d / 2 + 6))
  }

  // the brand cue: an RGB line where the wall meets the floor
  const line = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w - 0.5, 0.05, d - 0.5)),
    new THREE.LineBasicMaterial({ color: rgb, transparent: true, opacity: 0.35 })
  )
  group.add(at(line, 0, 1.1, 0))
}
