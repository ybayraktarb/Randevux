"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Search, MoreHorizontal, ChevronLeft, ChevronRight, UserCheck, BanIcon, Edit2, Plus, X, Calendar, Users, ShieldCheck, Building2, UserPlus, Mail, Phone, Lock, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import * as Sentry from "@sentry/nextjs"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { RxBadge } from "@/src/modules/core/components/rx-badge"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxModal } from "@/src/modules/core/components/rx-modal"
import { RxInput } from "@/src/modules/core/components/rx-input"
import { createUserAction, deleteUserAction } from "@/src/modules/auth/actions/auth.actions"
import { UsersDrawer } from "@/src/modules/admin/components/super-admin/tabs/users-drawer"
import { toast } from "sonner"

export function UsersTab() {
    const supabase = createClient()
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Filters & Pagination
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [roleFilter, setRoleFilter] = useState("all") // all, patron, user, super_admin
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15
    const [totalCount, setTotalCount] = useState(0)

    // Actions
    const [menuOpenIdx, setMenuOpenIdx] = useState<number | null>(null)

    // Drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any | null>(null)
    const [userToAct, setUserToAct] = useState<{ id: string, name: string, willBeActive: boolean, type?: 'status' | 'delete' } | null>(null)
    const [actionLoading, setActionLoading] = useState(false)

    // Create User Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [createForm, setCreateForm] = useState({
        name: "", email: "", password: "", role: "patron", phone: "",
        existingBusinessId: ""
    })
    const [createLoading, setCreateLoading] = useState(false)
    const [modules, setModules] = useState<any[]>([])
    const [businesses, setBusinesses] = useState<any[]>([])

    useEffect(() => {
        async function fetchDropdownData() {
            const [modulesRes, businessesRes] = await Promise.all([
                supabase.from('modules').select('id, display_name').eq('is_active', true),
                supabase.from('businesses').select('id, name').eq('is_active', true)
            ])

            if (modulesRes.data) {
                setModules(modulesRes.data)
                if (modulesRes.data.length > 0) setCreateForm(prev => ({ ...prev, moduleId: modulesRes.data[0].id }))
            }
            if (businessesRes.data) {
                setBusinesses(businessesRes.data)
            }
        }
        fetchDropdownData()
    }, [supabase])

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchUsers()
        }, 400)
        return () => clearTimeout(delayDebounceFn)
    }, [currentPage, statusFilter, roleFilter, searchQuery])

    async function fetchUsers() {
        setLoading(true)
        let query = supabase
            .from("users")
            .select("id, name, email, phone, role, is_active, created_at, avatar_url", { count: 'exact' })
            .order("created_at", { ascending: false })

        if (searchQuery) {
            query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        }

        if (statusFilter === "active") {
            query = query.eq("is_active", true)
        }
        if (statusFilter === "banned") {
            query = query.eq("is_active", false)
        }

        if (roleFilter !== "all") {
            query = query.eq("role", roleFilter)
        }

        const from = (currentPage - 1) * itemsPerPage
        const to = from + itemsPerPage - 1
        query = query.range(from, to)

        const { data: usersData, count } = await query

        if (usersData) {
            const mapped = usersData.map((u: any) => ({
                id: u.id,
                name: u.name || "İsimsiz Kullanıcı",
                email: u.email || "-",
                phone: u.phone || "-",
                role: u.role || "user",
                active: u.is_active,
                date: new Date(u.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }),
                avatar: u.avatar_url,
                raw: u
            }))
            setUsers(mapped)
        }
        if (count !== null) setTotalCount(count)
        setLoading(false)
    }

    function openUserDrawer(user: any) {
        setSelectedUser(user)
        setIsDrawerOpen(true)
        setMenuOpenIdx(null)
    }

    async function handleToggleStatus(userId: string, currentStatus: boolean) {
        setActionLoading(true)
        const { error } = await supabase
            .from("users")
            .update({ is_active: !currentStatus })
            .eq("id", userId)

        if (error) {
            toast.error("Durum güncelleme hatası")
        } else {
            toast.success(!currentStatus ? "Kullanıcı aktif edildi" : "Kullanıcı durduruldu")
            fetchUsers()
        }
        setActionLoading(false)
    }



    async function handleCreateUser() {
        if (!createForm.name || !createForm.email || !createForm.password) {
            alert("Lütfen ad, e-posta ve şifre alanlarını doldurun.")
            return
        }

        if (createForm.role === "patron") {
            if (!createForm.existingBusinessId) {
                alert("Lütfen atanacak mevcut işletmeyi seçin.")
                return
            }
        }

        setCreateLoading(true)

        const formData = new FormData()
        formData.append("name", createForm.name)
        formData.append("email", createForm.email)
        formData.append("password", createForm.password)
        formData.append("role", createForm.role)
        if (createForm.phone) formData.append("phone", createForm.phone)

        if (createForm.role === "patron") {
            formData.append("existingBusinessId", createForm.existingBusinessId)
        }

        const result = await createUserAction(formData)

        setCreateLoading(false)

        if (!result.success) {
            alert("Hesap oluşturulamadı: " + result.error.message) // DEĞİŞTİRİLDİ — ActionResult formatı
        } else if (result.success) {
            alert("Kullanıcı hesabı başarıyla oluşturuldu! (Sonner toast eklenebilir)")
            setIsCreateModalOpen(false)
            setCreateForm({
                name: "", email: "", password: "", role: "patron", phone: "",
                existingBusinessId: ""
            })
            fetchUsers() // Tabloyu Yenile
        }
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))

    return (
        <div className="flex flex-col gap-6">
            {/* Header & Toolbar */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-[22px] font-semibold text-foreground tracking-tight">Kullanıcı Yönetimi</h2>
                        <p className="text-sm text-muted-foreground">{totalCount} kayıtlı sistem kullanıcısı listeleniyor.</p>
                    </div>
                    <div className="shrink-0">
                        <RxButton onClick={() => setIsCreateModalOpen(true)} className="shadow-sm">
                            <Plus className="size-4" />
                            Yeni Hesap Oluştur
                        </RxButton>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-2 shadow-sm">
                        
                        {/* Role Segmented Control */}
                        <div className="flex items-center gap-1 rounded-md bg-muted/30 p-1">
                            {[
                                { id: "all", label: "Tümü" },
                                { id: "patron", label: "Patronlar" },
                                { id: "personel", label: "Personeller" },
                                { id: "user", label: "Müşteriler" },
                                { id: "super_admin", label: "Yöneticiler" }
                            ].map((role) => (
                                <button
                                    key={role.id}
                                    onClick={() => { setRoleFilter(role.id); setCurrentPage(1); }}
                                    className={cn(
                                        "px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200",
                                        roleFilter === role.id 
                                            ? "bg-primary text-primary-foreground shadow-sm" 
                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                >
                                    {role.label}
                                </button>
                            ))}
                        </div>

                        <div className="h-5 w-px bg-border hidden sm:block mx-1" />

                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="İsim, email veya telefon..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="h-9 w-full rounded-md bg-transparent pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary/30"
                            />
                        </div>

                        <div className="h-5 w-px bg-border hidden sm:block mx-1" />

                        {/* Status Select */}
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="h-9 min-w-[140px] cursor-pointer rounded-md bg-transparent px-3 text-[13px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 hover:bg-accent transition-colors border-none appearance-none"
                        >
                            <option value="all">Tüm Durumlar</option>
                            <option value="active">🟢 Aktif Kullanıcılar</option>
                            <option value="banned">🔴 Banlı / Pasif</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm relative">
                {loading && (
                    <div className="absolute inset-0 z-10 flex min-h-[300px] items-center justify-center bg-background/50 backdrop-blur-sm">
                        <Loader2 className="size-8 animate-spin text-primary" />
                    </div>
                )}
                <table className="w-full min-w-[800px] text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/40 transition-colors hover:bg-muted/50">
                            {["Kullanıcı", "E-posta", "Telefon", "Rol"].map((h) => (
                                <th key={h} className="px-5 py-3.5 text-left text-[13px] font-semibold text-muted-foreground/80 whitespace-nowrap">{h}</th>
                            ))}
                            <th className="px-5 py-3.5 text-left text-[13px] font-semibold text-muted-foreground/80 whitespace-nowrap">
                                <span className="flex items-center gap-1"><Calendar className="size-3.5" /> Kayıt Tarihi</span>
                            </th>
                            {["Durum", "İşlemler"].map((h) => (
                                <th key={h} className="px-5 py-3.5 text-left text-[13px] font-semibold text-muted-foreground/80 whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                        <tbody>
                            {users.map((user, idx) => (
                                <tr 
                                    key={user.id} 
                                    className="border-b border-border last:border-0 transition-all hover:bg-primary-light/40 cursor-pointer group"
                                    onClick={() => openUserDrawer(user)}
                                >
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <RxAvatar name={user.name} src={user.avatar} size="md" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-foreground">{user.name}</span>
                                                <span className="text-xs text-muted-foreground font-mono">{user.id.substring(0, 8)}...</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-sm text-foreground">{user.email}</td>
                                    <td className="px-5 py-3 text-[13px] text-foreground font-mono">{user.phone}</td>
                                    <td className="px-5 py-3">
                                        {user.role === 'super_admin' ? (
                                            <RxBadge variant="purple">Süper Admin</RxBadge>
                                        ) : user.role === 'patron' ? (
                                            <RxBadge variant="warning">Patron</RxBadge>
                                        ) : user.role === 'personel' ? (
                                            <RxBadge variant="gray">Personel</RxBadge>
                                        ) : (
                                            <RxBadge variant="gray">Kullanıcı</RxBadge>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-[13px] text-muted-foreground">{user.date}</td>
                                    <td className="px-5 py-3">
                                        {user.active ? (
                                            <RxBadge variant="success">Aktif</RxBadge>
                                        ) : (
                                            <RxBadge variant="danger">Banlı</RxBadge>
                                        )}
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setMenuOpenIdx(menuOpenIdx === idx ? null : idx); }}
                                                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground group-hover:bg-white/50"
                                            >
                                                <MoreHorizontal className="size-4" />
                                            </button>
                                            {menuOpenIdx === idx && (
                                                <>
                                                    <div className="fixed inset-0 z-30" onClick={() => setMenuOpenIdx(null)} aria-hidden="true" />
                                                    <div className="absolute right-0 top-full z-40 mt-1 w-44 rounded-lg border border-border bg-card py-1 shadow-lg">
                                                            <button
                                                                type="button"
                                                                className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors text-foreground hover:bg-muted"
                                                                onClick={(e) => { e.stopPropagation(); openUserDrawer(user); }}
                                                            >
                                                                <Edit2 className="size-4" /> Detayları Gör / Düzenle
                                                            </button>
                                                        <button
                                                            type="button"
                                                            className={cn(
                                                                "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
                                                                user.active ? "text-danger hover:bg-red-50 dark:hover:bg-red-950" : "text-success hover:bg-green-50 dark:hover:bg-green-950"
                                                            )}
                                                            onClick={(e) => { e.stopPropagation(); handleToggleStatus(user.id, user.active); }}
                                                        >
                                                            {user.active ? (
                                                                <><BanIcon className="size-4" /> Kullanıcıyı Banla</>
                                                            ) : (
                                                                <><UserCheck className="size-4" /> Banı Kaldır</>
                                                            )}
                                                        </button>
                                                        <div className="my-1 h-px bg-border" />
                                                        <button
                                                            type="button"
                                                            className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors text-danger hover:bg-red-50 dark:hover:bg-red-950"
                                                            onClick={(e) => { e.stopPropagation(); openUserDrawer(user); }}
                                                        >
                                                            <Trash2 className="size-4" /> Kullanıcıyı Sil (Detay Panelinden)
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="flex size-14 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/50">
                                                <Users className="size-7" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[15px] font-semibold text-foreground">Kullanıcı bulunamadı</p>
                                                <p className="text-sm text-muted-foreground">Aradığınız kriterlere uygun bir kayıt bulamadık.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <span className="text-sm text-muted-foreground">
                        Toplam {totalCount} kayıttan {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} arası gösteriliyor
                    </span>
                    <div className="flex items-center shadow-sm rounded-lg border border-border bg-card">
                        <button
                            type="button"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 rounded-l-lg p-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                        >
                            <ChevronLeft className="size-4" /> Önceki
                        </button>
                        <div className="h-4 w-px bg-border" />
                        <span className="px-4 text-sm font-medium text-muted-foreground">
                            Sayfa {currentPage} / {totalPages}
                        </span>
                        <div className="h-4 w-px bg-border" />
                        <button
                            type="button"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 rounded-r-lg p-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                        >
                            Sonraki <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* User Drawer Selection */}
            {selectedUser && (
                <UsersDrawer 
                    user={selectedUser}
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    onUpdate={() => { fetchUsers(); setIsDrawerOpen(false); }}
                />
            )}

            {/* Redesigned Create User Modal */}
            <RxModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title={
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                            <UserPlus className="size-5" />
                        </div>
                        <span>Yeni Hesap Oluştur</span>
                    </div>
                }
                footer={
                    <div className="flex items-center justify-between w-full">
                        <p className="text-[11px] text-muted-foreground max-w-[200px] text-left">
                            Hesap açıldığında e-posta onayı beklenmeden giriş yapılabilir.
                        </p>
                        <div className="flex gap-3">
                            <RxButton variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)} disabled={createLoading}>
                                İptal
                            </RxButton>
                            <RxButton size="sm" onClick={handleCreateUser} disabled={createLoading}>
                                {createLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                                Hesabı Oluştur ve Kaydet
                            </RxButton>
                        </div>
                    </div>
                }
            >
                <div className="flex flex-col gap-6 py-2">
                    {/* Section 1: Temel Bilgiler */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-1 border-b border-border/50">
                            <UserPlus className="size-4 text-muted-foreground" />
                            <h4 className="text-[13px] font-bold text-foreground uppercase tracking-wider">Temel Kullanıcı Bilgileri</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                                    Ad Soyad <span className="text-danger">*</span>
                                </label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                                    <input
                                        placeholder="Örn: Ahmet Yılmaz"
                                        value={createForm.name}
                                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                        disabled={createLoading}
                                        className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                                    Telefon Numarası
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                                    <input
                                        type="tel"
                                        placeholder="5551234567"
                                        value={createForm.phone}
                                        onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                                        disabled={createLoading}
                                        className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                                    E-posta Adresi <span className="text-danger">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                                    <input
                                        type="email"
                                        placeholder="ahmet@example.com"
                                        value={createForm.email}
                                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                                        disabled={createLoading}
                                        className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                                    Sistem Şifresi <span className="text-danger">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                                    <input
                                        type="password"
                                        placeholder="En az 6 karakter"
                                        value={createForm.password}
                                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                                        disabled={createLoading}
                                        className="h-10 w-full rounded-lg border border-input bg-card pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Yetkilendirme */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-1 border-b border-border/50">
                            <ShieldCheck className="size-4 text-muted-foreground" />
                            <h4 className="text-[13px] font-bold text-foreground uppercase tracking-wider">Yetkilendirme ve Erişim</h4>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[13px] font-medium text-foreground">Sistem Rolü Tanımı</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {[
                                    { id: "patron", label: "İşletme Sahibi", desc: "İşletme yönetimi" },
                                    { id: "personel", label: "Personel", desc: "Çalışan kadrosu" },
                                    { id: "super_admin", label: "Süper Admin", desc: "Platform yetkilisi" },
                                    { id: "user", label: "Standart Üye", desc: "Sınırlı müşteri" }
                                ].map((r) => (
                                    <button
                                        key={r.id}
                                        type="button"
                                        onClick={() => setCreateForm({ ...createForm, role: r.id })}
                                        className={cn(
                                            "flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all",
                                            createForm.role === r.id 
                                                ? "bg-primary/5 border-primary ring-2 ring-primary/20" 
                                                : "bg-card border-border hover:border-primary/40"
                                        )}
                                    >
                                        <span className={cn("text-xs font-bold", createForm.role === r.id ? "text-primary" : "text-foreground")}>{r.label}</span>
                                        <span className="text-[10px] text-muted-foreground leading-tight">{r.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {createForm.role === "patron" && (
                            <div className="p-4 rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2">
                                    <Building2 className="size-4 text-primary" />
                                    <h5 className="text-[13px] font-bold text-primary italic">İşletme Bağlantısı</h5>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold text-muted-foreground">Bağlanacak Mevcut İşletme</label>
                                    <select
                                        value={createForm.existingBusinessId}
                                        onChange={(e) => setCreateForm({ ...createForm, existingBusinessId: e.target.value })}
                                        className="h-10 w-full rounded-lg border border-primary/30 bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        disabled={createLoading}
                                    >
                                        <option value="">Lütfen seçim yapınız...</option>
                                        {businesses.map((b) => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-muted-foreground italic">
                                        * Patron hesabı oluşturulduğunda bu işletmenin yönetimine sahip olacaktır.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </RxModal>
        </div>
    )
}
