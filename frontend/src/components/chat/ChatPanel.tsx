import { useState, useRef, useEffect, useLayoutEffect, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import {
  MessageCircle, X, Send, Shield, Crown, Loader2, LogIn, Megaphone,
  Reply, Pencil, Trash2, CornerUpLeft, SmilePlus, Search,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useChat } from '../../hooks/useChat'
import { useAnnouncement } from '../../hooks/useAnnouncement'
import type { ChatMessageDto } from '../../api/chat'
import { searchChatMessages } from '../../api/chat'
import { avatarColor, initials } from '../../utils/avatarColor'

/* ────── helpers ────── */

const GROUP_WINDOW_MS = 5 * 60 * 1000

/** Tezkor reaksiya emojilari (picker'da ko'rsatiladi). */
const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉']

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

function sameGroup(a: ChatMessageDto, b: ChatMessageDto): boolean {
  return (
    a.username === b.username &&
    isSameDay(a.createdAt, b.createdAt) &&
    Math.abs(new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) < GROUP_WINDOW_MS
  )
}

const MENTION_RE = /(?<![A-Za-z0-9_])(@[A-Za-z0-9_]+)/g

/** Matndagi @username eslatmalarini oltin rangda ajratib ko'rsatadi. */
function renderContent(content: string) {
  return content.split(MENTION_RE).map((part, i) =>
    part.startsWith('@') && part.length > 1 ? (
      <span key={i} className="text-dark-gold font-medium">
        {part}
      </span>
    ) : (
      part
    ),
  )
}

/* ────── avatar ────── */

function Avatar({ name }: { name: string }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ring-1 ring-black/20"
      style={{ backgroundColor: avatarColor(name) }}
      title={name}
    >
      {initials(name)}
    </div>
  )
}

/* ────── one message row ────── */

function ChatRow({
  msg,
  isOwn,
  startGroup,
  endGroup,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: {
  msg: ChatMessageDto
  isOwn: boolean
  startGroup: boolean
  endGroup: boolean
  currentUser: string
  onReply: (m: ChatMessageDto) => void
  onEdit: (m: ChatMessageDto) => void
  onDelete: (m: ChatMessageDto) => void
  onReact: (messageId: number, emoji: string) => void
}) {
  const { t } = useTranslation()
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Picker tashqarisiga bosilganda yopiladi.
  useEffect(() => {
    if (!pickerOpen) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerOpen])

  const actions = (
    <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity self-center
      ${isOwn ? 'order-first' : ''}`}>
      <button
        onClick={() => onReply(msg)}
        title={t('chat.reply')}
        className="p-1 rounded text-[#8a7a60] hover:text-dark-gold hover:bg-dark-hover transition-colors"
      >
        <Reply size={13} />
      </button>
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setPickerOpen((v) => !v)}
          title={t('chat.react')}
          className="p-1 rounded text-[#8a7a60] hover:text-dark-gold hover:bg-dark-hover transition-colors"
        >
          <SmilePlus size={13} />
        </button>
        {pickerOpen && (
          <div
            className={`absolute z-20 bottom-full mb-1 flex gap-0.5 px-1.5 py-1 rounded-full
                        bg-dark-card border border-dark-border shadow-lg shadow-black/40
                        ${isOwn ? 'right-0' : 'left-0'}`}
          >
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => { onReact(msg.id, emoji); setPickerOpen(false) }}
                className="text-base leading-none p-1 rounded hover:bg-dark-hover hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
      {isOwn && (
        <>
          <button
            onClick={() => onEdit(msg)}
            title={t('chat.edit')}
            className="p-1 rounded text-[#8a7a60] hover:text-dark-gold hover:bg-dark-hover transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => onDelete(msg)}
            title={t('chat.delete')}
            className="p-1 rounded text-[#8a7a60] hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </>
      )}
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`group flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} ${startGroup ? 'mt-3' : 'mt-0.5'}`}
    >
      {!isOwn && (
        <div className="w-7 shrink-0 flex items-end">{endGroup && <Avatar name={msg.username} />}</div>
      )}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} min-w-0 max-w-[80%]`}>
        {!isOwn && startGroup && (
          <div className="flex items-center gap-1 mb-1 ml-1">
            <span className="text-xs font-medium" style={{ color: avatarColor(msg.username) }}>
              {msg.username}
            </span>
            {msg.role === 'ADMIN' && <Shield className="w-3 h-3 text-dark-gold" />}
            {msg.role === 'SUPER_ADMIN' && <Crown className="w-3 h-3 text-dark-gold" />}
          </div>
        )}

        <div className={`flex items-center gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
          <div
            className={`px-3 py-1.5 text-sm leading-relaxed break-words whitespace-pre-wrap ${
              isOwn
                ? `bg-dark-gold/20 text-dark-gold rounded-2xl ${endGroup ? 'rounded-br-md' : ''}`
                : `bg-dark-hover text-[#d4c4a0] rounded-2xl ${endGroup ? 'rounded-bl-md' : ''}`
            }`}
          >
            {/* Reply quote — javob berilgan xabar */}
            {msg.replyToId && (
              <div className="border-l-2 border-dark-gold/50 pl-1.5 mb-1 opacity-80">
                <span className="text-[10px] font-medium text-dark-gold">{msg.replyToUsername}</span>
                <p className="text-[10px] text-[#8a7a60] truncate max-w-[200px]">{msg.replyToContent}</p>
              </div>
            )}
            {renderContent(msg.content)}
            {msg.editedAt && (
              <span className="text-[9px] italic opacity-50 ml-1.5 select-none">({t('chat.edited')})</span>
            )}
          </div>
          {actions}
        </div>

        {/* Reaksiya chiplari — "men bosgan" oltin rangda */}
        {msg.reactions && msg.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {msg.reactions.map((r) => {
              const mine = r.users.includes(currentUser)
              return (
                <button
                  key={r.emoji}
                  onClick={() => onReact(msg.id, r.emoji)}
                  title={r.users.join(', ')}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] border transition-colors ${
                    mine
                      ? 'bg-dark-gold/20 border-dark-gold/40 text-dark-gold'
                      : 'bg-dark-hover border-dark-border text-[#8a7a60] hover:border-dark-gold/30'
                  }`}
                >
                  <span>{r.emoji}</span>
                  <span className="font-medium">{r.count}</span>
                </button>
              )
            })}
          </div>
        )}

        {endGroup && (
          <span className="text-[10px] text-[#8a7a60]/70 mt-0.5 mx-1 select-none">{formatTime(msg.createdAt)}</span>
        )}
      </div>
    </motion.div>
  )
}

