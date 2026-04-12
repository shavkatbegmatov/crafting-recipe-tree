import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  Boxes,
  Crosshair,
  Layers3,
  LockKeyhole,
  LogIn,
  Pickaxe,
  Radio,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react'

const gridOverlay = {
  backgroundImage: `
    linear-gradient(rgba(200,160,80,0.09) 1px, transparent 1px),
    linear-gradient(90deg, rgba(200,160,80,0.09) 1px, transparent 1px)
  `,
  backgroundSize: '54px 54px',
}

const routeTrail = {
  background:
    'linear-gradient(135deg, rgba(230,171,70,0) 0%, rgba(230,171,70,0.1) 28%, rgba(230,171,70,0.68) 48%, rgba(255,235,199,0.92) 50%, rgba(230,171,70,0.64) 52%, rgba(230,171,70,0.06) 72%, rgba(230,171,70,0) 100%)',
}

const violetZone = {
  background:
    'radial-gradient(circle at 30% 30%, rgba(230,182,255,0.32), rgba(162,70,196,0.52) 45%, rgba(98,30,126,0.88) 100%)',
}

const terrainNoise = {
  background:
    'radial-gradient(circle at 20% 28%, rgba(214,152,64,0.20), transparent 24%), radial-gradient(circle at 52% 62%, rgba(255,205,130,0.12), transparent 20%), radial-gradient(circle at 78% 38%, rgba(0,0,0,0.24), transparent 24%), linear-gradient(145deg, rgba(96,64,40,0.90), rgba(33,24,18,0.88))',
}

const voidTerrain = {
  background:
    'radial-gradient(circle at 55% 42%, rgba(255,255,255,0.07), transparent 14%), radial-gradient(circle at 70% 68%, rgba(255,255,255,0.05), transparent 12%), linear-gradient(165deg, rgba(28,26,28,0.96), rgba(7,7,9,0.98))',
}

const signalItems: Array<{ icon: LucideIcon; labelKey: string }> = [
  { icon: ShieldCheck, labelKey: 'welcome.signalSecure' },
  { icon: Sparkles, labelKey: 'welcome.signalZones' },
  { icon: LockKeyhole, labelKey: 'welcome.signalUnlock' },
]

const featureItems: Array<{ icon: LucideIcon; titleKey: string; descriptionKey: string }> = [
  {
    icon: Crosshair,
    titleKey: 'welcome.featureRouteTitle',
    descriptionKey: 'welcome.featureRouteDescription',
  },
  {
    icon: Layers3,
    titleKey: 'welcome.featureForecastTitle',
    descriptionKey: 'welcome.featureForecastDescription',
  },
  {
    icon: Radio,
    titleKey: 'welcome.featureControlTitle',
    descriptionKey: 'welcome.featureControlDescription',
  },
]

const terrainStats = [
  { valueKey: 'welcome.statRiskValue', labelKey: 'welcome.statRiskLabel' },
  { valueKey: 'welcome.statOreValue', labelKey: 'welcome.statOreLabel' },
  { valueKey: 'welcome.statGridValue', labelKey: 'welcome.statGridLabel' },
]

