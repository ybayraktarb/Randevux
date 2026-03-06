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
import { UsersTab } from "../users-tab"
import { StatsTab } from "../stats-tab"
import { SettingsTab } from "../settings-tab"

// BusinessesTab and ModulesTab still live in super-admin.tsx (monolith, split in next sprint)
import { BusinessesTab, ModulesTab } from "../super-admin"

export function SuperAdmin() {
    const [activeTab, setActiveTab] = useState<"overview" | "businesses" | "users" | "modules" | "stats" | "logs" | "settings">("overview")
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [windowWidth, setWindowWidth] = useState(1200)

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth)
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const isMobile = windowWidth < 768
    const isTablet = windowWidth >= 768 && windowWidth < 1024
    const sidebarCollapsed = isTablet

    const tabs = [
        { key: "overview" as const, label: "Genel Bakış" },
        { key: "businesses" as const, label: "İşletmeler" },
        { key: "users" as const, label: "Kullanıcılar" },
        { key: "modules" as const, label: "Modül Yönetimi" },
        { key: "stats" as const, label: "Platform İstatistikleri" },
        { key: "logs" as const, label: "Sistem Logları" },
        { key: "settings" as const, label: "Ayarlar" },
    ]

    const handleNavClick = (key: string) => {
        const tabMap: Record<string, typeof activeTab> = {
            overview: "overview",
            businesses: "businesses",
            users: "users",
            modules: "modules",
            stats: "stats",
            logs: "logs",
            settings: "settings",
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
                        {/* Tab Switcher */}
                        <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={cn(
                                        "flex-1 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors",
                                        activeTab === tab.key
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-primary-light hover:text-foreground"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {activeTab === "overview" && <OverviewTab />}
                        {activeTab === "businesses" && <BusinessesTab />}
                        {activeTab === "users" && <UsersTab />}
                        {activeTab === "modules" && <ModulesTab />}
                        {activeTab === "stats" && <StatsTab />}
                        {activeTab === "logs" && <LogsTab />}
                        {activeTab === "settings" && <SettingsTab />}
                    </main>
                </div>
            </div>
        </TooltipProvider>
    )
}
