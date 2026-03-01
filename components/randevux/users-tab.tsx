"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Search, MoreHorizontal, ChevronLeft, ChevronRight, UserCheck, BanIcon, Edit2, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { RxAvatar } from "./rx-avatar"
import { RxBadge } from "./rx-badge"
import { RxButton } from "./rx-button"
import { RxModal } from "./rx-modal"
import { RxInput } from "./rx-input"
import { createUserAction } from "@/app/actions/user.actions"

export function UsersTab() {
    const supabase = createClient()
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Filters & Pagination
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15
    const [totalCount, setTotalCount] = useState(0)

    // Actions
    const [menuOpenIdx, setMenuOpenIdx] = useState<number | null>(null)

    // Modal State for Action Confirmation & Edit
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [userToAct, setUserToAct] = useState<{ id: string, name: string, willBeActive: boolean } | null>(null)
    const [editForm, setEditForm] = useState({ id: "", name: "", email: "", role: "user" })
    const [actionLoading, setActionLoading] = useState(false)

    // Create User Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [createForm, setCreateForm] = useState({ name: "", email: "", password: "" })
    const [createLoading, setCreateLoading] = useState(false)

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchUsers()
        }, 400)
        return () => clearTimeout(delayDebounceFn)
    }, [currentPage, statusFilter, searchQuery])

    async function fetchUsers() {
        setLoading(true)
        let query = supabase
            .from("users")
            .select("id, name, email, phone, is_active, created_at, avatar_url", { count: 'exact' })
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

    function promptAction(user: any) {
        setUserToAct({ id: user.id, name: user.name, willBeActive: !user.active })
        setIsConfirmModalOpen(true)
        setMenuOpenIdx(null)
    }

    function openEditModal(user: any) {
        setEditForm({
            id: user.id,
            name: user.name === "İsimsiz Kullanıcı" ? "" : user.name,
            email: user.email === "-" ? "" : user.email,
            role: user.role
        })
        setIsEditModalOpen(true)
        setMenuOpenIdx(null)
    }

    async function executeAction() {
        if (!userToAct) return
        setActionLoading(true)

        const { error } = await supabase
            .from("users")
            .update({ is_active: userToAct.willBeActive })
            .eq("id", userToAct.id)

        setActionLoading(false)
        if (!error) {
            setIsConfirmModalOpen(false)
            setUserToAct(null)
            fetchUsers()
        } else {
            alert("İşlem sırasında bir hata oluştu: " + error.message)
        }
    }

    async function handleEditSubmit(e: React.FormEvent) {
        e.preventDefault()
        setActionLoading(true)

        // Super Admin only updating fields
        const updates = {
            name: editForm.name,
            email: editForm.email
        }

        const { error } = await supabase
            .from("users")
            .update(updates)
            .eq("id", editForm.id)

        setActionLoading(false)
        if (!error) {
            setIsEditModalOpen(false)
            fetchUsers()
        } else {
            alert("Güncelleme hatası: " + error.message)
        }
    }

    async function handleCreateUser() {
        if (!createForm.name || !createForm.email || !createForm.password) {
            alert("Lütfen ad, e-posta ve şifre alanlarını doldurun.")
            return
        }

        setCreateLoading(true)

        const formData = new FormData()
        formData.append("name", createForm.name)
        formData.append("email", createForm.email)
        formData.append("password", createForm.password)

        const result = await createUserAction(formData)

        setCreateLoading(false)

        if (result?.error) {
            alert("Hesap oluşturulamadı: " + result.error)
        } else if (result?.success) {
            alert("Kullanıcı hesabı başarıyla oluşturuldu! (Sonner toast eklenebilir)")
            setIsCreateModalOpen(false)
            setCreateForm({ name: "", email: "", password: "" })
            fetchUsers() // Tabloyu Yenile
        }
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))

    return (
        <div className="flex flex-col gap-6">
            {/* Header & Controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-[22px] font-semibold text-foreground">Kullanıcılar</h2>
                    <p className="text-sm text-muted-foreground">{totalCount} kayıtlı kullanıcı</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <RxButton size="sm" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="size-4" />
                        Yeni Kullanıcı Ekle
                    </RxButton>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="İsim, email veya telefon..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="h-9 w-56 rounded-lg border border-input bg-card pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                    >
                        <option value="all">Tüm Durumlar</option>
                        <option value="active">Aktif</option>
                        <option value="banned">Banlı / Pasif</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="size-6 animate-spin text-primary" /></div>
                ) : (
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-border">
                                {["Kullanıcı", "E-posta", "Telefon", "Rol", "Kayıt Tarihi", "Durum", "İşlemler"].map((h) => (
                                    <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, idx) => (
                                <tr key={user.id} className="border-b border-border last:border-0 transition-colors hover:bg-primary-light/50">
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
                                        ) : (
                                            <span className="text-sm text-foreground">Kullanıcı</span>
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
                                                onClick={() => setMenuOpenIdx(menuOpenIdx === idx ? null : idx)}
                                                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                                                            onClick={() => openEditModal(user)}
                                                        >
                                                            <Edit2 className="size-4" /> Düzenle
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className={cn(
                                                                "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
                                                                user.active ? "text-danger hover:bg-red-50 dark:hover:bg-red-950" : "text-success hover:bg-green-50 dark:hover:bg-green-950"
                                                            )}
                                                            onClick={() => promptAction(user)}
                                                        >
                                                            {user.active ? (
                                                                <><BanIcon className="size-4" /> Kullanıcıyı Banla</>
                                                            ) : (
                                                                <><UserCheck className="size-4" /> Banı Kaldır</>
                                                            )}
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">Kullanıcı bulunamadı</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
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

            {/* Confirmation Modal */}
            {isConfirmModalOpen && userToAct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => !actionLoading && setIsConfirmModalOpen(false)} />
                    <div className="relative z-50 w-full max-w-md overflow-hidden rounded-xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95">
                        <h3 className="mb-2 text-lg font-semibold text-foreground">
                            {userToAct.willBeActive ? "Banı Kaldır" : "Kullanıcıyı Banla"}
                        </h3>
                        <p className="mb-6 text-sm text-muted-foreground">
                            <strong className="text-foreground">{userToAct.name}</strong> isimli kullanıcının
                            {userToAct.willBeActive ? " banını kaldırmak istediğinize emin misiniz? Kullanıcı sisteme tekrar giriş yapabilecek." : " hesabını banlamak istediğinize emin misiniz? (Kullanıcı is_active durumu kapatılacak ve sisteme giriş yapamayacaktır.)"}
                        </p>
                        <div className="flex justify-end gap-3">
                            <RxButton variant="secondary" size="sm" onClick={() => setIsConfirmModalOpen(false)} disabled={actionLoading}>
                                İptal
                            </RxButton>
                            <RxButton
                                variant="primary"
                                size="sm"
                                onClick={executeAction}
                                className={userToAct.willBeActive ? "bg-success hover:bg-success/90 text-white" : "bg-danger hover:bg-danger/90 text-white"}
                                disabled={actionLoading}
                            >
                                {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                                {userToAct.willBeActive ? "Evet, Aktif Et" : "Evet, Banla"}
                            </RxButton>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => !actionLoading && setIsEditModalOpen(false)} />
                    <div className="relative z-50 w-full max-w-md overflow-hidden rounded-xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95">
                        <h3 className="mb-4 text-lg font-semibold text-foreground">Kullanıcıyı Düzenle</h3>
                        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">İsim Soyisim</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.name}
                                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="h-10 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">E-posta Adresi</label>
                                <input
                                    type="email"
                                    required
                                    value={editForm.email}
                                    onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="h-10 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">Sistem Rolü</label>
                                <select
                                    value={editForm.role}
                                    onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                                    className="h-10 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="user">Standart Kullanıcı</option>
                                    <option value="super_admin">Süper Admin</option>
                                </select>
                            </div>

                            <div className="mt-4 flex justify-end gap-3">
                                <RxButton type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)} disabled={actionLoading}>
                                    İptal
                                </RxButton>
                                <RxButton type="submit" variant="primary" disabled={actionLoading}>
                                    {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                                    Değişiklikleri Kaydet
                                </RxButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create User Modal (Sprint 4) */}
            <RxModal
                open={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Yeni Kullanıcı / Patron Oluştur"
                footer={
                    <>
                        <RxButton variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(false)} disabled={createLoading}>
                            İptal
                        </RxButton>
                        <RxButton size="sm" onClick={handleCreateUser} disabled={createLoading}>
                            {createLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Hesabı Oluştur
                        </RxButton>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="rounded-lg bg-primary-light/50 p-3 text-sm text-primary-dark">
                        Oluşturulan bu hesap doğrudan giriş yapabilir ve işletmelerde **Owner (Patron)** olarak atanabilir.
                    </div>

                    <RxInput
                        label="Ad Soyad (*)"
                        placeholder="Örn: Ahmet Yılmaz"
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        disabled={createLoading}
                    />
                    <RxInput
                        label="E-posta Adresi (*)"
                        type="email"
                        placeholder="Örn: ahmet@kuafor.com"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        disabled={createLoading}
                    />
                    <RxInput
                        label="Sistem Şifresi (*)"
                        type="password"
                        placeholder="En az 6 karakter"
                        value={createForm.password}
                        onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                        disabled={createLoading}
                    />
                    <div className="text-[11px] text-muted-foreground">
                        Not: Hesap açıldığında e-posta onayı beklenmeden direkt giriş yapılabilir.
                    </div>
                </div>
            </RxModal>
        </div>
    )
}