/* ────── main panel ────── */

export default function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const {
    messages, connected, send, edit, remove, react, sendTyping,
    loadingHistory, loadingMore, hasMore, loadMore, onlineUsers, typingUsers,
  } = useChat(open)
  const { data: announcement } = useAnnouncement(open)

  const [draft, setDraft] = useState('')
  const [replyingTo, setReplyingTo] = useState<ChatMessageDto | null>(null)
  const [editing, setEditing] = useState<ChatMessageDto | null>(null)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionIndex, setMentionIndex] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ChatMessageDto[] | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevScrollHeight = useRef(0)

  // Yangi xabar — pastga; loadMore (prepend) — ko'rinishni joyida ushlab turamiz.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (prevScrollHeight.current > 0 && el) {
      el.scrollTop = el.scrollHeight - prevScrollHeight.current
      prevScrollHeight.current = 0
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, typingUsers])

  // Infinite-scroll: tepaga yaqinlashganda eski xabarlarni yuklash.
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el || searchResults !== null) return
    if (el.scrollTop < 60 && hasMore && !loadingMore) {
      prevScrollHeight.current = el.scrollHeight
      loadMore()
    }
  }

  // Qidiruv (300ms debounce). Panel yopilsa yoki bo'sh bo'lsa — natijalar tozalanadi.
  useEffect(() => {
    if (!searchOpen) { setSearchResults(null); return }
    const q = searchQuery.trim()
    if (!q) { setSearchResults(null); return }
    const id = setTimeout(() => {
      searchChatMessages(q).then(setSearchResults).catch(() => setSearchResults([]))
    }, 300)
    return () => clearTimeout(id)
  }, [searchQuery, searchOpen])

  useLayoutEffect(() => {
    const ta = taRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
    }
  }, [draft])

  useEffect(() => {
    if (open) setTimeout(() => taRef.current?.focus(), 300)
  }, [open])

  const startReply = (m: ChatMessageDto) => {
    setEditing(null)
    setReplyingTo(m)
    taRef.current?.focus()
  }

  const startEdit = (m: ChatMessageDto) => {
    setReplyingTo(null)
    setEditing(m)
    setDraft(m.content)
    taRef.current?.focus()
  }

  const cancelContext = () => {
    setReplyingTo(null)
    setEditing(null)
    if (editing) setDraft('')
  }

  const handleDelete = (m: ChatMessageDto) => {
    if (window.confirm(t('chat.confirmDelete'))) remove(m.id)
  }

  const handleSend = () => {
    if (!draft.trim() || !connected) return
    if (editing) {
      edit(editing.id, draft)
      setEditing(null)
    } else {
      send(draft, replyingTo?.id)
      setReplyingTo(null)
    }
    setDraft('')
  }

  // ── @mention autocomplete ──
  const mentionCandidates =
    mentionQuery !== null
      ? onlineUsers
          .filter((u) => u !== user?.username && u.toLowerCase().startsWith(mentionQuery.toLowerCase()))
          .slice(0, 5)
      : []

  /** Kursordan oldingi matnda tugallanmagan @so'z bo'lsa — picker uchun query o'rnatadi. */
  const detectMention = (ta: HTMLTextAreaElement) => {
    const cursor = ta.selectionStart ?? ta.value.length
    const m = ta.value.slice(0, cursor).match(/@([A-Za-z0-9_]*)$/)
    setMentionQuery(m ? m[1] : null)
    setMentionIndex(0)
  }

  /** Tanlangan username'ni @so'z o'rniga qo'yadi va kursorni undan keyinga o'tkazadi. */
  const insertMention = (username: string) => {
    const ta = taRef.current
    if (!ta) return
    const cursor = ta.selectionStart ?? draft.length
    const before = draft.slice(0, cursor).replace(/@([A-Za-z0-9_]*)$/, `@${username} `)
    const after = draft.slice(cursor)
    setDraft(before + after)
    setMentionQuery(null)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(before.length, before.length)
    })
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Mention picker ochiq bo'lsa — strelka/Enter/Tab navigatsiyani o'zlashtiradi.
    if (mentionQuery !== null && mentionCandidates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIndex((i) => (i + 1) % mentionCandidates.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIndex((i) => (i - 1 + mentionCandidates.length) % mentionCandidates.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(mentionCandidates[mentionIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setMentionQuery(null)
        return
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    } else if (e.key === 'Escape' && (replyingTo || editing)) {
      cancelContext()
    }
  }

  const othersTyping = typingUsers.filter((u) => u !== user?.username)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed bottom-20 right-4 sm:right-6 w-[340px] sm:w-[380px] h-[520px] max-h-[72vh]
                     bg-dark-card border border-dark-border rounded-2xl shadow-2xl shadow-black/40
                     flex flex-col z-50 overflow-hidden"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-border bg-dark-panel/50">
            <div className="flex items-center gap-2 min-w-0">
              <MessageCircle className="w-5 h-5 text-dark-gold shrink-0" />
              <span className="text-sm font-semibold text-dark-gold">{t('chat.title')}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 text-[10px] text-[#8a7a60]">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-amber-400 animate-pulse'}`}
                />
                {connected ? t('chat.onlineCount', { count: onlineUsers.length }) : t('chat.connecting')}
              </span>
              <button
                onClick={() => setSearchOpen((v) => !v)}
                className={`p-1 rounded-lg hover:bg-dark-hover transition-colors ${
                  searchOpen ? 'text-dark-gold' : 'text-[#8a7a60] hover:text-dark-gold'
                }`}
                aria-label={t('chat.search')}
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-dark-hover transition-colors text-[#8a7a60] hover:text-dark-gold"
                aria-label={t('common.back')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Qidiruv paneli ── */}
          {searchOpen && (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-dark-border bg-dark-panel/30 shrink-0">
              <Search className="w-3.5 h-3.5 text-[#8a7a60] shrink-0" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('chat.searchPlaceholder')}
                className="flex-1 bg-transparent text-xs text-[#d4c4a0] placeholder:text-[#8a7a60]/50 focus:outline-none"
              />
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                className="p-0.5 rounded text-[#8a7a60] hover:text-dark-gold transition-colors"
                aria-label={t('chat.cancel')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* ── Pinned e'lon ── */}
          {announcement?.message && (
            <div className="flex items-start gap-2 px-3 py-2 bg-dark-gold/10 border-b border-dark-gold/20 shrink-0">
              <Megaphone className="w-3.5 h-3.5 text-dark-gold shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#d4c4a0] leading-snug break-words">{announcement.message}</p>
            </div>
          )}

          {/* ── Messages / qidiruv natijalari ── */}
          <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
            {searchResults !== null ? (
              searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[#8a7a60] text-sm">
                  <Search className="w-10 h-10 mb-3 opacity-30" />
                  <p>{t('chat.searchEmpty')}</p>
                </div>
              ) : (
                searchResults.map((msg) => (
                  <div key={msg.id} className="px-2 py-1.5 rounded-lg hover:bg-dark-hover mb-0.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-medium" style={{ color: avatarColor(msg.username) }}>
                        {msg.username}
                      </span>
                      <span className="text-[9px] text-[#8a7a60]">{formatTime(msg.createdAt)}</span>
                    </div>
                    <p className="text-xs text-[#d4c4a0] break-words whitespace-pre-wrap">
                      {renderContent(msg.content)}
                    </p>
                  </div>
                ))
              )
            ) : (
              <>
            {loadingMore && (
              <div className="flex justify-center py-2">
                <Loader2 className="w-4 h-4 text-dark-gold animate-spin" />
              </div>
            )}
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
              const prev = i > 0 ? messages[i - 1] : null
              const next = i < messages.length - 1 ? messages[i + 1] : null
              const isOwn = msg.username === user?.username
              const showDate = !prev || !isSameDay(prev.createdAt, msg.createdAt)
              const startGroup = showDate || !prev || !sameGroup(prev, msg)
              const endGroup = !next || !sameGroup(msg, next)
              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex justify-center my-3">
                      <span className="text-[10px] text-[#8a7a60] bg-dark-panel/60 px-3 py-1 rounded-full">
                        {formatDateSeparator(msg.createdAt, i18n.language)}
                      </span>
                    </div>
                  )}
                  <ChatRow
                    msg={msg}
                    isOwn={isOwn}
                    startGroup={startGroup}
                    endGroup={endGroup}
                    currentUser={user?.username ?? ''}
                    onReply={startReply}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                    onReact={react}
                  />
                </div>
              )
            })}

            {/* "Yozmoqda" indikatori */}
            {othersTyping.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 ml-9 text-[11px] text-[#8a7a60] italic">
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-[#8a7a60] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-[#8a7a60] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 rounded-full bg-[#8a7a60] animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
                {othersTyping.length === 1
                  ? t('chat.typingOne', { name: othersTyping[0] })
                  : t('chat.typingMany', { count: othersTyping.length })}
              </div>
            )}

            <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* ── Input ── */}
          <div className="border-t border-dark-border px-3 py-3 bg-dark-panel/30">
            {/* Reply / edit konteksti */}
            {(replyingTo || editing) && (
              <div className="flex items-center gap-2 mb-2 px-2.5 py-1.5 rounded-lg bg-dark-bg border-l-2 border-dark-gold/50">
                <CornerUpLeft className="w-3.5 h-3.5 text-dark-gold shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-medium text-dark-gold">
                    {editing ? t('chat.editing') : t('chat.replyingTo', { name: replyingTo?.username })}
                  </span>
                  <p className="text-[10px] text-[#8a7a60] truncate">
                    {editing ? editing.content : replyingTo?.content}
                  </p>
                </div>
                <button
                  onClick={cancelContext}
                  className="p-1 rounded text-[#8a7a60] hover:text-[#d4c4a0] transition-colors shrink-0"
                  aria-label={t('chat.cancel')}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {user ? (
              <div className="relative flex items-end gap-2">
                {/* @mention autocomplete dropdown */}
                {mentionQuery !== null && mentionCandidates.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-1 w-48 bg-dark-card border border-dark-border
                                  rounded-lg shadow-xl shadow-black/40 overflow-hidden z-30">
                    {mentionCandidates.map((u, idx) => (
                      <button
                        key={u}
                        onClick={() => insertMention(u)}
                        onMouseEnter={() => setMentionIndex(idx)}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors ${
                          idx === mentionIndex ? 'bg-dark-gold/20 text-dark-gold' : 'text-[#d4c4a0] hover:bg-dark-hover'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                          style={{ backgroundColor: avatarColor(u) }}
                        >
                          {initials(u)}
                        </span>
                        <span className="truncate">{u}</span>
                      </button>
                    ))}
                  </div>
                )}
                <textarea
                  ref={taRef}
                  rows={1}
                  value={draft}
                  onChange={(e) => { setDraft(e.target.value); sendTyping(); detectMention(e.target) }}
                  onKeyDown={handleKeyDown}
                  maxLength={2000}
                  placeholder={t('chat.placeholder')}
                  disabled={!connected}
                  className="flex-1 resize-none bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-sm
                             text-[#d4c4a0] placeholder:text-[#8a7a60]/50 leading-relaxed
                             focus:outline-none focus:border-dark-gold/40 transition-colors
                             disabled:opacity-50 scrollbar-thin"
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || !connected}
                  className="p-2 rounded-xl bg-dark-gold/20 text-dark-gold shrink-0
                             hover:bg-dark-gold/30 transition-colors
                             disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label={t('chat.send')}
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
