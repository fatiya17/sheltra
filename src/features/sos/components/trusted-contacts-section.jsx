"use client"

import React, { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { AVATAR_PRESETS } from "../constants/sos.constants"

export function TrustedContactsSection({
  contacts = [],
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  readOnly = false,
}) {
  const [isOpenModal, setIsOpenModal] = useState(false)
  const [editingContact, setEditingContact] = useState(null)

  // form state modal kontak
  const [name, setName] = useState("")
  const [relation, setRelation] = useState("")
  const [phone, setPhone] = useState("")
  const [selectedBg, setSelectedBg] = useState(AVATAR_PRESETS[0].bg)

  // buka modal tambah kontak
  const handleOpenAdd = () => {
    setEditingContact(null)
    setName("")
    setRelation("")
    setPhone("+62")
    setSelectedBg(AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)].bg)
    setIsOpenModal(true)
  }

  // buka modal edit kontak
  const handleOpenEdit = (contact) => {
    setEditingContact(contact)
    setName(contact.name)
    setRelation(contact.relation)
    setPhone(contact.phone)
    setSelectedBg(contact.avatarBg || AVATAR_PRESETS[0].bg)
    setIsOpenModal(true)
  }

  // submit form kontak
  const handleSaveContact = (e) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return

    const initial = name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()

    if (editingContact) {
      onUpdateContact?.(editingContact.id, {
        name,
        relation: relation || "Kontak Darurat",
        phone,
        avatarBg: selectedBg,
        avatarInitial: initial,
      })
    } else {
      onAddContact?.({
        name,
        relation: relation || "Kontak Darurat",
        phone,
        avatarBg: selectedBg,
        badgeColor: "bg-emerald-500",
        avatarInitial: initial,
        isPrimary: contacts.length === 0,
      })
    }
    setIsOpenModal(false)
  }

  return (
    <Card className="rounded-2xl border-none shadow-sm bg-white/90 backdrop-blur-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4 sm:px-5">
        <div>
          <CardTitle className="text-sm sm:text-base font-bold text-foreground">
            Kontak Tepercaya
          </CardTitle>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Menerima live location saat SOS aktif
          </p>
        </div>

        {/* tombol tambah kontak */}
        {!readOnly && (
          <Button
            variant="outline"
            size="xs"
            onClick={handleOpenAdd}
            disabled={contacts.length >= 5}
            className="rounded-full text-xs font-semibold h-7 px-3 border-border hover:bg-primary/20 hover:text-foreground"
          >
            <Plus className="w-3 h-3 mr-1" />
            Tambah
          </Button>
        )}
      </CardHeader>

      <CardContent className="px-4 sm:px-5 pb-4 pt-1">
        {/* list avatar horizontal scroll di mobile */}
        <div className="flex items-center gap-4 sm:gap-5 overflow-x-auto pb-1 no-scrollbar">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => !readOnly && handleOpenEdit(contact)}
              className="flex flex-col items-center group relative min-w-[68px] focus:outline-none cursor-pointer"
            >
              {/* avatar bulat */}
              <div className="relative">
                <div
                  className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full border flex items-center justify-center shadow-xs transition-transform duration-150 group-hover:scale-105 ${
                    contact.avatarBg || "bg-rose-100 text-rose-700 border-rose-200"
                  }`}
                >
                  <span className="font-bold text-xs sm:text-sm">
                    {contact.avatarInitial || contact.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>

                {/* status dot siaga */}
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                    contact.badgeColor || "bg-emerald-500"
                  }`}
                />
              </div>

              {/* nama kontak */}
              <span className="text-xs font-semibold text-foreground mt-1.5 text-center truncate max-w-[72px]">
                {contact.name}
              </span>

              {/* relasi kontak */}
              <span className="text-[10px] text-muted-foreground text-center truncate max-w-[72px]">
                {contact.relation}
              </span>
            </button>
          ))}

          {/* tombol tambah cepat lingkaran */}
          {!readOnly && contacts.length < 5 && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex flex-col items-center min-w-[68px] group focus:outline-none cursor-pointer"
            >
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-muted-foreground mt-1.5">Baru</span>
            </button>
          )}
        </div>
      </CardContent>

      {/* modal dialog tambah / edit kontak */}
      <Dialog open={isOpenModal} onOpenChange={setIsOpenModal}>
        <DialogContent className="max-w-sm rounded-2xl p-5 bg-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingContact ? "Ubah Kontak Tepercaya" : "Tambah Kontak Tepercaya"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveContact} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Lengkap / Panggilan</Label>
              <Input
                placeholder="Contoh: Ibu, Yafie, Sally"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Hubungan / Relasi</Label>
              <Input
                placeholder="Contoh: Orang Tua, Pasangan, Sahabat"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Nomor WhatsApp / HP</Label>
              <Input
                placeholder="+628123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Pilihan Warna Avatar</Label>
              <div className="flex items-center gap-2 pt-1">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedBg(preset.bg)}
                    className={`w-7 h-7 rounded-full border transition-transform ${preset.bg} ${
                      selectedBg === preset.bg ? "scale-110 ring-2 ring-primary ring-offset-2" : ""
                    }`}
                  />
                ))}
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between gap-2 pt-3">
              {editingContact && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    onDeleteContact?.(editingContact.id)
                    setIsOpenModal(false)
                  }}
                  className="gap-1 text-xs h-8"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpenModal(false)}
                  className="text-xs h-8"
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" className="text-xs font-semibold h-8">
                  Simpan
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
