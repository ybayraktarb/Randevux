"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

export interface Notification {
    id: string
    type: string
    title: string
    body: string | null
    relatedId: string | null
    relatedType: string | null
    isRead: boolean
    createdAt: string
}

export interface UseNotificationsReturn {
    notifications: Notification[]
    unreadCount: number
    loading: boolean
    markAsRead: (id: string) => Promise<void>
    markAllAsRead: () => Promise<void>
    refresh: () => Promise<void>
}

export function useNotifications(userId: string | null | undefined): UseNotificationsReturn {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const supabaseRef = useRef(createClient())

    const mapRow = (r: any): Notification => ({
        id: r.id,
        type: r.type,
        title: r.title,
        body: r.body,
        relatedId: r.related_id,
        relatedType: r.related_type,
        isRead: r.is_read,
        createdAt: r.created_at,
    })

    const fetchNotifications = useCallback(async () => {
        if (!userId) return
        setLoading(true)
        const { data } = await supabaseRef.current
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(50)

        setNotifications((data || []).map(mapRow))
        setLoading(false)
    }, [userId])

    // Initial fetch
    useEffect(() => {
        fetchNotifications()
    }, [fetchNotifications])

    // Realtime subscription
    useEffect(() => {
        if (!userId) return

        const channel = supabaseRef.current
            .channel(`notifications-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    const newNotif = mapRow(payload.new)
                    setNotifications((prev) => [newNotif, ...prev])
                }
            )
            .subscribe()

        return () => {
            supabaseRef.current.removeChannel(channel)
        }
    }, [userId])

    const unreadCount = notifications.filter((n) => !n.isRead).length

    const markAsRead = useCallback(async (id: string) => {
        await supabaseRef.current
            .from("notifications")
            .update({ is_read: true })
            .eq("id", id)

        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        )
    }, [])

    const markAllAsRead = useCallback(async () => {
        if (!userId) return
        await supabaseRef.current
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", userId)
            .eq("is_read", false)

        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    }, [userId])

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications,
    }
}
