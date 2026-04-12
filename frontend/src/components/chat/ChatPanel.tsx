import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import {
  MessageCircle,
  X,
  Send,
  Wifi,
  WifiOff,
  Shield,
  Loader2,
  LogIn,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useChat } from '../../hooks/useChat'
import type { ChatMessageDto } from '../../api/chat'

/* ────── helpers ────── */

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDateSeparator(iso: string, locale: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()

  if (isToday) return locale === 'ru' ? 'Сегодня' : locale.startsWith('uz') ? 'Bugun' : 'Today'
  if (isYesterday) return locale === 'ru' ? 'Вчера' : locale.startsWith('uz') ? 'Kecha' : 'Yesterday'
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

/* ────── single message ────── */

function ChatMsg({ msg, isOwn }: { msg: ChatMessageDto; isOwn: boolean }) {
  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group`}>
      {/* Name + role */}
      {!isOwn && (
        <div className="flex items-center gap-1 mb-0.5 ml-1">
          <span className="text-xs font-medium text-dark-gold/80">{msg.username}</span>
          {msg.role === 'ADMIN' && (
            <Shield className="w-3 h-3 text-dark-gold" />
          )}
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap ${
          isOwn
            ? 'bg-dark-gold/20 text-dark-gold rounded-br-md'
            : 'bg-dark-hover text-[#d4c4a0] rounded-bl-md'
        }`}
      >
        {msg.content}
      </div>

      {/* Time */}
      <span className="text-[10px] text-[#8a7a60]/60 mt-0.5 mx-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {formatTime(msg.createdAt)}
      </span>
    </div>
  )
}

/* ────── main panel ────── */

export default function ChatPanel({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { messages, connected, send, loadingHistory } = useChat(open)

  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [open])

  const handleSend = () => {
    if (!draft.trim() || !connected) return
    send(draft)
    setDraft('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed bottom-20 right-4 sm:right-6 w-[340px] sm:w-[380px] h-[500px] max-h-[70vh]
                     bg-dark-card border border-dark-border rounded-2xl shadow-2xl shadow-black/40
                     flex flex-col z-50 overflow-hidden"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border bg-dark-panel/50">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-dark-gold" />
              <span className="text-sm font-semibold text-dark-gold">{t('chat.title')}</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Connection indicator */}
              {connected ? (
                <Wifi className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-dark-hover transition-colors text-[#8a7a60] hover:text-dark-gold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin">
            {loadingHistory && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 text-dark-gold animate-spin" />
              </div>
            )}

            {!loadingHistory && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-[#8a7a60] text-sm">
                <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
                <p>{t('chat.empty')}</p>
              </div>
            )}

            {messages.map((msg, i) => {
              const showDate =
                i === 0 || !isSameDay(messages[i - 1].createdAt, msg.createdAt)
              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-3">
                      <span className="text-[10px] text-[#8a7a60] bg-dark-panel/60 px-3 py-1 rounded-full">
                        {formatDateSeparator(msg.createdAt, i18n.language)}
                      </span>
                    </div>
                  )}
                  <ChatMsg msg={msg} isOwn={msg.username === user?.username} />
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* ── Input ── */}
          <div className="border-t border-dark-border px-3 py-3 bg-dark-panel/30">
            {user ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={2000}
                  placeholder={t('chat.placeholder')}
                  disabled={!connected}
                  className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-sm
                             text-[#d4c4a0] placeholder:text-[#8a7a60]/50
                             focus:outline-none focus:border-dark-gold/40 transition-colors
                             disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || !connected}
                  className="p-2 rounded-xl bg-dark-gold/20 text-dark-gold
                             hover:bg-dark-gold/30 transition-colors
                             disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 py-1 text-[#8a7a60] text-sm">
                <LogIn className="w-4 h-4" />
                <span>{t('chat.loginRequired')}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
