import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, LogIn, UserPlus } from 'lucide-react'

const heroFontStyle = {
  fontFamily: "'Russo One', 'Inter', sans-serif",
} as const

type Star = {
  x: number
  y: number
  z: number
  pz: number
}

const STAR_COUNT = 480
const SPEED = 0.018
const TRAIL_FADE = 0.18

function useWarpStarfield(canvasRef: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let width = 0
    let height = 0
    let centerX = 0
    let centerY = 0
    let stars: Star[] = []
    let raf = 0
    let lastTs = performance.now()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const seed = () => {
      stars = Array.from({ length: STAR_COUNT }, () => ({
        x: (Math.random() - 0.5) * width * 1.6,
        y: (Math.random() - 0.5) * height * 1.6,
        z: Math.random() * width,
        pz: 0,
      }))
      stars.forEach((s) => {
        s.pz = s.z
      })
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      centerX = width / 2
      centerY = height / 2
      seed()
    }

    const tick = (ts: number) => {
      const dt = Math.min(48, ts - lastTs)
      lastTs = ts

      ctx.fillStyle = `rgba(4, 3, 6, ${TRAIL_FADE})`
      ctx.fillRect(0, 0, width, height)

      const advance = SPEED * dt

      for (const s of stars) {
        s.pz = s.z
        s.z -= advance * width

        if (s.z < 1) {
          s.x = (Math.random() - 0.5) * width * 1.6
          s.y = (Math.random() - 0.5) * height * 1.6
          s.z = width
          s.pz = s.z
        }

        const k = 128 / s.z
        const sx = s.x * k + centerX
        const sy = s.y * k + centerY

        if (sx < -40 || sx > width + 40 || sy < -40 || sy > height + 40) continue

        const pk = 128 / s.pz
        const px = s.x * pk + centerX
        const py = s.y * pk + centerY

        const depth = 1 - s.z / width
        const alpha = Math.min(1, 0.18 + depth * 0.95)
        const thickness = Math.max(0.4, depth * 1.8)

        ctx.strokeStyle = `rgba(220, 200, 160, ${alpha})`
        ctx.lineWidth = thickness
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(sx, sy)
        ctx.stroke()
      }

      raf = requestAnimationFrame(tick)
    }

    resize()
    raf = requestAnimationFrame(tick)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [canvasRef])
}

const scanlineStyle = {
  backgroundImage:
    'repeating-linear-gradient(180deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 3px)',
  mixBlendMode: 'overlay' as const,
}

const vignetteStyle = {
  background:
    'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.92) 100%)',
}

const noiseStyle = {
  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.85  0 0 0 0 0.78  0 0 0 0 0.6  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
  backgroundSize: '160px 160px',
}

