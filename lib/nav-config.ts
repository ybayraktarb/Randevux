import {
    LayoutDashboard,
    Calendar,
    Users,
    Scissors,
    Clock,
    UserCheck,
    Settings,
    ClipboardList,
    Umbrella,
    Building2,
    User,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface NavItem {
    label: string
    icon: React.ElementType
    href: string
}

// ─── Patron Navigation (7 items) ────────────────────────────────────────────────

export const patronNav: NavItem[] = [
    { label: "Genel Bakış", icon: LayoutDashboard, href: "/patron-dashboard" },
    { label: "Randevular", icon: Calendar, href: "/randevular" },
    { label: "Personel", icon: Users, href: "/personel" },
    { label: "Hizmetler", icon: Scissors, href: "/hizmetler" },
    { label: "Takvim & Vardiyalar", icon: Clock, href: "/takvim" },
    { label: "Müşteriler", icon: UserCheck, href: "/musteriler" },
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
    { label: "Genel Bakış", icon: LayoutDashboard, href: "/musteri-panel" },
    { label: "Randevularım", icon: Calendar, href: "/randevularim" },
    { label: "İşletmelerim", icon: Building2, href: "/isletme" },
    { label: "Profilim", icon: User, href: "/profil" },
]

// ─── Admin Navigation (4 items) ─────────────────────────────────────────────

export const adminNav: NavItem[] = [
    { label: "Genel Bakış", icon: LayoutDashboard, href: "/admin-dashboard" },
    { label: "İşletmeler", icon: Building2, href: "/isletmeler" },
    { label: "Kullanıcılar", icon: Users, href: "/kullanicilar" },
    { label: "Modüller", icon: Settings, href: "/moduller" },
]

