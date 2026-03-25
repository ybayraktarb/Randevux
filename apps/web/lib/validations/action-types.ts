/**
 * Tüm server action'lar için standart sonuç tipi.
 * Başarıda: { success: true, data?: T }
 * Hata durumunda: { success: false, error: { field?: string, message: string } }
 */
export type ActionResult<T = undefined> =
    | { success: true; data?: T }
    | { success: false; error: { field?: string; message: string } }
