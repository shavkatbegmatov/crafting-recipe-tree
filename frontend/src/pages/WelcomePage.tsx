import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, LogIn, UserPlus } from 'lucide-react'
import AmbientBackdrop from '../components/layout/AmbientBackdrop'

const heroFontStyle = {
  fontFamily: "'Russo One', 'Inter', sans-serif",
} as const

export default function WelcomePage() {
  const { t } = useTranslation()
  const [glitch, setGlitch] = useState(false)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    let glitchTimer: ReturnType<typeof setTimeout>
    const scheduleGlitch = () => {
      const wait = 3200 + Math.random() * 5200
      glitchTimer = setTimeout(() => {
        setGlitch(true)
        setTimeout(() => setGlitch(false), 120 + Math.random() * 160)
        scheduleGlitch()
      }, wait)
    }
    scheduleGlitch()
    return () => clearTimeout(glitchTimer)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => !p), 1400)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#070509]">
      <AmbientBackdrop />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ffb84a] to-transparent"
        style={{ opacity: pulse ? 0.7 : 0.18, transition: 'opacity 700ms ease' }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff5a3a] to-transparent"
        style={{ opacity: pulse ? 0.18 : 0.6, transition: 'opacity 700ms ease' }}
      />

      <div className="pointer-events-none absolute left-6 top-6 z-10 flex items-center gap-2 rounded-full border border-[#3a3329]/70 bg-black/55 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.36em] text-[#a8916a] backdrop-blur-md">
        <span
          className="block h-1.5 w-1.5 rounded-full bg-[#ff5a3a] shadow-[0_0_10px_#ff5a3a]"
          style={{ opacity: pulse ? 1 : 0.35, transition: 'opacity 220ms ease' }}
        />
        <span>REC · {t('welcome.signalLive')}</span>
      </div>

      <div className="pointer-events-none absolute right-6 top-6 z-10 rounded-full border border-[#3a3329]/70 bg-black/55 px-3 py-1.5 text-right text-[10px] font-medium uppercase tracking-[0.36em] text-[#a8916a] backdrop-blur-md">
        SECTOR · 03 · {t('welcome.signalUnlock')}
      </div>

      <div className="pointer-events-none absolute left-6 bottom-6 z-10 text-[10px] font-mono uppercase tracking-[0.32em] text-[#6f5e44]">
        v.craft.tree // 24×7
      </div>

      <div className="pointer-events-none absolute right-6 bottom-6 z-10 text-right text-[10px] font-mono uppercase tracking-[0.32em] text-[#6f5e44]">
        ░░ FAN-PROJECT ░░
      </div>

      <div className="relative flex h-full w-full items-center justify-center px-6">
        <div className="relative w-full max-w-[820px] text-center">
          <div className="mb-7 flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.5em] text-[#c2a572]">
            <span className="h-px w-10 bg-[#c2a572]/55" />
            <span className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">{t('welcome.eyebrow')}</span>
            <span className="h-px w-10 bg-[#c2a572]/55" />
          </div>

          <h1
            style={heroFontStyle}
            data-text={t('welcome.title')}
            className={`relative text-[clamp(2.5rem,6.4vw,5.4rem)] leading-[1.0] tracking-[-0.02em] text-[#fbecc4] drop-shadow-[0_8px_32px_rgba(0,0,0,0.95)] [text-wrap:balance] ${
              glitch ? 'glitch-active' : ''
            }`}
          >
            {t('welcome.title')}
          </h1>

          <p className="mx-auto mt-6 max-w-[46ch] text-[0.95rem] leading-7 text-[#d3bd96] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            {t('welcome.tagline')}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              to="/login"
              className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border-2 border-[#ffb84a]/70 bg-[linear-gradient(135deg,#3d2a0c_0%,#6b4a16_50%,#3d2a0c_100%)] px-8 py-3.5 text-[0.95rem] font-semibold uppercase tracking-[0.22em] text-[#fff1cc] shadow-[0_0_30px_rgba(255,184,74,0.35),inset_0_1px_0_rgba(255,255,255,0.15)] transition-all duration-300 hover:border-[#ffd47a] hover:shadow-[0_0_50px_rgba(255,184,74,0.55),inset_0_1px_0_rgba(255,255,255,0.25)] active:scale-[0.98]"
            >
              <span className="absolute inset-0 translate-x-[-110%] bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.28),transparent)] transition-transform duration-700 group-hover:translate-x-[120%]" />
              <LogIn size={17} className="relative" />
              <span className="relative">{t('auth.login')}</span>
              <ArrowRight size={15} className="relative transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/register"
              className="inline-flex items-center gap-2.5 rounded-full border-2 border-[#5a4f3e]/80 bg-black/65 px-8 py-3.5 text-[0.95rem] font-semibold uppercase tracking-[0.22em] text-[#e8d4a8] backdrop-blur-md transition-all duration-300 hover:border-[#ffb84a]/55 hover:bg-black/80 hover:text-[#fff1cc] active:scale-[0.98]"
            >
              <UserPlus size={17} />
              <span>{t('auth.register')}</span>
            </Link>
          </div>

          <div className="mt-14 flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-[0.42em] text-[#5a4f3e]">
            <span className="h-px w-6 bg-[#5a4f3e]" />
            <span>// PRESS · ENTER</span>
            <span className="h-px w-6 bg-[#5a4f3e]" />
          </div>
        </div>
      </div>

      <style>{`
        h1.glitch-active {
          text-shadow:
            2px 0 0 rgba(255, 90, 58, 0.85),
            -2px 0 0 rgba(72, 200, 255, 0.85),
            0 8px 32px rgba(0,0,0,0.95);
          animation: welcome-glitch 140ms steps(2, end);
        }
        @keyframes welcome-glitch {
          0%   { transform: translate(0, 0); clip-path: inset(0 0 0 0); }
          25%  { transform: translate(-2px, 1px); clip-path: inset(18% 0 42% 0); }
          50%  { transform: translate(2px, -1px); clip-path: inset(48% 0 12% 0); }
          75%  { transform: translate(-1px, 2px); clip-path: inset(28% 0 58% 0); }
          100% { transform: translate(0, 0); clip-path: inset(0 0 0 0); }
        }
      `}</style>
    </div>
  )
}
