import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Client } from '@stomp/stompjs'
import { getWsUrl } from '../utils/wsUrl'
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notifications'

export function useNotifications(page = 0, size = 20, enabled = true) {
  return useQuery({
    queryKey: ['notifications', page, size],
    queryFn: () => fetchNotifications(page, size),
    enabled,
    staleTime: 15_000,
  })
}

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ['notificationsUnread'],
    queryFn: fetchUnreadCount,
    enabled,
    staleTime: 15_000,
  })
}

function useInvalidateNotifications() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['notifications'] })
    qc.invalidateQueries({ queryKey: ['notificationsUnread'] })
  }
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications()
  return useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: invalidate,
  })
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
  })
}

/**
 * Login bo'lganda foydalanuvchining shaxsiy STOMP kanaliga ({@code /user/queue/notifications})
 * ulanadi va yangi bildirishnoma kelganda bildirishnoma querylarini yangilaydi.
 * Chat ulanishidan mustaqil — login davomida doimo faol.
 */
export function useNotificationSocket(enabled: boolean) {
  const invalidate = useInvalidateNotifications()
  useEffect(() => {
    if (!enabled) return
    const token = localStorage.getItem('token')
    if (!token) return

    let cancelled = false
    const client = new Client({
      brokerURL: getWsUrl(),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        if (cancelled) return
        client.subscribe('/user/queue/notifications', () => invalidate())
      },
    })
    client.activate()

    return () => {
      cancelled = true
      client.deactivate()
    }
    // invalidate barqaror (useQueryClient) — qayta ulanishni faqat enabled boshqaradi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])
}
