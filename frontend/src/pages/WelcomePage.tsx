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

const heroTitleStyle = {
  fontFamily: "'Russo One', 'Inter', sans-serif",
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
    <div className="relative h-full overflow-hidden bg-dark-bg">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,160,80,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(200,160,80,0.05),transparent_24%)]" />

      <div className="relative mx-auto h-full max-w-[1720px] px-4 py-4 sm:px-6 lg:px-8 xl:px-8 xl:py-5 2xl:px-10 2xl:py-6">
        <div className="grid h-full gap-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(390px,0.7fr)] 2xl:grid-cols-[minmax(0,1.48fr)_minmax(430px,0.66fr)] 2xl:gap-6">
          <section className="relative overflow-hidden rounded-[34px] border border-dark-border/70 bg-dark-card/80 shadow-[0_24px_90px_rgba(0,0,0,0.40)] xl:h-full">
            <img
              src="/images/welcome/erz-station-hero.svg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[62%_50%] opacity-[0.98]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,6,8,0.92)_0%,rgba(7,6,8,0.78)_34%,rgba(7,6,8,0.42)_58%,rgba(7,6,8,0.16)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,191,90,0.08)_0%,transparent_28%,transparent_72%,rgba(7,6,8,0.54)_100%)]" />
            <div className="absolute inset-0 opacity-[0.09]" style={gridOverlay} />
            <div className="absolute left-[57%] top-[15%] h-40 w-40 rounded-full bg-[#79a5ff]/20 blur-3xl" />
            <div className="absolute right-[12%] bottom-[10%] h-36 w-36 rounded-full bg-[#f0c266]/8 blur-3xl" />

            <div className="relative flex min-h-[500px] flex-col justify-between p-5 sm:p-6 lg:p-7 xl:h-full xl:min-h-0 xl:p-7 2xl:p-8">
              <div className="max-w-[720px] rounded-[32px] border border-white/6 bg-[linear-gradient(180deg,rgba(14,11,9,0.86),rgba(14,11,9,0.68))] px-5 py-5 shadow-[0_24px_60px_rgba(0,0,0,0.36)] backdrop-blur-[4px] sm:px-6 sm:py-5 xl:max-w-[760px] xl:px-7 xl:py-6 2xl:max-w-[820px] 2xl:px-8 2xl:py-6">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-red-300">
                    {t('welcome.statusAlert')}
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-dark-gold/15 bg-dark-gold/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.28em] text-dark-gold/90">
                    <Crosshair size={12} />
                    {t('welcome.eyebrow')}
                  </div>
                </div>

                <h1
                  style={heroTitleStyle}
                  className="mt-5 max-w-[12ch] text-[clamp(2.2rem,3.25vw,3.75rem)] leading-[1.03] tracking-[-0.03em] text-[#f4e4bf] drop-shadow-[0_8px_24px_rgba(0,0,0,0.48)] [text-wrap:balance] 2xl:max-w-[12.5ch]"
                >
                  {t('welcome.title')}
                </h1>
                <p className="mt-4 max-w-[58ch] text-[0.92rem] leading-6 text-[#d2bb95] drop-shadow-[0_4px_16px_rgba(0,0,0,0.35)] xl:text-[0.95rem] xl:leading-6 2xl:max-w-[60ch] 2xl:text-[0.98rem]">
                  {t('welcome.description')}
                </p>

                <div className="mt-5 flex max-w-[760px] flex-wrap gap-2 xl:max-w-[840px] 2xl:max-w-[900px]">
                  {signalItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <div
                        key={item.labelKey}
                        className="inline-flex items-center gap-2 rounded-full border border-dark-border/75 bg-black/30 px-4 py-2 text-[11px] font-medium text-[#ead7b4] backdrop-blur-sm"
                      >
                        <Icon size={14} className="text-dark-gold" />
                        <span>{t(item.labelKey)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid max-w-[820px] gap-3 sm:grid-cols-3 xl:max-w-[860px]">
                {terrainStats.map((item) => (
                  <div
                    key={item.labelKey}
                    className="rounded-2xl border border-dark-border/70 bg-black/26 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm"
                  >
                    <p className="text-[1.45rem] font-semibold text-[#f4e4bf] xl:text-[1.58rem]">{t(item.valueKey)}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-[#9f8b6d] xl:text-[10.5px]">
                      {t(item.labelKey)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[30px] border border-dark-border/75 bg-dark-card/85 shadow-[0_20px_70px_rgba(0,0,0,0.38)] backdrop-blur-sm xl:h-full">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,160,80,0.12),transparent_42%)]" />
            <div className="absolute right-[-14%] top-[-10%] h-56 w-56 rounded-full border border-dark-gold/10" />
            <div className="absolute right-[-6%] top-[12%] h-40 w-40 rounded-full border border-dark-gold/10" />

            <div className="relative flex h-full min-h-[500px] flex-col gap-4 p-5 sm:p-6 xl:min-h-0 xl:p-6 2xl:p-7">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-dark-gold/15 bg-dark-gold/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-dark-gold/90">
                  <LockKeyhole size={12} />
                  {t('welcome.panelEyebrow')}
                </div>

                <h2 className="mt-3.5 max-w-[14ch] text-[1.65rem] font-semibold leading-[1.12] text-[#f3e0b5] xl:text-[1.8rem] 2xl:text-[1.95rem]">
                  {t('welcome.panelTitle')}
                </h2>
                <p className="mt-2.5 max-w-[38ch] text-[0.9rem] leading-6 text-[#b19d80]">
                  {t('welcome.panelDescription')}
                </p>
              </div>

              <div className="grid gap-2.5">
                {featureItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.titleKey}
                      className="rounded-2xl border border-dark-border/75 bg-black/15 p-3.5 xl:p-3.5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-dark-gold/10 text-dark-gold">
                          <Icon size={17} />
                        </div>
                        <div>
                          <h3 className="text-[0.95rem] font-semibold leading-5 text-[#f0dfb8]">
                            {t(item.titleKey)}
                          </h3>
                          <p className="mt-1.5 text-[0.88rem] leading-6 text-[#a69479]">
                            {t(item.descriptionKey)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="rounded-[28px] border border-dark-gold/20 bg-[linear-gradient(180deg,rgba(200,160,80,0.10),rgba(200,160,80,0.04))] p-4 xl:p-[18px]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-dark-gold/20 bg-dark-gold/10 text-dark-gold">
                    <Boxes size={20} />
                  </div>
                  <div>
                    <p className="text-[0.95rem] font-semibold text-[#f0dfb8]">
                      {t('welcome.lockedTitle')}
                    </p>
                    <p className="mt-1 text-[0.87rem] leading-5 text-[#9b886b]">
                      {t('welcome.lockedDescription')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-auto grid gap-3 sm:grid-cols-2">
                <Link
                  to="/login"
                  className="group flex items-center justify-center gap-2 rounded-2xl border border-dark-gold/35 bg-gradient-to-r from-dark-gold/25 via-dark-gold/18 to-dark-gold/25 px-4 py-3 text-sm font-semibold text-dark-gold transition-all duration-200 hover:border-dark-gold/55 hover:from-dark-gold/35 hover:to-dark-gold/30"
                >
                  <LogIn size={16} />
                  <span>{t('auth.login')}</span>
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/register"
                  className="flex items-center justify-center gap-2 rounded-2xl border border-dark-border/80 bg-black/10 px-4 py-3 text-sm font-medium text-[#d4c4a0] transition-all duration-200 hover:border-dark-gold/35 hover:bg-dark-hover hover:text-[#f0dfb8]"
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
