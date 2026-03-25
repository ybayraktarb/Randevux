import { getAppointmentDetailsAction } from "@/src/modules/appointments/actions/appointment.actions"
import { notFound } from "next/navigation"
import { RxButton } from "@/src/modules/core/components/rx-button"
import Link from "next/link"
import { Calendar, Clock, MapPin, User, Scissors, ChevronLeft } from "lucide-react"

export default async function AppointmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const res = await getAppointmentDetailsAction(id)

    if (!res.success || !res.data) {
        notFound()
    }

    const apt = res.data

    return (
        <div className="container max-w-2xl mx-auto py-10 px-4">
            <Link href="/randevularim">
                <RxButton variant="ghost" className="mb-6 p-0 hover:bg-transparent">
                    <ChevronLeft className="mr-2 size-4" />
                    Randevularıma Dön
                </RxButton>
            </Link>

            <div className="bg-card border border-border rounded-[32px] overflow-hidden shadow-sm">
                <div className="bg-primary/5 p-8 border-b border-border">
                    <div className="flex items-center justify-between mb-4">
                        <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border ${
                            apt.status === "Onaylandı" ? "bg-green-500/10 text-green-600 border-green-200" :
                            apt.status === "Bekliyor" ? "bg-amber-500/10 text-amber-600 border-amber-200" :
                            "bg-gray-500/10 text-gray-600 border-gray-200"
                        }`}>
                            {apt.status}
                        </span>
                        <span className="text-xl font-black text-primary">
                            {apt.totalPrice} TL
                        </span>
                    </div>
                    <h1 className="text-3xl font-black text-foreground mb-1">{apt.businessName}</h1>
                    <p className="text-muted-foreground font-medium">{apt.services}</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-primary">
                                <Calendar className="size-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tarih</p>
                                <p className="font-bold">{apt.date}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-primary">
                                <Clock className="size-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Saat</p>
                                <p className="font-bold">{apt.time}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-primary">
                                <User className="size-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Uzman</p>
                                <p className="font-bold">{apt.staffName}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-muted flex items-center justify-center text-primary">
                                <Scissors className="size-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Hizmetler</p>
                                <p className="font-bold">{apt.services}</p>
                            </div>
                        </div>
                    </div>

                    {apt.customerNote && (
                        <div className="bg-muted/30 p-6 rounded-2xl border border-border/50">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Notunuz</p>
                            <p className="text-sm font-medium italic">"{apt.customerNote}"</p>
                        </div>
                    )}

                    <div className="pt-6 border-t border-border flex gap-4">
                        <Link href={`/isletme/${apt.businessId}`} className="flex-1">
                            <RxButton variant="secondary" className="w-full rounded-2xl h-12 font-black uppercase tracking-widest text-xs">
                                İşletme Sayfası
                            </RxButton>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
