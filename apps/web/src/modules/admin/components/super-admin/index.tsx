"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import {
    TooltipProvider,
} from "@/components/ui/tooltip"
import { AdminSidebar } from "./admin-sidebar"
import { AdminTopNav } from "./admin-top-nav"
import { OverviewTab } from "./tabs/overview-tab"
import { LogsTab } from "./tabs/logs-tab"
import { PackagesTab } from "./tabs/packages-tab"
import { FinanceTab } from "./tabs/finance-tab"
import { AnnouncementsTab } from "./tabs/announcements-tab"
import { UsersTab } from "@/src/modules/auth/components/users-tab"
import { StatsTab } from "@/src/modules/business/components/stats-tab"
import { SettingsTab } from "@/src/modules/business/components/settings-tab"
import { FeaturesTab } from "./tabs/features-tab"
import { PlatformAnnouncementBanner } from "../platform-announcement-banner"

import { BusinessesTab } from "./tabs/businesses-tab"
import { ModulesTab } from "./tabs/modules-tab"

export function SuperAdmin() {
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    const initialTab = (searchParams?.get("tab") as any) || "overview"
    
    const [activeTab, setActiveTab] = useState<"overview" | "businesses" | "users" | "finance" | "modules" | "packages" | "announcements" | "stats" | "logs" | "settings" | "features">(initialTab)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [windowWidth, setWindowWidth] = useState(1200)

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth)
        handleResize()
        window.addEventListener("resize", handleResize)
        
        // Sync URL with active tab
        const url = new URL(window.location.href)
        url.searchParams.set("tab", activeTab)
        window.history.pushState({}, "", url.toString())

        return () => window.removeEventListener("resize", handleResize)
    }, [activeTab])

    const isMobile = windowWidth < 768
    const isTablet = windowWidth >= 768 && windowWidth < 1024
    const sidebarCollapsed = isTablet

    const tabs = [
        { key: "overview" as const, label: "Genel Bakış" },
        { key: "businesses" as const, label: "İşletmeler" },
        { key: "users" as const, label: "Kullanıcılar" },
        { key: "features" as const, label: "Özellik Havuzu" },
        { key: "finance" as const, label: "Abonelik & Finans" },
        { key: "packages" as const, label: "Paket Yönetimi" },
        { key: "modules" as const, label: "Sektör Yönetimi" },
        { key: "announcements" as const, label: "Duyurular" },
        { key: "stats" as const, label: "Platform İstatistikleri" },
        { key: "logs" as const, label: "Sistem Logları" },
        { key: "settings" as const, label: "Ayarlar" },
    ]

    const handleNavClick = (key: string) => {
        const tabMap: Record<string, typeof activeTab> = {
            overview: "overview",
            businesses: "businesses",
            users: "users",
            finance: "finance",
            modules: "modules",
            packages: "packages",
            announcements: "announcements",
            stats: "stats",
            logs: "logs",
            settings: "settings",
            features: "features",
        }
        if (tabMap[key]) {
            setActiveTab(tabMap[key])
            setDrawerOpen(false)
        }
    }

    const pageTitle = tabs.find((t) => t.key === activeTab)?.label || "Genel Bakış"

    return (
        <TooltipProvider delayDuration={100}>
            <div className="flex h-screen overflow-hidden bg-background">
                {/* Desktop/Tablet Sidebar */}
                {!isMobile && (
                    <aside className={cn("hidden shrink-0 border-r border-border bg-card transition-all duration-200 md:flex md:flex-col", sidebarCollapsed ? "w-[60px]" : "w-[260px]")}>
                        <AdminSidebar collapsed={sidebarCollapsed} activeItem={activeTab} onNavClick={handleNavClick} />
                    </aside>
                )}

                {/* Mobile Drawer */}
                {isMobile && (
                    <>
                        <div
                            className={cn("fixed inset-0 z-40 bg-foreground/30 transition-opacity duration-300", drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")}
                            onClick={() => setDrawerOpen(false)}
                            aria-hidden="true"
                        />
                        <aside className={cn("fixed inset-y-0 left-0 z-50 w-[280px] bg-card shadow-xl transition-transform duration-300 ease-in-out", drawerOpen ? "translate-x-0" : "-translate-x-full")}>
                            <button type="button" onClick={() => setDrawerOpen(false)} className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-primary-light hover:text-foreground" aria-label="Kapat">
                                <X className="size-5" />
                            </button>
                            <AdminSidebar collapsed={false} activeItem={activeTab} onNavClick={handleNavClick} />
                        </aside>
                    </>
                )}

                {/* Main Area */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    <AdminTopNav title={pageTitle} onMenuToggle={() => setDrawerOpen(true)} showMenu={isMobile} onSettingsClick={() => handleNavClick("settings")} />

                    <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                        {/* Content Area */}
                        <PlatformAnnouncementBanner role="admin" />

                        {activeTab === "overview" && <OverviewTab />}
                        {activeTab === "businesses" && <BusinessesTab />}
                        {activeTab === "users" && <UsersTab />}
                        {activeTab === "finance" && <FinanceTab />}
                        {activeTab === "modules" && <ModulesTab />}
                        {activeTab === "packages" && <PackagesTab />}
                        {activeTab === "announcements" && <AnnouncementsTab />}
                        {activeTab === "stats" && <StatsTab />}
                        {activeTab === "logs" && <LogsTab />}
                        {activeTab === "settings" && <SettingsTab />}
                        {activeTab === "features" && <FeaturesTab />}
                    </main>
                </div>
            </div>
        </TooltipProvider>
    )
}
