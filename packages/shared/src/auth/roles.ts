export type UserRole = "super_admin" | "patron" | "personel" | "musteri" | "user"

export function getDashboardPath(role: UserRole): string {
  const paths: Record<UserRole, string> = {
    super_admin: "/admin-dashboard",
    patron: "/patron-dashboard",
    personel: "/personel-panel",
    musteri: "/musteri-panel",
    user: "/"
  }

  return paths[role]
}
