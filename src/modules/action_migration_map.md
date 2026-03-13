# Sprint 13: Aksiyon Eşleşme Haritası

`app/actions` altındaki dosyaların `src/modules` altındaki yeni konumları:

| Eski Aksiyon Dosyası | Hedef Modül | Açıklama |
| :--- | :--- | :--- |
| `admin.actions.ts` | `admin` | Sprint 15'te kurulacak modüle taşınacak. |
| `ai.actions.ts` | `core` | AI yardımcıları için genel modül. |
| `announcement.actions.ts` | `business` | Zaten taşındı, eski dosya silinecek. |
| `appointment-time.actions.ts` | `appointments` | Mevcut aksiyonlara merge edilecek. |
| `appointment.actions.ts` | `appointments` | Mevcut aksiyonlara merge edilecek. |
| `audit.actions.ts` | `admin` | Denetim kayıtları. |
| `availability.actions.ts` | `appointments` | Takvim uygunluk mantığı. |
| `booking.actions.ts` | `appointments` | Rezervasyon işlemleri. |
| `business-settings.actions.ts` | `business` | Zaten taşındı. |
| `business.actions.ts` | `business` | Zaten taşındı. |
| `calendar.actions.ts` | `appointments` | Takvim görünüm aksiyonları. |
| `customer.actions.ts` | `customers` | Müşteri yönetimi. |
| `dash-stats.actions.ts` | `core` | İstatistikler. |
| `discovery.actions.ts` | `business` | Keşfet sekmesi. |
| `family.actions.ts` | `customers` | Müşteri alt grupları. |
| `finance.actions.ts` | `finance` | Finansal işlemler. |
| `inventory.actions.ts` | `inventory` | Stok yönetimi. |
| `notification.actions.ts` | `core` | Bildirimler. |
| `patron.actions.ts` | `business` | İşletme sahibi işlemleri. |
| `reminders.actions.ts` | `appointments` | Hatırlatıcılar. |
| `staff-leave.actions.ts` | `staff` | Personel izinleri. |
| `staff-schedule.actions.ts` | `staff` | Çalışma saatleri. |
| `staff-service.actions.ts` | `staff` | Personel-hizmet eşleşmesi. |
| `staff.actions.ts` | `staff` | Personel yönetimi. |
| `stats.actions.ts` | `core` | Analitik. |
| `user.actions.ts` | `auth` | Kullanıcı işlemleri. |
