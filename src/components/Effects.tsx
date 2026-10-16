'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function makeTexture(kind: string) {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  g.fillStyle = '#fff'
  if (kind === 'petals') {
    g.beginPath()
    g.ellipse(32, 32, 14, 26, 0, 0, Math.PI * 2)
    g.fill()
  } else if (kind === 'hearts') {
    g.beginPath()
    g.moveTo(32, 54)
    g.bezierCurveTo(4, 34, 10, 10, 32, 24)
    g.bezierCurveTo(54, 10, 60, 34, 32, 54)
    g.fill()
  } else if (kind === 'stars') {
    g.beginPath()
    g.moveTo(32, 2); g.quadraticCurveTo(32, 32, 62, 32); g.quadraticCurveTo(32, 32, 32, 62)
    g.quadraticCurveTo(32, 32, 2, 32); g.quadraticCurveTo(32, 32, 32, 2)
    g.fill()
  } else {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    r.addColorStop(0, 'rgba(255,255,255,1)')
    r.addColorStop(0.3, 'rgba(255,255,255,.7)')
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 64, 64)
  }
  return new THREE.CanvasTexture(c)
}

const vertex = `
attribute float aSeed;
uniform float uTime; uniform float uSize; uniform float uTwinkle;
varying float vSeed; varying float vAlpha;
void main() {
  vSeed = aSeed;
  vAlpha = mix(1.0, 0.25 + 0.75 * abs(sin(uTime * (0.6 + aSeed) + aSeed * 40.0)), uTwinkle);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = uSize * (0.5 + aSeed) * (10.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}`
const fragment = `
uniform sampler2D uMap; uniform vec3 uColor; uniform float uTime; uniform float uSpin;
varying float vSeed; varying float vAlpha;
void main() {
  float a = uSpin * (uTime * (0.4 + vSeed) + vSeed * 6.28);
  vec2 p = gl_PointCoord - 0.5;
  p = vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a)) + 0.5;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) discard;
  float t = texture2D(uMap, p).a;
  gl_FragColor = vec4(uColor, t * vAlpha * 0.85);
}`

/** Three.js particle layer: petals, sparkles, stars or hearts drifting over the card. */
export default function Effects({ kind, color }: { kind: string; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || kind === 'none') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    } catch {
      return // no WebGL: the card simply shows without particles
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50)
    camera.position.z = 10

    const N = kind === 'stars' ? 160 : kind === 'sparkles' ? 110 : 60
    const W = 12, H = 10
    const pos = new Float32Array(N * 3)
    const seed = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * W
      pos[i * 3 + 1] = (Math.random() - 0.5) * H
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4
      seed[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const tex = makeTexture(kind)
    const mat = new THREE.ShaderMaterial({
      vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false,
      uniforms: {
        uMap: { value: tex }, uColor: { value: new THREE.Color(color) }, uTime: { value: 0 },
        uSize: { value: kind === 'petals' || kind === 'hearts' ? 26 : kind === 'stars' ? 12 : 16 },
        uTwinkle: { value: kind === 'stars' || kind === 'sparkles' ? 1 : 0 },
        uSpin: { value: kind === 'petals' ? 1 : 0 },
      },
    })
    scene.add(new THREE.Points(geo, mat))

    const resize = () => {
      const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const clock = new THREE.Clock()
    let raf = 0
    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05)
      const t = clock.elapsedTime
      mat.uniforms.uTime.value = t
      const vy = kind === 'petals' ? -0.9 : kind === 'hearts' ? 0.7 : kind === 'sparkles' ? 0.25 : 0
      if (vy !== 0) {
        for (let i = 0; i < N; i++) {
          pos[i * 3 + 1] += vy * (0.5 + seed[i]) * dt
          pos[i * 3] += Math.sin(t * (0.5 + seed[i]) + seed[i] * 10) * 0.35 * dt
          if (pos[i * 3 + 1] < -H / 2) pos[i * 3 + 1] = H / 2
          if (pos[i * 3 + 1] > H / 2) pos[i * 3 + 1] = -H / 2
        }
        geo.attributes.position.needsUpdate = true
      }
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      geo.dispose(); mat.dispose(); tex.dispose(); renderer.dispose()
    }
  }, [kind, color])

  if (kind === 'none') return null
  return <canvas ref={ref} className="fx" aria-hidden="true" />
}
