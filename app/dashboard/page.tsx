import { createClient } from "@/lib/supabase/server"

export default async function DashboardOverview() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Hoş Geldiniz, {user?.user_metadata?.name?.split(" ")[0] || "Patron"}
                </h1>
                <p className="text-muted-foreground">İşletmenizin günlük özeti ve son durumu</p>
            </div>

            {/* İstatistik Kartları */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Bugünkü Randevular</h3>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-primary"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <div className="text-2xl font-bold text-foreground">12</div>
                    <p className="text-xs text-muted-foreground mt-1 text-success">+3 dünden beri</p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Toplam Müşteri</h3>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <div className="text-2xl font-bold text-foreground">843</div>
                    <p className="text-xs text-muted-foreground mt-1 text-success">+15 bu hafta</p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Aktif Personel</h3>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-primary"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <div className="text-2xl font-bold text-foreground">4</div>
                    <p className="text-xs text-muted-foreground mt-1">İzinli personel yok</p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Bekleyen Ciro</h3>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-primary"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    </div>
                    <div className="text-2xl font-bold text-foreground">₺4,250</div>
                    <p className="text-xs text-muted-foreground mt-1 text-muted-foreground">Sadece bugünkü takvim</p>
                </div>
            </div>

            {/* Yaklaşan Randevular / Placeholder */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Sol Kısım: Yaklaşan Randevular */}
                <div className="col-span-4 rounded-xl border border-border bg-card shadow-sm">
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium text-foreground">Yaklaşan Randevular</h3>
                            <p className="text-sm text-muted-foreground">Bugün sizi bekleyen 4 müşteri var.</p>
                        </div>
                        <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">Canlı</span>
                    </div>
                    <div className="p-6 pt-0 border-t border-border/50">
                        <div className="space-y-4 mt-4">
                            {[
                                { time: "10:30", name: "Cengiz Kurtoğlu", service: "Saç Kesimi", staff: "Merve Y.", status: "Bekliyor" },
                                { time: "11:00", name: "Tarkan Tevetoğlu", service: "Sakal Tıraşı", staff: "Ahmet K.", status: "Onaylı" },
                                { time: "13:45", name: "Sezen Aksu", service: "Saç Boyası", staff: "Merve Y.", status: "Onaylı" },
                                { time: "15:00", name: "Barış Manço", service: "Sakal Kesimi", staff: "Ahmet K.", status: "Bekliyor" }
                            ].map((apt, i) => (
                                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary font-medium text-sm">
                                        {apt.time}
                                    </div>
                                    <div className="flex-1 space-y-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium leading-none text-foreground truncate">{apt.name}</p>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${apt.status === 'Onaylı' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {apt.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">{apt.service} • {apt.staff}</p>
                                    </div>
                                    <div className="flex items-center gap-2 pt-2 sm:pt-0">
                                        <button className="text-[11px] font-medium border border-border px-2 py-1 rounded-md hover:bg-muted transition-colors">Detay</button>
                                        <button className="text-[11px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-md hover:bg-emerald-100 transition-colors">Onayla</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sağ Kısım: Analizler (Native CSS) */}
                <div className="col-span-3 flex flex-col gap-4">
                    {/* Haftalık Performans Native Bar */}
                    <div className="rounded-xl border border-border bg-card shadow-sm flex-1">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-foreground">Haftalık Doluluk Oranı</h3>
                            <p className="text-sm text-muted-foreground">Personel bazlı randevu yoğunluğu (İlk 3)</p>
                        </div>
                        <div className="p-6 pt-2 border-t border-border/50 flex flex-col gap-5 mt-2">

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-foreground">Merve Yılmaz</span>
                                    <span className="text-muted-foreground">%85 (34 Randevu)</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2.5">
                                    <div className="bg-primary h-2.5 rounded-full" style={{ width: '85%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-foreground">Ahmet Kaya</span>
                                    <span className="text-muted-foreground">%62 (18 Randevu)</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2.5">
                                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '62%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-foreground">Zeynep Şahin</span>
                                    <span className="text-muted-foreground">%40 (8 Randevu)</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2.5">
                                    <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '40%' }}></div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Popüler Hizmetler */}
                    <div className="rounded-xl border border-border bg-card shadow-sm">
                        <div className="p-4 flex items-center justify-between border-b border-border/50">
                            <h3 className="text-[15px] font-medium text-foreground">En Çok Satan Hizmetler</h3>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-foreground flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-emerald-500"></span> Saç Kesimi
                                </span>
                                <span className="text-sm font-medium">₺12,500</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-foreground flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-blue-500"></span> Fön Çekimi
                                </span>
                                <span className="text-sm font-medium">₺4,200</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-foreground flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-amber-500"></span> Sakal Kesimi
                                </span>
                                <span className="text-sm font-medium">₺1,800</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
