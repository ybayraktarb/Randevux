"use client"

import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import * as Sentry from "@sentry/nextjs"

interface FeatureGateProps {
    businessId: string
    featureKey: string
    fallback?: React.ReactNode
    children: React.ReactNode
    minimal?: boolean
}

/**
 * Belirli bir özelliğin (feature) işletme için aktif olup olmadığını kontrol eden sarmalayıcı bileşen.
 */
export function FeatureGate({ businessId, featureKey, fallback = null, children, minimal = false }: FeatureGateProps) {
    const [isEnabled, setIsEnabled] = useState<boolean | null>(null)
    const supabase = createClient()

    useEffect(() => {
        if (!businessId || !featureKey) {
            setIsEnabled(false)
            return
        }

        async function checkAccess() {
            try {
                // Super Admin kontrolü
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: sa } = await supabase.from("super_admins").select("id").eq("user_id", user.id).maybeSingle()
                    if (sa) {
                        setIsEnabled(true)
                        return
                    }
                }

                // Özellik kontrolü
                const { data, error } = await supabase.rpc('check_feature_access', {
                    p_business_id: businessId,
                    p_feature_key: featureKey
                })

                if (error) {
                    Sentry.captureException(error, { tags: { module: 'core', action: 'featureGateCheck' } })
                    setIsEnabled(false)
                } else {
                    setIsEnabled(!!data)
                }
            } catch (err) {
                Sentry.captureException(err, { tags: { module: 'core', action: 'featureGateCheck', type: 'RuntimeError' } })
                setIsEnabled(false)
            }
        }

        checkAccess()
    }, [businessId, featureKey, supabase])

    if (isEnabled === null) {
        return null
    }

    if (!isEnabled) return <>{fallback}</>

    return <>{children}</>
}
