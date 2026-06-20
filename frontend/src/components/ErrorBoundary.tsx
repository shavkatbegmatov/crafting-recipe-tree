import { Component, type ErrorInfo, type ReactNode } from 'react'
import i18n from '../i18n'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Render paytidagi kutilmagan xatoni ushlaydi va butun ilova "oq ekran" bo'lib qolishini
 * oldini oladi — o'rniga tiklash tugmasi bilan zaxira UI ko'rsatadi.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Diagnostika uchun konsolga — kelajakda bu yerda Sentry kabi xizmatga yuborilishi mumkin.
    console.error('ErrorBoundary ushladi:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
          <div className="text-center max-w-md">
            <h1 className="text-lg font-semibold text-skin-base mb-2">
              {i18n.t('errorBoundary.title')}
            </h1>
            <p className="text-sm text-skin-muted mb-5">{i18n.t('errorBoundary.message')}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg
                bg-dark-gold/20 text-dark-gold border border-dark-gold/40 hover:bg-dark-gold/30 transition-colors"
            >
              {i18n.t('errorBoundary.reload')}
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