export default function WelcomePage() {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [glitch, setGlitch] = useState(false)
  const [pulse, setPulse] = useState(false)

  useWarpStarfield(canvasRef)

  useEffect(() => {
    let glitchTimer: ReturnType<typeof setTimeout>
    const scheduleGlitch = () => {
      const wait = 2400 + Math.random() * 4200
      glitchTimer = setTimeout(() => {
        setGlitch(true)
        setTimeout(() => setGlitch(false), 140 + Math.random() * 180)
        scheduleGlitch()
      }, wait)
    }
    scheduleGlitch()
    return () => clearTimeout(glitchTimer)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => !p), 1200)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#040306]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-none absolute inset-0" style={scanlineStyle} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.10] mix-blend-overlay" style={noiseStyle} />
      <div className="pointer-events-none absolute inset-0" style={vignetteStyle} />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ffb84a] to-transparent"
        style={{ opacity: pulse ? 0.65 : 0.18, transition: 'opacity 600ms ease' }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff4848] to-transparent"
        style={{ opacity: pulse ? 0.18 : 0.6, transition: 'opacity 600ms ease' }}
      />

      <div className="pointer-events-none absolute left-6 top-6 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.42em] text-[#7a6a52]">
        <span
          className="block h-2 w-2 rounded-full bg-[#ff4848] shadow-[0_0_12px_#ff4848]"
          style={{ opacity: pulse ? 1 : 0.35, transition: 'opacity 220ms ease' }}
        />
        <span>REC · {t('welcome.signalLive')}</span>
      </div>

      <div className="pointer-events-none absolute right-6 top-6 text-right text-[10px] font-medium uppercase tracking-[0.42em] text-[#7a6a52]">
        <div>SECTOR · 03</div>
        <div className="mt-1 text-[#a8916a]">{t('welcome.signalUnlock')}</div>
      </div>

      <div className="pointer-events-none absolute left-6 bottom-6 text-[10px] font-mono uppercase tracking-[0.32em] text-[#7a6a52]">
        v.craft.tree // 24×7
      </div>

      <div className="pointer-events-none absolute right-6 bottom-6 text-right text-[10px] font-mono uppercase tracking-[0.32em] text-[#7a6a52]">
        ░░ FAN-PROJECT ░░
      </div>

      <div className="relative flex h-full w-full items-center justify-center px-6">
        <div className="relative w-full max-w-[820px] text-center">
          <div className="mb-6 flex items-center justify-center gap-3 text-[10px] font-medium uppercase tracking-[0.6em] text-[#a8916a]">
            <span className="h-px w-12 bg-[#a8916a]/45" />
            <span>{t('welcome.eyebrow')}</span>
            <span className="h-px w-12 bg-[#a8916a]/45" />
          </div>

          <h1
            style={heroFontStyle}
            data-text={t('welcome.title')}
            className={`relative text-[clamp(2.4rem,6vw,5.4rem)] leading-[0.98] tracking-[-0.02em] text-[#f3e0b5] ${
              glitch ? 'glitch-active' : ''
            }`}
          >
            {t('welcome.title')}
          </h1>

          <p className="mx-auto mt-6 max-w-[44ch] text-[0.92rem] leading-7 text-[#a8916a]">
            {t('welcome.tagline')}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border border-[#ffb84a]/40 bg-gradient-to-r from-[#ffb84a]/15 via-[#ffb84a]/22 to-[#ffb84a]/15 px-7 py-3.5 text-[0.92rem] font-semibold uppercase tracking-[0.22em] text-[#ffe2a8] shadow-[0_0_40px_rgba(255,184,74,0.18)] transition-all duration-300 hover:border-[#ffb84a]/70 hover:from-[#ffb84a]/25 hover:to-[#ffb84a]/30 hover:shadow-[0_0_60px_rgba(255,184,74,0.32)]"
            >
              <span className="absolute inset-0 translate-x-[-110%] bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.18),transparent)] transition-transform duration-700 group-hover:translate-x-[120%]" />
              <LogIn size={16} className="relative" />
              <span className="relative">{t('auth.login')}</span>
              <ArrowRight size={14} className="relative transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center gap-2.5 rounded-full border border-[#3a3329] bg-black/30 px-7 py-3.5 text-[0.92rem] font-semibold uppercase tracking-[0.22em] text-[#c2ad88] backdrop-blur-sm transition-all duration-300 hover:border-[#ffb84a]/40 hover:bg-black/50 hover:text-[#ffe2a8]"
            >
              <UserPlus size={16} />
              <span>{t('auth.register')}</span>
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-[0.42em] text-[#5a4f3e]">
            <span className="h-px w-6 bg-[#5a4f3e]" />
            <span>// PRESS · ENTER</span>
            <span className="h-px w-6 bg-[#5a4f3e]" />
          </div>
        </div>
      </div>

      <style>{`
        h1.glitch-active {
          text-shadow:
            2px 0 0 rgba(255, 72, 72, 0.85),
            -2px 0 0 rgba(72, 200, 255, 0.85);
          animation: welcome-glitch 140ms steps(2, end);
        }
        @keyframes welcome-glitch {
          0%   { transform: translate(0, 0); clip-path: inset(0 0 0 0); }
          20%  { transform: translate(-2px, 1px); clip-path: inset(12% 0 38% 0); }
          40%  { transform: translate(2px, -1px); clip-path: inset(48% 0 8% 0); }
          60%  { transform: translate(-1px, 2px); clip-path: inset(22% 0 60% 0); }
          80%  { transform: translate(1px, -2px); clip-path: inset(64% 0 18% 0); }
          100% { transform: translate(0, 0); clip-path: inset(0 0 0 0); }
        }
      `}</style>
    </div>
  )
}
