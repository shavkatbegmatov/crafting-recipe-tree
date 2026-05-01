import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  alpha: number
  hue: number
}

const PARTICLE_COUNT = 90

function useNebulaParticles(canvasRef: React.RefObject<HTMLCanvasElement>) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let width = 0
    let height = 0
    let particles: Particle[] = []
    let raf = 0
    let lastTs = performance.now()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const seed = () => {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: 0.6 + Math.random() * 1.8,
        alpha: 0.18 + Math.random() * 0.55,
        hue: Math.random() < 0.7 ? 42 : 18,
      }))
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }

    const tick = (ts: number) => {
      const dt = Math.min(48, ts - lastTs)
      lastTs = ts

      ctx.clearRect(0, 0, width, height)

      const t = ts * 0.0006
      for (const p of particles) {
        const driftX = Math.sin(t + p.y * 0.003) * 0.06
        const driftY = Math.cos(t + p.x * 0.003) * 0.06
        p.x += (p.vx + driftX) * dt
        p.y += (p.vy + driftY) * dt

        if (p.x < -10) p.x = width + 10
        if (p.x > width + 10) p.x = -10
        if (p.y < -10) p.y = height + 10
        if (p.y > height + 10) p.y = -10

        const flicker = 0.6 + 0.4 * Math.sin(ts * 0.002 + p.x * 0.01)
        const a = p.alpha * flicker

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6)
        grad.addColorStop(0, `hsla(${p.hue}, 78%, 70%, ${a})`)
        grad.addColorStop(0.5, `hsla(${p.hue}, 70%, 55%, ${a * 0.35})`)
        grad.addColorStop(1, 'hsla(40, 60%, 40%, 0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `hsla(${p.hue}, 90%, 82%, ${a})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
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
    'repeating-linear-gradient(180deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 4px)',
}

const noiseStyle = {
  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.85  0 0 0 0 0.78  0 0 0 0 0.6  0 0 0 0.45 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
  backgroundSize: '160px 160px',
}

const hexGridStyle = {
  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='92' viewBox='0 0 80 92'><path d='M40 0 L80 23 L80 69 L40 92 L0 69 L0 23 Z' fill='none' stroke='rgba(200,160,80,0.28)' stroke-width='0.8'/></svg>")`,
  backgroundSize: '80px 92px',
}

type Props = {
  showRings?: boolean
  showCenterHalo?: boolean
  intensity?: 'full' | 'soft'
}

export default function AmbientBackdrop({
  showRings = true,
  showCenterHalo = true,
  intensity = 'full',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useNebulaParticles(canvasRef)

  const auroraOpacity = intensity === 'soft' ? 0.4 : 0.6
  const ringOpacity = intensity === 'soft' ? 0.55 : 1

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 30% 30%, rgba(255,140,40,0.16), transparent 45%), radial-gradient(ellipse at 75% 70%, rgba(255,80,40,0.12), transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(40,30,80,0.16), transparent 70%)',
        }}
      />

      <div className="absolute inset-0 opacity-[0.06]" style={hexGridStyle} />

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="aurora-layer absolute inset-0" style={{ opacity: auroraOpacity }} />

      {showRings && (
        <div
          className="ring-stage absolute inset-0 flex items-center justify-center"
          style={{ opacity: ringOpacity }}
        >
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="ring ring-3" />
        </div>
      )}

      {showCenterHalo && (
        <div
          className="absolute left-1/2 top-1/2 h-[680px] w-[680px] max-h-[90vw] max-w-[90vw] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(7,5,9,0.92) 0%, rgba(7,5,9,0.78) 28%, rgba(7,5,9,0.45) 52%, transparent 72%)',
          }}
        />
      )}

      <div className="absolute inset-0 mix-blend-overlay" style={scanlineStyle} />
      <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay" style={noiseStyle} />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 82%, rgba(0,0,0,0.92) 100%)',
        }}
      />

      <style>{`
        .aurora-layer {
          background:
            radial-gradient(ellipse 60% 40% at 20% 30%, rgba(255,184,74,0.22), transparent 60%),
            radial-gradient(ellipse 50% 35% at 80% 70%, rgba(255,90,58,0.18), transparent 60%),
            radial-gradient(ellipse 70% 50% at 50% 90%, rgba(120,80,200,0.14), transparent 60%);
          filter: blur(40px);
          animation: ambient-aurora-shift 22s ease-in-out infinite;
        }
        @keyframes ambient-aurora-shift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          33%      { transform: translate3d(-3%, 2%, 0) scale(1.04); }
          66%      { transform: translate3d(3%, -2%, 0) scale(0.98); }
        }

        .ring-stage .ring {
          position: absolute;
          border-radius: 9999px;
          border: 1px solid rgba(255,184,74,0.18);
          box-shadow: inset 0 0 60px rgba(255,184,74,0.05);
        }
        .ring-1 { width: 360px; height: 360px; animation: ambient-ring-pulse 6s ease-in-out infinite; }
        .ring-2 { width: 540px; height: 540px; animation: ambient-ring-pulse 8s ease-in-out infinite reverse; opacity: 0.55; }
        .ring-3 { width: 760px; height: 760px; animation: ambient-ring-pulse 10s ease-in-out infinite; opacity: 0.30; }
        @keyframes ambient-ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50%      { transform: scale(1.06); opacity: 0.35; }
        }
      `}</style>
    </div>
  )
}
