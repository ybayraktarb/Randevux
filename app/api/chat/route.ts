import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkFeatureAccess } from '@/lib/permissions';
import { getAvailableSlotsAction } from '@/app/actions/availability.actions';
import { getQuickRebookDataAction } from '@/app/actions/user.actions';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { messages, businessId } = await req.json();

        if (!businessId) {
            return new Response('Business ID is required', { status: 400 });
        }

        // 1. Feature Flag Check — Monetization Guard
        const hasAccess = await checkFeatureAccess(businessId, 'ai_assistant');
        if (!hasAccess) {
            return new Response('Bu işletme için Yapay Zeka Asistanı aktif değil. Lütfen paketini yükseltin.', { status: 403 });
        }

        // 2. Auth Check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // 3. System Prompt - Define AI Personality & Knowledge
        const systemPrompt = `
            Sen RandevuX platformunun akıllı asistanısın. Görevin, müşterilere randevu alma süreçlerinde yardımcı olmak ve işletme hakkında bilgi vermektir.
            
            Kurallar:
            - Kibar, profesyonel ve yardımsever bir dil kullan.
            - Sadece sana verilen araçları (tools) kullanarak gerçek zamanlı veriye ulaş.
            - Tarihleri YYYY-MM-DD formatında işle. Bugünün tarihi: ${new Date().toISOString().split('T')[0]}.
            - Bilmediğin bir şey olursa uydurma, "Bu konuda şu an bilgim yok" de.
            - İşletme ID: ${businessId}
            - Kullanıcı: ${user?.user_metadata?.name || 'Değerli Müşterimiz'}
            
            Müşterilere şu konularda yardımcı olabilirsin:
            - Geçmiş randevularına bakarak onlara özel önerilerde bulunmak.
            - Uygun randevu saatlerini bulmak.
            - Almak istedikleri hizmetler hakkında bilgi vermek.
            - İşletmedeki personelleri listelemek.
            - İşletmenin genel bilgilerini paylaşmak.
        `;

        // 4. Stream AI Response with Gemini 1.5 Pro
        const result = streamText({
            // @ts-expect-error Type error in AI sdk compatibility
            model: google('gemini-1.5-pro'),
            messages,
            system: systemPrompt,
            tools: {
                getUserHistory: tool({
                    description: 'Müşterinin geçmiş randevularını ve sık aldığı hizmetleri getirir.',
                    parameters: z.object({}),
                    execute: async () => {
                        const res = await getQuickRebookDataAction();
                        return res.success ? (res.data || []) : { error: res.error };
                    },
                }),
                getBusinessInfo: tool({
                    description: 'İşletme hakkında genel bilgileri (ad, adres, telefon) getirir.',
                    parameters: z.object({}),
                    execute: async () => {
                        const { data, error } = await supabase.from('businesses').select('*').eq('id', businessId).single();
                        if (error) return { error: error.message };
                        return data;
                    },
                }),
                getServices: tool({
                    description: 'İşletmenin sunduğu hizmetleri, fiyatlarını ve sürelerini getirir.',
                    parameters: z.object({}),
                    execute: async () => {
                        const { data, error } = await supabase.from('services').select('*').eq('business_id', businessId).eq('is_active', true);
                        if (error) return { error: error.message };
                        return data || [];
                    },
                }),
                getStaff: tool({
                    description: 'İşletmedeki personelleri listeler.',
                    parameters: z.object({}),
                    execute: async () => {
                        const { data, error } = await supabase.from('staff_business')
                            .select('id, users(name, avatar_url)')
                            .eq('business_id', businessId)
                            .eq('is_active', true);
                        if (error) return { error: error.message };
                        return data || [];
                    },
                }),
                getAvailableSlots: tool({
                    description: 'Belirli bir tarih, personel ve hizmetler için müsait randevu saatlerini getirir.',
                    parameters: z.object({
                        date: z.string().describe('YYYY-MM-DD formatında tarih.'),
                        staffBusinessId: z.string().describe('Personelin ID\'si veya "ANY".').optional(),
                        serviceIds: z.array(z.string()).describe('Seçilen hizmetlerin ID listesi.')
                    }),
                    execute: async ({ date, staffBusinessId = 'ANY', serviceIds }) => {
                        const res = await getAvailableSlotsAction({
                            businessId,
                            date,
                            staffBusinessId,
                            serviceIds
                        });
                        if (res.success) {
                            return (res.slots || []).filter(s => s.status === 'available');
                        }
                        return { error: 'Müsaitlik bilgisi alınamadı.' };
                    },
                }),
            },
        });

        // Use toTextStreamResponse if toDataStreamResponse fails or is missing in this version
        // @ts-expect-error This SDK version mismatch expects toDataStreamResponse to exist on streamText
        return result.toDataStreamResponse();
    } catch (error: any) {
        console.error('AI Chat Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
