-- staff_business tablosuna role kolonu ekliyoruz
-- Personellerin işletme içindeki seviyesini (staff / manager) belirlemek için kullanılır.

ALTER TABLE staff_business
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'staff';

-- Eğer role kolonunda constraint istiyorsak (isteğe bağlı):
-- ALTER TABLE staff_business ADD CONSTRAINT check_staff_role CHECK (role IN ('staff', 'manager'));
