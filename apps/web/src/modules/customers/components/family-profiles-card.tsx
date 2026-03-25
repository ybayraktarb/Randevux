"use client"

import { useState } from "react"
import { Users, Plus, X, Trash2, Loader2 } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { cn } from "@/lib/utils"

interface FamilyProfile {
  id: string
  full_name: string
  relationship: string
}

interface FamilyProfilesCardProps {
  familyProfiles: FamilyProfile[]
  loading: boolean
  onAdd: (name: string, relationship: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const RELATIONSHIPS = ["Çocuk", "Eş", "Ebeveyn", "Kardeş", "Diğer"]

export function FamilyProfilesCard({
  familyProfiles,
  loading,
  onAdd,
  onDelete,
}: FamilyProfilesCardProps) {
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newRel, setNewRel] = useState("Çocuk")

  const handleSubmit = async () => {
    if (!newName.trim()) return
    await onAdd(newName.trim(), newRel)
    setNewName("")
    setShowForm(false)
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h3 className="font-semibold">Aile Profilleri</h3>
        </div>
        <RxButton
          size="sm"
          variant="secondary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <X className="size-4" /> : <Plus className="size-4" />}
        </RxButton>
      </div>

      {showForm && (
        <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5 animate-in slide-in-from-top-2 duration-200">
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <label className="text-xs font-bold">Ad Soyad</label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Örn: Mehmet Yılmaz"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs font-bold">Yakınlık Derecesi</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={newRel}
                onChange={(e) => setNewRel(e.target.value)}
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <RxButton size="sm" className="w-full mt-1" onClick={handleSubmit}>
              Ekle
            </RxButton>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : familyProfiles.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-4">
            Henüz ekli aile profili yok.
          </p>
        ) : (
          familyProfiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/50"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {profile.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{profile.full_name}</span>
                  <span className="text-[11px] text-muted-foreground">{profile.relationship}</span>
                </div>
              </div>
              <button
                onClick={() => onDelete(profile.id)}
                className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
