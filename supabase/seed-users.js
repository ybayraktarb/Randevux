// ── Production ortamında çalıştırılmasını engelle ─────────
if (process.env.NODE_ENV === 'production') {
    console.error('❌ Seed script production ortamında çalıştırılamaz!');
    process.exit(1);
}

/**
 * Randesk — Seed Users Script
 * ─────────────────────────────────────────────────────────────
 * Bu script Supabase Auth üzerinden 9 test kullanıcısı oluşturur
 * ve ardından ilgili tablolara bağlantılarını yapar.
 *
 * Kullanım:
 *   node supabase/seed-users.js
 *
 * .env.local dosyasında aşağıdaki değişkenler tanımlı olmalı:
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
 *   SUPABASE_SERVICE_ROLE_KEY=eyJhbG...   (admin işlemleri için)
 * ─────────────────────────────────────────────────────────────
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// ── .env.local dosyasını oku ──────────────────────────────────
function loadEnv() {
    const envPath = path.resolve(__dirname, "..", ".env.local");
    if (!fs.existsSync(envPath)) {
        console.error("❌ .env.local dosyası bulunamadı:", envPath);
        process.exit(1);
    }
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
            process.env[key] = value;
        }
    }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error(
        "❌ NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY .env.local'da tanımlı olmalı."
    );
    process.exit(1);
}

// Service role client — admin yetkisiyle kullanıcı oluşturur
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// ── Sabit ID'ler ──────────────────────────────────────────────
const BUSINESS_ID = "a0000000-0000-0000-0000-000000000001"; // seed.sql'deki Bella
const PASSWORD = process.env.SEED_PASSWORD || "Test1234!";

// Kullanıcı listesi
const USERS = [
    { email: "patron@randesk.com", name: "Patron Bella", role: "owner" },
    { email: "ayse@randesk.com", name: "Ayşe Yılmaz", role: "staff" },
    { email: "fatma@randesk.com", name: "Fatma Demir", role: "staff" },
    { email: "mehmet@randesk.com", name: "Mehmet Kaya", role: "staff" },
    { email: "musteri1@randesk.com", name: "Ali Öztürk", role: "customer" },
    { email: "musteri2@randesk.com", name: "Zeynep Aydın", role: "customer" },
    { email: "musteri3@randesk.com", name: "Emre Çelik", role: "customer" },
    { email: "musteri4@randesk.com", name: "Selin Arslan", role: "customer" },
    { email: "musteri5@randesk.com", name: "Can Yıldız", role: "customer" },
];

async function createUser(user) {
    // Admin API ile kullanıcı oluştur (email doğrulama atlanır)
    const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { name: user.name },
    });

    if (error) {
        // Kullanıcı zaten varsa atla
        if (error.message?.includes("already been registered")) {
            console.log(`⏭️  ${user.email} zaten kayıtlı, atlanıyor...`);
            // Mevcut kullanıcıyı bul
            const { data: listData } = await supabase.auth.admin.listUsers();
            const existing = listData?.users?.find((u) => u.email === user.email);
            return existing?.id || null;
        }
        console.error(`❌ ${user.email} oluşturulamadı:`, error.message);
        return null;
    }

    console.log(`✅ ${user.email} oluşturuldu (id: ${data.user.id})`);
    return data.user.id;
}

async function linkOwner(userId) {
    const { error } = await supabase.from("business_owners").insert({
        user_id: userId,
        business_id: BUSINESS_ID,
    });
    if (error && !error.message?.includes("duplicate")) {
        console.error("❌ business_owners insert hatası:", error.message);
    } else {
        console.log("   → business_owners'a eklendi");
    }
}

async function linkStaff(userId) {
    // staff_business kaydı oluştur
    const { data, error } = await supabase
        .from("staff_business")
        .insert({
            user_id: userId,
            business_id: BUSINESS_ID,
            is_active: true,
        })
        .select("id")
        .single();

    if (error && !error.message?.includes("duplicate")) {
        console.error("❌ staff_business insert hatası:", error.message);
        return;
    }

    if (data) {
        console.log(`   → staff_business'a eklendi (id: ${data.id})`);
    } else {
        console.log("   → staff_business zaten kayıtlı");
    }
}

async function linkCustomer(userId) {
    const { error } = await supabase.from("business_customers").insert({
        user_id: userId,
        business_id: BUSINESS_ID,
    });
    if (error && !error.message?.includes("duplicate")) {
        console.error("❌ business_customers insert hatası:", error.message);
    } else {
        console.log("   → business_customers'a eklendi");
    }
}

async function main() {
    console.log("🚀 Randesk Seed Users — Başlatılıyor...\n");

    for (const user of USERS) {
        const userId = await createUser(user);
        if (!userId) continue;

        switch (user.role) {
            case "owner":
                // Patron → business_owners (super_admins'e EKLENMİYOR)
                await linkOwner(userId);
                break;
            case "staff":
                await linkStaff(userId);
                break;
            case "customer":
                await linkCustomer(userId);
                break;
        }
        console.log(""); // boş satır
    }

    console.log("════════════════════════════════════════");
    console.log("✅ Seed users tamamlandı!");
    console.log("════════════════════════════════════════");
}

main().catch((err) => {
    console.error("❌ Beklenmeyen hata:", err);
    process.exit(1);
});
