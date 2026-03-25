import {
    LayoutDashboard,
    Calendar,
    Users,
    Scissors,
    Clock,
    UserCheck,
    Settings,
    ClipboardList,
    User,
    Wallet,
    Package,
    Building2,
    Umbrella
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface NavItem {
    label: string
    icon: React.ElementType
    href: string
    featureKey?: string // NEW: Module control key
}

// ─── Patron Navigation (7 items) ────────────────────────────────────────────────

export const patronNav: NavItem[] = [
    { label: "Genel Bakış", icon: LayoutDashboard, href: "/patron-dashboard" },
    { label: "Randevular", icon: Calendar, href: "/randevular" },
    { label: "Personel", icon: Users, href: "/personel" },
    { label: "Hizmetler", icon: Scissors, href: "/hizmetler" },
    { label: "Takvim & Vardiyalar", icon: Clock, href: "/takvim" },
    { label: "Müşteriler", icon: UserCheck, href: "/musteriler" },
    { label: "Ürünler & Depo", icon: Package, href: "/urunler", featureKey: "inventory_module" },
    { label: "Finans & Muhasebe", icon: Wallet, href: "/finans", featureKey: "finance_module" },
    { label: "Ayarlar", icon: Settings, href: "/ayarlar" },
]

// ─── Personel Navigation (4 items) ──────────────────────────────────────────────

export const personelNav: NavItem[] = [
    { label: "Takvimim", icon: Calendar, href: "/personel-panel" },
    { label: "Randevularım", icon: ClipboardList, href: "/personel-randevular" },
    { label: "İzin Talepleri", icon: Umbrella, href: "/izin" },
    { label: "Ayarlar", icon: Settings, href: "/personel-ayarlar" },
]

// ─── Müşteri Navigation (4 items) ───────────────────────────────────────────────

export const musteriNav: NavItem[] = [
    { label: "Keşfet", icon: LayoutDashboard, href: "/musteri-panel" },
    { label: "Randevularım", icon: Calendar, href: "/randevularim" },
    { label: "Profilim", icon: User, href: "/profil" },
]

// ─── Admin Navigation (4 items) ─────────────────────────────────────────────

export const adminNav: NavItem[] = [
    { label: "Genel Bakış", icon: LayoutDashboard, href: "/admin-dashboard?tab=overview" },
    { label: "İşletmeler", icon: Building2, href: "/admin-dashboard?tab=businesses" },
    { label: "Kullanıcılar", icon: Users, href: "/admin-dashboard?tab=users" },
    { label: "Modüller", icon: Settings, href: "/admin-dashboard?tab=modules" },
]

