import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

export interface AppNotification {
  id: string
  item_id: string
  title: string
  message: string
  type: string
  read_at: string | null
  created_at: string
}

interface NotificationContextType {
  notifications: AppNotification[]
  unreadCount: number
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refreshNotifications: () => Promise<void>
  loading: boolean
}

export const NotificationContext = createContext<NotificationContextType | null>(null)

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setNotifications(data as AppNotification[])
    }
  }

  const refreshNotifications = async () => {
    setLoading(true)
    await fetchNotifications()
    setLoading(false)
  }

  useEffect(() => {
    if (session) {
      refreshNotifications()
    } else {
      setNotifications([])
    }
  }, [session])

  const markAsRead = async (id: string) => {
    const now = new Date().toISOString()
    const { error } = await supabase.from('notifications').update({ read_at: now }).eq('id', id)

    if (!error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: now } : n)))
    }
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.read_at).map((n) => n.id)
    if (unread.length === 0) return

    const now = new Date().toISOString()
    const { error } = await supabase.from('notifications').update({ read_at: now }).in('id', unread)

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || now })))
    }
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotificationStore = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotificationStore must be used within NotificationProvider')
  return context
}
