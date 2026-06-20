import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, ShieldQuestion, ShieldCheck, XCircle, Check, AtSign } from 'lucide-react'
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useNotificationSocket,
} from '../../hooks/useNotifications'
import type { AppNotification, NotificationType } from '../../api/notifications'

const ICONS: Record<NotificationType, { Icon: typeof Bell; cls: string }> = {
  ACCESS_REQUEST_SUBMITTED: { Icon: ShieldQuestion, cls: 'text-dark-gold' },
  ACCESS_REQUEST_APPROVED: { Icon: ShieldCheck, cls: 'text-green-400' },
  ACCESS_REQUEST_REJECTED: { Icon: XCircle, cls: 'text-red-400' },
  CHAT_MENTION: { Icon: AtSign, cls: 'text-dark-gold' },
}

/** Header'dagi bildirishnoma qo'ng'irog'i: o'qilmagan badge + dropdown ro'yxat. */
export default function NotificationBell() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Shaxsiy WebSocket kanalga ulanish (yangi bildirishnoma → querylar yangilanadi).
  useNotificationSocket(true)

  const { data: unread } = useUnreadCount()
  const { data: page } = useNotifications(0, 20)
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // Ochilganda boshqa menyularga (profil, til) "yopil" signalini beramiz
  useEffect(() => {
    if (open) window.dispatchEvent(new CustomEvent('app:menu-open', { detail: 'notif' }))
  }, [open])

  // Boshqa menyu ochilsa bu dropdownni yopamiz — bir vaqtda faqat bittasi ochiq turadi
  useEffect(() => {
    function onOtherOpen(e: Event) {
      if ((e as CustomEvent).detail !== 'notif') setOpen(false)
    }
    window.addEventListener('app:menu-open', onOtherOpen)
    return () => window.removeEventListener('app:menu-open', onOtherOpen)
  }, [])

  const items = page?.content ?? []
  const unreadCount = unread ?? 0

  function handleClick(n: AppNotification) {
    if (!n.read) markRead.mutate(n.id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <>
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t('notification.title')}
        className="relative p-1.5 rounded-lg text-skin-muted hover:text-dark-gold hover:bg-dark-hover/60 transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-bold rounded-full bg-red-500 text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="notif-panel"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 w-80 bg-dark-card border border-dark-border
              rounded-xl shadow-2xl shadow-black/50 z-[60] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-dark-border">
              <span className="text-sm font-semibold text-skin-base">{t('notification.title')}</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAll.mutate()}
                  className="flex items-center gap-1 text-[10px] text-skin-muted hover:text-dark-gold transition-colors"
                >
                  <Check className="w-3 h-3" />
                  {t('notification.markAllRead')}
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <div className="py-8 text-center text-xs text-skin-dark">{t('notification.empty')}</div>
              ) : (
                items.map((n) => {
                  const cfg = ICONS[n.type] ?? { Icon: Bell, cls: 'text-skin-muted' }
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full flex items-start gap-2.5 px-4 py-2.5 text-left hover:bg-dark-hover
                        transition-colors border-b border-dark-border/40 ${!n.read ? 'bg-dark-gold/5' : ''}`}
                    >
                      <cfg.Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.cls}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-skin-base leading-snug">
                          {t(`notification.type.${n.type}`, { actor: n.actorUsername ?? '' })}
                        </p>
                        <p className="text-[10px] text-skin-muted mt-0.5">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-dark-gold shrink-0 mt-1.5" />}
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

      {/* Backdrop — ref konteyneridan TASHQARIDA. Shunda tashqi-klik useEffect (mousedown)
          uni "tashqari" deb biladi va dropdownni darhol yopadi (backdrop o'z onClick'iga ham ega). */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="notif-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            className="fixed inset-x-0 bottom-0 top-14 z-50 bg-black/40"
          />
        )}
      </AnimatePresence>
    </>
  )
}
