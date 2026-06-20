import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Client } from '@stomp/stompjs'
import type { ChatMessageDto, ReactionGroup } from '../api/chat'
import { fetchChatHistory, fetchOnline } from '../api/chat'
import { getWsUrl } from '../utils/wsUrl'

interface UseChatReturn {
  messages: ChatMessageDto[]
  connected: boolean
  send: (content: string, replyToId?: number | null, attachmentId?: number | null) => void
  edit: (id: number, content: string) => void
  remove: (id: number) => void
  react: (messageId: number, emoji: string) => void
  sendTyping: () => void
  loadingHistory: boolean
  loadingMore: boolean
  hasMore: boolean
  loadMore: () => void
  onlineUsers: string[]
  typingUsers: string[]
}

export function useChat(active: boolean): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessageDto[]>([])
  const [connected, setConnected] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const qc = useQueryClient()
  const clientRef = useRef<Client | null>(null)
  const typingTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    if (!active) {
      if (clientRef.current?.active) {
        clientRef.current.deactivate()
        clientRef.current = null
      }
      setConnected(false)
      setOnlineUsers([])
      setTypingUsers([])
      return
    }

    let cancelled = false

    setLoadingHistory(true)
    setHasMore(true)
    fetchChatHistory(50)
      .then((history) => { if (!cancelled) { setMessages(history); setHasMore(history.length >= 50) } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingHistory(false) })

    const token = localStorage.getItem('token')
    const stompClient = new Client({
      brokerURL: getWsUrl(),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        if (cancelled) return
        setConnected(true)

        stompClient.subscribe('/topic/chat', (frame) => {
          const msg: ChatMessageDto = JSON.parse(frame.body)
          setMessages((prev) => [...prev, msg])
        })

        // Xabar tahrirlandi — mavjudini almashtiramiz (edited belgi + yangi matn).
        stompClient.subscribe('/topic/chat.edited', (frame) => {
          const msg: ChatMessageDto = JSON.parse(frame.body)
          setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)))
        })

        stompClient.subscribe('/topic/chat.presence', (frame) => {
          const presence = JSON.parse(frame.body) as { users: string[] }
          if (!cancelled) setOnlineUsers(presence.users)
        })

        // O'chirildi (o'z yoki moderatsiya) — real-vaqtda barchadan olib tashlash.
        stompClient.subscribe('/topic/chat.deleted', (frame) => {
          const { id } = JSON.parse(frame.body) as { id: number }
          setMessages((prev) => prev.filter((m) => m.id !== id))
        })

        // Reaksiya o'zgardi — faqat o'sha xabarning reactions'ini almashtiramiz.
        stompClient.subscribe('/topic/chat.reaction', (frame) => {
          const { messageId, reactions } = JSON.parse(frame.body) as {
            messageId: number
            reactions: ReactionGroup[]
          }
          setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)))
        })

        // "Yozmoqda" — 3 soniya ko'rsatib, signal kelmasa o'chiramiz.
        stompClient.subscribe('/topic/chat.typing', (frame) => {
          const { username } = JSON.parse(frame.body) as { username: string }
          if (cancelled) return
          setTypingUsers((prev) => (prev.includes(username) ? prev : [...prev, username]))
          clearTimeout(typingTimers.current[username])
          typingTimers.current[username] = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u !== username))
          }, 3000)
        })

        stompClient.subscribe('/topic/chat.announcement', () => {
          qc.invalidateQueries({ queryKey: ['announcement'] })
        })

        fetchOnline().then((p) => { if (!cancelled) setOnlineUsers(p.users) }).catch(() => {})
      },
      onDisconnect: () => { if (!cancelled) setConnected(false) },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message'])
        if (!cancelled) setConnected(false)
      },
      onWebSocketError: () => { if (!cancelled) setConnected(false) },
    })

    stompClient.activate()
    clientRef.current = stompClient

    return () => {
      cancelled = true
      stompClient.deactivate()
      clientRef.current = null
      setConnected(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const send = useCallback((content: string, replyToId?: number | null, attachmentId?: number | null) => {
    const c = clientRef.current
    if (!c?.active) return
    if (!content.trim() && attachmentId == null) return // matnsiz va filesiz — yubormaymiz
    c.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        content: content.trim(),
        replyToId: replyToId ?? null,
        attachmentId: attachmentId ?? null,
      }),
    })
  }, [])

  const edit = useCallback((id: number, content: string) => {
    const c = clientRef.current
    if (!c?.active || !content.trim()) return
    c.publish({ destination: '/app/chat.edit', body: JSON.stringify({ id, content: content.trim() }) })
  }, [])

  const remove = useCallback((id: number) => {
    const c = clientRef.current
    if (!c?.active) return
    c.publish({ destination: '/app/chat.delete', body: JSON.stringify({ id }) })
  }, [])

  const react = useCallback((messageId: number, emoji: string) => {
    const c = clientRef.current
    if (!c?.active || !emoji) return
    c.publish({ destination: '/app/chat.react', body: JSON.stringify({ messageId, emoji }) })
  }, [])

  // "Yozmoqda" signalini eng ko'pi 2 soniyada bir marta yuboramiz (spam emas).
  const lastTypingRef = useRef(0)
  const sendTyping = useCallback(() => {
    const c = clientRef.current
    if (!c?.active) return
    const now = Date.now()
    if (now - lastTypingRef.current < 2000) return
    lastTypingRef.current = now
    c.publish({ destination: '/app/chat.typing', body: '{}' })
  }, [])

  // Infinite-scroll: yuqoriga aylantirilganda eng eski xabardan oldingilarni yuklab, boshiga qo'shamiz.
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return
    setLoadingMore(true)
    try {
      const older = await fetchChatHistory(50, messages[0].id)
      if (older.length < 50) setHasMore(false)
      if (older.length > 0) setMessages((cur) => [...older, ...cur])
    } catch {
      // tarmoq xatosi — jimgina o'tamiz
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, messages])

  return {
    messages, connected, send, edit, remove, react, sendTyping,
    loadingHistory, loadingMore, hasMore, loadMore, onlineUsers, typingUsers,
  }
}
