"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { invitePatronAction } from "@/app/actions/patron.actions"

const formSchema = z.object({
    fullName: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
    email: z.string().email("Geçerli bir e-posta adresi giriniz"),
    phone: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface InvitePatronModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function InvitePatronModal({ isOpen, onClose, onSuccess }: InvitePatronModalProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
        },
    })

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true)
        try {
            const { success, error } = await invitePatronAction({
                email: values.email,
                fullName: values.fullName,
                phone: values.phone || undefined,
            })

            if (success) {
                toast.success("Davet e-postası başarıyla gönderildi!")
                form.reset()
                onSuccess()
            } else {
                toast.error(error || "Davet gönderilirken bir hata oluştu.")
            }
        } catch (err: any) {
            toast.error(err.message || "Bilinmeyen bir hata oluştu.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            form.reset()
            onClose()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Patron Davet Et</DialogTitle>
                    <DialogDescription>
                        İşletme sahibine bir davet e-postası (magic link) gönderin. İlk girişlerinde hesabı oluşturulacaktır.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ad Soyad</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Örn: Ahmet Yılmaz" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>E-posta Adresi</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="ahmet@example.com" {...field} />
                                    </FormControl>
                                    <FormDescription>Magic link bu adrese gönderilecektir.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefon (İsteğe bağlı)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="05XX XXX XX XX" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                className="mr-2"
                                disabled={isLoading}
                            >
                                İptal
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Gönderiliyor...
                                    </>
                                ) : (
                                    "Davet Gönder"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
