import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'sonner'
import { cookies } from 'next/headers'
import { ImpersonationBanner } from '@/src/modules/admin/components/impersonation-banner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'RandevuX - Randevu Yönetimi',
  description: 'RandevuX randevu yönetim uygulaması',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const impersonatedId = cookieStore.get("x-impersonate-user-id")?.value
  let impersonatedUser = null

  if (impersonatedId) {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: sa } = await supabase.from("users").select("role").eq("id", user.id).single()
      if (sa?.role === "super_admin") {
        const { data: target } = await supabase.from("users").select("name").eq("id", impersonatedId).single()
        impersonatedUser = target?.name || "Bilinmeyen Kullanıcı"
      }
    }
  }

  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased text-foreground bg-background`}>
        {impersonatedUser && (
          <div className="contents">
            <ImpersonationBanner userName={impersonatedUser} />
          </div>
        )}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>{/* EKLENDI */}
            {children}
          </AuthProvider>{/* EKLENDI */}
        </ThemeProvider>
        <Analytics />
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
