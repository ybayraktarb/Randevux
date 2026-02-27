import { describe, it, expect } from "vitest"
import { getDashboardPath } from "@/lib/supabase/roles"

describe("getDashboardPath", () => {
    it("returns /admin-dashboard for super_admin", () => {
        expect(getDashboardPath("super_admin")).toBe("/admin-dashboard")
    })

    it("returns /patron-dashboard for patron", () => {
        expect(getDashboardPath("patron")).toBe("/patron-dashboard")
    })

    it("returns /personel-panel for personel", () => {
        expect(getDashboardPath("personel")).toBe("/personel-panel")
    })

    it("returns /musteri-panel for musteri", () => {
        expect(getDashboardPath("musteri")).toBe("/musteri-panel")
    })
})