export default function WelcomePage() {
  const { t } = useTranslation()

  return (
    <div className="relative min-h-full overflow-hidden bg-dark-bg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,160,80,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(114,50,145,0.08),transparent_24%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="relative overflow-hidden rounded-[34px] border border-dark-border/70 bg-dark-card/80 shadow-[0_24px_90px_rgba(0,0,0,0.40)]">
            <div className="absolute inset-0 opacity-[0.12]" style={gridOverlay} />
            <div className="absolute inset-y-0 left-0 w-[56%]" style={terrainNoise} />
            <div className="absolute inset-y-0 right-0 w-[48%]" style={voidTerrain} />
            <div className="absolute inset-y-0 left-[45%] w-[15%] opacity-95" style={routeTrail} />

            <div
              className="absolute left-[11%] bottom-[10%] h-[34%] w-[21%] rounded-[34%] opacity-80 blur-[1px]"
              style={violetZone}
            />
            <div
              className="absolute right-[16%] top-[18%] h-[26%] w-[18%] rounded-[36%] opacity-80 blur-[1px]"
              style={violetZone}
            />

            <div className="absolute left-[18%] top-[58%] h-24 w-24 rounded-3xl border border-dark-gold/35 bg-black/25 shadow-[0_0_35px_rgba(230,171,70,0.18)] backdrop-blur-sm" />
            <div className="absolute left-[18.8%] top-[59.5%] flex h-20 w-20 items-center justify-center rounded-[28px] border border-dark-gold/25 bg-dark-card/80 text-dark-gold">
              <Boxes size={34} />
            </div>

            <div className="absolute left-[48.5%] top-[46%] h-16 w-16 rounded-full bg-white/80 blur-xl" />
            <div className="absolute left-[49.5%] top-[47.5%] flex h-10 w-10 items-center justify-center rounded-full border border-[#fff2d0]/70 bg-[#fff7e0] text-[#8c6430] shadow-[0_0_28px_rgba(255,244,204,0.85)]">
              <Pickaxe size={18} />
            </div>

            <div className="absolute left-6 top-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-red-300">
              {t('welcome.statusAlert')}
            </div>

            <div className="relative flex min-h-[560px] flex-col justify-between p-6 sm:p-8 lg:p-10">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-dark-gold/15 bg-dark-gold/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.28em] text-dark-gold/90">
                  <Crosshair size={12} />
                  {t('welcome.eyebrow')}
                </div>
                <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.02] tracking-tight text-[#f4e4bf] sm:text-5xl lg:text-[4.25rem]">
                  {t('welcome.title')}
                </h1>
                <p className="mt-5 max-w-xl text-sm leading-7 text-[#b6a180] sm:text-base">
                  {t('welcome.description')}
                </p>
              </div>

              <div className="space-y-5">
                <div className="flex flex-wrap gap-2.5">
                  {signalItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <div
                        key={item.labelKey}
                        className="inline-flex items-center gap-2 rounded-full border border-dark-border/75 bg-black/20 px-4 py-2 text-xs font-medium text-[#d9c7a4] backdrop-blur-sm"
                      >
                        <Icon size={14} className="text-dark-gold" />
                        <span>{t(item.labelKey)}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {terrainStats.map((item) => (
                    <div
                      key={item.labelKey}
                      className="rounded-2xl border border-dark-border/70 bg-black/18 px-4 py-3 backdrop-blur-sm"
                    >
                      <p className="text-xl font-semibold text-[#f4e4bf]">{t(item.valueKey)}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-[#8a7a60]">
                        {t(item.labelKey)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[30px] border border-dark-border/75 bg-dark-card/85 shadow-[0_20px_70px_rgba(0,0,0,0.38)] backdrop-blur-sm">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,160,80,0.12),transparent_42%)]" />
            <div className="absolute right-[-14%] top-[-10%] h-56 w-56 rounded-full border border-dark-gold/10" />
            <div className="absolute right-[-6%] top-[12%] h-40 w-40 rounded-full border border-dark-gold/10" />

            <div className="relative flex h-full flex-col gap-8 p-6 sm:p-8">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-dark-gold/15 bg-dark-gold/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-dark-gold/90">
                  <LockKeyhole size={12} />
                  {t('welcome.panelEyebrow')}
                </div>

                <h2 className="mt-5 text-3xl font-semibold leading-tight text-[#f3e0b5]">
                  {t('welcome.panelTitle')}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#a28f72]">
                  {t('welcome.panelDescription')}
                </p>
              </div>

              <div className="space-y-3">
                {featureItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.titleKey}
                      className="rounded-2xl border border-dark-border/75 bg-black/15 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-dark-gold/10 text-dark-gold">
                          <Icon size={18} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[#f0dfb8]">
                            {t(item.titleKey)}
                          </h3>
                          <p className="mt-1.5 text-sm leading-6 text-[#8f7f66]">
                            {t(item.descriptionKey)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="rounded-[28px] border border-dark-gold/20 bg-[linear-gradient(180deg,rgba(200,160,80,0.10),rgba(200,160,80,0.04))] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dark-gold/20 bg-dark-gold/10 text-dark-gold">
                    <Boxes size={22} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#f0dfb8]">
                      {t('welcome.lockedTitle')}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#9b886b]">
                      {t('welcome.lockedDescription')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-auto grid gap-3 sm:grid-cols-2">
                <Link
                  to="/login"
                  className="group flex items-center justify-center gap-2 rounded-2xl border border-dark-gold/35 bg-gradient-to-r from-dark-gold/25 via-dark-gold/18 to-dark-gold/25 px-4 py-3.5 text-sm font-semibold text-dark-gold transition-all duration-200 hover:border-dark-gold/55 hover:from-dark-gold/35 hover:to-dark-gold/30"
                >
                  <LogIn size={16} />
                  <span>{t('auth.login')}</span>
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center gap-2 rounded-2xl border border-dark-border/80 bg-black/10 px-4 py-3.5 text-sm font-medium text-[#d4c4a0] transition-all duration-200 hover:border-dark-gold/35 hover:bg-dark-hover hover:text-[#f0dfb8]"
                >
                  <UserPlus size={16} className="text-dark-gold" />
                  <span>{t('auth.register')}</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
