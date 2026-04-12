import { useCallback, useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import type { ChatMessageDto } from '../api/chat'
import { fetchChatHistory } from '../api/chat'

/**
 * Resolves the WebSocket URL from the current environment.
 * In dev mode, Vite proxy is used so we connect to the same origin.
 * In prod, VITE_API_BASE_URL points to the backend's public URL.
 */
function getWsUrl(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL
  if (apiBase) {
    // Production: convert http(s)://host to ws(s)://host/ws
    return apiBase.replace(/^http/, 'ws') + '/ws'
  }
  // Dev: same origin via Vite proxy
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${location.host}/ws`
}

interface UseChatReturn {
  messages: ChatMessageDto[]
  connected: boolean
  send: (content: string) => void
  loadingHistory: boolean
}

export function useChat(active: boolean): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessageDto[]>([])
  const [connected, setConnected] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const clientRef = useRef<Client | null>(null)
  const activeRef = useRef(active)
  activeRef.current = active

  // Load history and connect when chat becomes active
  useEffect(() => {
    if (!active) {
      // Disconnect when chat is closed
      if (clientRef.current?.active) {
        clientRef.current.deactivate()
        clientRef.current = null
      }
      setConnected(false)
      return
    }

    let cancelled = false

    // 1. Load message history
    setLoadingHistory(true)
    fetchChatHistory(50)
      .then((history) => {
        if (!cancelled) setMessages(history)
      })
      .catch(() => {}) // silent fail — will show empty
      .finally(() => {
        if (!cancelled) setLoadingHistory(false)
      })

    // 2. Connect WebSocket
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

        // Subscribe to global chat topic
        stompClient.subscribe('/topic/chat', (frame) => {
          const msg: ChatMessageDto = JSON.parse(frame.body)
          setMessages((prev) => [...prev, msg])
        })
      },
      onDisconnect: () => {
        if (!cancelled) setConnected(false)
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message'])
        if (!cancelled) setConnected(false)
      },
      onWebSocketError: () => {
        if (!cancelled) setConnected(false)
      },
    })

    stompClient.activate()
    clientRef.current = stompClient

    return () => {
      cancelled = true
      stompClient.deactivate()
      clientRef.current = null
      setConnected(false)
    }
  }, [active])

  // Send a chat message via STOMP
  const send = useCallback((content: string) => {
    const c = clientRef.current
    if (!c?.active || !content.trim()) return

    c.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ content: content.trim() }),
    })
  }, [])

  return { messages, connected, send, loadingHistory }
}
