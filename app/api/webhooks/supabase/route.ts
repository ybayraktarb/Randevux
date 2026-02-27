import { NextResponse } from 'next/server'

interface WebhookPayload {
    type: 'INSERT' | 'UPDATE' | 'DELETE'
    table: string
    record: any
    schema: 'public'
    old_record: any | null
}

export async function POST(request: Request) {
    try {
        const payload: WebhookPayload = await request.json()

        // 1. Gelen webhook'un appointments tablosuna ait olduğundan emin ol
        if (payload.table !== 'appointments') {
            return NextResponse.json({ message: 'Ignored' }, { status: 200 })
        }

        const { type, record, old_record } = payload
        const { status: newStatus, customer_user_id: customerId } = record

        let emailSubject = ''
        let emailBody = ''
        let shouldSendEmail = false

        // 2. Durum değişikliklerine göre email içeriğini belirle
        if (type === 'INSERT') {
            shouldSendEmail = true
            emailSubject = 'Randevunuz Alindi'
            emailBody = `Sayin Musterimiz, ${record.appointment_date} tarihinde ${record.start_time} saati icin randevunuz alinmistir. Durumunuz su an: ${newStatus}.`
        } else if (type === 'UPDATE') {
            const oldStatus = old_record?.status

            if (newStatus !== oldStatus) {
                shouldSendEmail = true
                if (newStatus === 'confirmed') {
                    emailSubject = 'Randevunuz Onaylandi'
                    emailBody = `Randevunuz onaylandi! Sizi ${record.appointment_date} saat ${record.start_time}'da bekliyoruz.`
                } else if (newStatus === 'cancelled') {
                    emailSubject = 'Randevunuz Iptal Edildi'
                    emailBody = `Randevunuz iptal edildi.`
                } else if (newStatus === 'completed') {
                    emailSubject = 'Bizi Tercih Ettiginiz Icin Tesekkurler'
                    emailBody = `Randevunuz tamamlandi. Tekrar gorusmek uzere!`
                } else if (newStatus === 'no_show') {
                    emailSubject = 'Randevunuza Katilmadiniz'
                    emailBody = `Randevunuza katilim saglamadiginizi fark ettik. Yeni bir randevu icin lutfen sistemimizi kullanin.`
                } else {
                    shouldSendEmail = false
                }
            }
        }

        // 3. Email gonderim simulasyonu (Gercek bir projede Resend, Nodemailer vb. entegre edilir)
        if (shouldSendEmail && customerId) {
            // Normalde burada Supabase uzerinden customer_user_id ile email adresi cekilir.
            // Bu mock bir simülasyon olduğu için doğrudan consol'a basıyoruz.
            console.log('--- EMAIL GONDERIMI BASLADI ---')
            console.log(`To Customer ID: ${customerId}`)
            console.log(`Subject: ${emailSubject}`)
            console.log(`Body: ${emailBody}`)
            console.log('--- EMAIL GONDERILDI ---')
        }

        return NextResponse.json({ success: true, message: 'Webhook processed' }, { status: 200 })
    } catch (error) {
        console.error('Webhook islenirken hata olustu:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
