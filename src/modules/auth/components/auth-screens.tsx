"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Logo } from "./auth-flow/AuthShared"
import { LoginScreen } from "./auth-flow/LoginScreen"
import { RegisterFlow } from "./auth-flow/RegisterFlow"

export function AuthScreens({ initialView = "login" }: { initialView?: "login" | "register" }) {
  const router = useRouter()
  const [view, setView] = useState(initialView)
  const supabase = createClient()

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const handleForgotPassword = () => {
    router.push("/forgot-password")
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#F8FAFC] p-4 selection:bg-primary/10">
      <div className="mb-10">
        <Logo />
      </div>

      {view === "login" ? (
        <LoginScreen
          onToggle={() => setView("register")}
          onForgotPassword={handleForgotPassword}
          onSocialLogin={handleSocialLogin}
        />
      ) : (
        <RegisterFlow
          onToggle={() => setView("login")}
          onSocialLogin={handleSocialLogin}
        />
      )}
    </div>
  )
}
