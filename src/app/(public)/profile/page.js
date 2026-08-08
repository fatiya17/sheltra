"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bell,
  Pencil,
  Lock,
  User,
  Mail,
  Smartphone,
  ChevronRight,
  Plus,
  Trash2,
  LogOut,
} from "lucide-react"
import { MobileHeader } from "@/components/ui/mobile-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/features/auth/context/auth-context"
import { AuthGuard } from "@/components/auth/auth-guard"
import { DEFAULT_TRUSTED_CONTACTS, SOS_STORAGE_KEYS } from "@/features/sos/constants/sos.constants"

// pilihan avatar dicebear lorelei pastel
const CUTE_OPEN_SOURCE_AVATARS = [
  {
    id: "fatiya",
    name: "Fatiya",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Fatiya&backgroundColor=ffd5dc",
    bg: "bg-[#FFE5EC]",
  },
  {
    id: "alzea",
    name: "Alzea",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Alzea&backgroundColor=ffe4e6",
    bg: "bg-[#FFE4E6]",
  },
  {
    id: "yafie",
    name: "Yafie",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Yafie&backgroundColor=e0f2fe",
    bg: "bg-[#E0F2FE]",
  },
  {
    id: "sally",
    name: "Sally",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Sally&backgroundColor=ffd5dc",
    bg: "bg-[#FFD5DC]",
  },
  {
    id: "nadia",
    name: "Nadia",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Nadia&backgroundColor=fef3c7",
    bg: "bg-[#FEF3C7]",
  },
  {
    id: "zahra",
    name: "Zahra",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Zahra&backgroundColor=f3e8ff",
    bg: "bg-[#F3E8FF]",
  },
  {
    id: "maya",
    name: "Maya",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Maya&backgroundColor=dcfce7",
    bg: "bg-[#DCFCE7]",
  },
  {
    id: "alya",
    name: "Alya",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Alya&backgroundColor=ffedd5",
    bg: "bg-[#FFEDD5]",
  },
]


export default function ProfilePage() {
  const router = useRouter()
  const { user, updateUser, logout } = useAuth()

  // state profil pengguna
  const [userName, setUserName] = useState(user?.name || "Fatiya Khairina")
  const [userEmail, setUserEmail] = useState(user?.email || "fatiya.khairina@sheltra.id")
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || CUTE_OPEN_SOURCE_AVATARS[0])

  React.useEffect(() => {
    if (user?.name) setUserName(user.name)
    if (user?.email) setUserEmail(user.email)
    if (user?.avatar) setSelectedAvatar(user.avatar)
  }, [user])

  // state kontak terpercaya
  const [contacts, setContacts] = useState(DEFAULT_TRUSTED_CONTACTS)

  // load kontak tersimpan di localstorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(SOS_STORAGE_KEYS.CONTACTS)
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setContacts(parsed)
          }
        }
      } catch (e) {}
    }
  }, [])

  // helper simpan kontak ke localstorage
  const persistContacts = (updated) => {
    setContacts(updated)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(SOS_STORAGE_KEYS.CONTACTS, JSON.stringify(updated))
      } catch (e) {}
    }
  }

  // State Modals
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState(null)

  // Form states
  const [tempName, setTempName] = useState(userName)
  const [tempEmail, setTempEmail] = useState(userEmail)
  const [tempUserAvatar, setTempUserAvatar] = useState(selectedAvatar)

  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [contactUsername, setContactUsername] = useState("")
  const [selectedContactAvatar, setSelectedContactAvatar] = useState(CUTE_OPEN_SOURCE_AVATARS[3])

  // Pengaturan preferensi darurat kontak terpercaya
  const [rulesSettings, setRulesSettings] = useState({
    autoShareLocation: true,
    sendSmsFallback: true,
    notifyOnDangerZone: true,
  })

  // load rules dari localstorage
  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem("sheltra_emergency_rules")
      if (raw) {
        const parsed = JSON.parse(raw)
        setRulesSettings((prev) => ({ ...prev, ...parsed }))
      }
    } catch (e) {}
  }, [])

  // simpan rules ke localstorage saat berubah
  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem("sheltra_emergency_rules", JSON.stringify(rulesSettings))
    } catch (e) {}
  }, [rulesSettings])

  // simpan perubahan profil
  const handleSaveProfile = (e) => {
    e.preventDefault()
    const finalName = tempName.trim() || userName
    const finalEmail = tempEmail.trim() || userEmail
    if (tempName.trim()) setUserName(finalName)
    if (tempEmail.trim()) setUserEmail(finalEmail)
    setSelectedAvatar(tempUserAvatar)
    updateUser({
      name: finalName,
      email: finalEmail,
      avatar: tempUserAvatar,
    })
    setIsEditProfileOpen(false)
  }

  // Buka modal Tambah Kontak
  const handleOpenAddContact = () => {
    if (contacts.length >= 5) return
    setEditingContact(null)
    setContactName("")
    setContactPhone("+62")
    setContactUsername("")
    setSelectedContactAvatar(
      CUTE_OPEN_SOURCE_AVATARS[(contacts.length + 3) % CUTE_OPEN_SOURCE_AVATARS.length]
    )
    setIsContactModalOpen(true)
  }

  // Buka modal Edit Kontak
  const handleOpenEditContact = (contact) => {
    setEditingContact(contact)
    setContactName(contact.name)
    setContactPhone(contact.phone)
    setContactUsername(contact.username || "")
    setSelectedContactAvatar(contact.avatar || CUTE_OPEN_SOURCE_AVATARS[0])
    setIsContactModalOpen(true)
  }

  // Simpan Kontak (Tambah / Edit)
  const handleSaveContact = (e) => {
    e.preventDefault()
    if (!contactName.trim() || !contactPhone.trim()) return

    const formattedUsername = contactUsername.trim()
      ? contactUsername.startsWith("@")
        ? contactUsername.trim()
        : `@${contactUsername.trim()}`
      : `@${contactName.toLowerCase().replace(/\s+/g, "_")}`

    if (editingContact) {
      const updated = contacts.map((c) =>
        c.id === editingContact.id
          ? {
              ...c,
              name: contactName.trim(),
              phone: contactPhone.trim(),
              username: formattedUsername,
              avatar: selectedContactAvatar,
              avatarImage: selectedContactAvatar.url,
              avatarBg: selectedContactAvatar.bg,
            }
          : c
      )
      persistContacts(updated)
    } else {
      const newContact = {
        id: `tc-${Date.now()}`,
        name: contactName.trim(),
        relation: "Kontak Darurat",
        phone: contactPhone.trim(),
        username: formattedUsername,
        avatar: selectedContactAvatar,
        avatarImage: selectedContactAvatar.url,
        avatarBg: selectedContactAvatar.bg,
        badgeColor: "bg-emerald-500",
      }
      const updated = [...contacts, newContact]
      persistContacts(updated)
    }
    setIsContactModalOpen(false)
  }

  // Hapus Kontak
  const handleDeleteContact = () => {
    if (!editingContact) return
    const updated = contacts.filter((c) => c.id !== editingContact.id)
    persistContacts(updated)
    setIsContactModalOpen(false)
  }

  // Toggle aturan kontak
  const handleToggleRule = (key) => {
    setRulesSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <AuthGuard>
      <div className="w-full flex flex-col min-h-screen bg-white md:max-w-2xl md:mx-auto select-none pb-24 md:pb-12">
      {/* ========================================================================= */}
      {/* 1. Header Profil (Sama dengan Header Lapor Insiden)                      */}
      {/* ========================================================================= */}
      <MobileHeader
        title="Profile"
        onBack={() => router.back()}
        rightElement={
          <button
            type="button"
            onClick={() => setIsRulesModalOpen(true)}
            className="relative p-2 -mr-2 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Notifikasi & Ketentuan"
          >
            <Bell className="w-5 h-5 text-slate-800" strokeWidth={2.2} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-white" />
          </button>
        }
      />

      <div className="flex-1 px-4 sm:px-6 py-2 space-y-5">
        {/* ========================================================================= */}
        {/* 2. Avatar & Info Header (Open Source Avatar Lucu, Nama, Email, Edit Pen) */}
        {/* ========================================================================= */}
        <div className="flex flex-col items-center text-center space-y-2.5 pt-1">
          <div className="relative group">
            <div
              className={`w-28 h-28 rounded-full ${selectedAvatar.bg} border-4 border-white shadow-md flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-105`}
            >
              <img
                src={selectedAvatar.url}
                alt={selectedAvatar.name}
                className="w-24 h-24 object-contain"
                loading="eager"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setTempName(userName)
                setTempEmail(userEmail)
                setTempUserAvatar(selectedAvatar)
                setIsEditProfileOpen(true)
              }}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-white border border-neutral-200 shadow-xs text-neutral-700 hover:text-primary transition-colors"
              title="Ubah Profil & Avatar"
            >
              <Pencil className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="text-xl font-bold text-primary tracking-tight">{userName}</h2>
              <button
                type="button"
                onClick={() => {
                  setTempName(userName)
                  setTempEmail(userEmail)
                  setTempUserAvatar(selectedAvatar)
                  setIsEditProfileOpen(true)
                }}
                className="text-neutral-400 hover:text-neutral-600 transition-colors p-0.5"
                aria-label="Edit Nama"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-neutral-400 font-medium mt-0.5">{userEmail}</p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. Stat Bar (3 Columns Card with vertical dividers)                      */}
        {/* ========================================================================= */}
        <Card className="rounded-2xl border border-neutral-100 shadow-xs bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-3 divide-x divide-neutral-100 py-3 text-center">
              <div className="px-2">
                <p className="text-xl font-bold text-neutral-900 leading-tight">11</p>
                <p className="text-[11px] font-medium text-neutral-400 mt-0.5">Rute Terlindungi</p>
              </div>

              <div className="px-2">
                <p className="text-xl font-bold text-neutral-900 leading-tight">{contacts.length}</p>
                <p className="text-[11px] font-medium text-neutral-400 mt-0.5">Kontak Siaga</p>
              </div>

              <div className="px-2">
                <p className="text-xl font-bold text-neutral-900 leading-tight">14</p>
                <p className="text-[11px] font-medium text-neutral-400 mt-0.5">Hari Aman</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* 4. Section: Kontak Terpercaya (Avatar Open Source Lucu Maks 5 & Bisa Edit)*/}
        {/* ========================================================================= */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Kontak Terpercaya
            </h3>
            <span className="text-[10px] font-semibold text-neutral-400">
              {contacts.length}/5 Kontak
            </span>
          </div>

          <Card className="rounded-2xl border border-primary/20 bg-primary/[0.03] shadow-xs p-4">
            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
              {/* Daftar Avatar Kontak Open Source Lucu */}
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleOpenEditContact(contact)}
                  className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group transition-transform active:scale-95"
                >
                  <div
                    className={`w-14 h-14 rounded-full ${contact.avatar?.bg || "bg-pink-100"} border-2 border-white shadow-xs flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105 relative`}
                  >
                    <img
                      src={contact.avatar?.url || CUTE_OPEN_SOURCE_AVATARS[0].url}
                      alt={contact.name}
                      className="w-12 h-12 object-contain"
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-xs">
                      <Pencil className="w-2.5 h-2.5 text-neutral-600" />
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-neutral-800 truncate max-w-[64px] text-center">
                    {contact.name}
                  </span>
                  <span className="text-[9px] text-neutral-400 truncate max-w-[64px] text-center -mt-0.5">
                    {contact.username}
                  </span>
                </div>
              ))}

              {/* Tombol Tambah Kontak (Bila < 5) */}
              {contacts.length < 5 && (
                <div
                  onClick={handleOpenAddContact}
                  className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group transition-transform active:scale-95"
                >
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-primary/40 bg-white flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors shadow-xs">
                    <Plus className="w-5 h-5 stroke-[2.4]" />
                  </div>
                  <span className="text-[11px] font-semibold text-primary text-center">
                    Tambah
                  </span>
                  <span className="text-[9px] text-neutral-400 text-center -mt-0.5">
                    Max 5
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* 5. Section: Aturan Darurat (Style Rute Teraman, Tanpa Icon)             */}
        {/* ========================================================================= */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Aturan Darurat
            </h3>
            <button
              type="button"
              onClick={() => setIsRulesModalOpen(true)}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              Lihat Ketentuan
            </button>
          </div>

          <Card className="rounded-2xl border border-primary/20 bg-primary/[0.03] shadow-xs p-4 space-y-3">
            <div className="space-y-1 pb-2 border-b border-primary/10">
              <p className="text-xs font-semibold text-neutral-900">
                Protokol Siaga & Penanganan SOS
              </p>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                Saat tombol SOS dipicu, koordinat GPS darurat pengguna dinilai oleh model tingkat
                risiko serta memprioritaskan rujukan Safe Points terdekat dan disiarkan ke kontak
                terdaftar.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between py-0.5">
                <div>
                  <p className="text-xs font-semibold text-neutral-800">
                    Kirim Lokasi Live Otomatis
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    Bagikan tautan rute ke kontak terpercaya saat SOS aktif
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={rulesSettings.autoShareLocation}
                  onChange={() => handleToggleRule("autoShareLocation")}
                  className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-primary accent-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-0.5">
                <div>
                  <p className="text-xs font-semibold text-neutral-800">
                    Fallback SMS Darurat
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    Kirim SMS jika koneksi internet terputus atau lemah
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={rulesSettings.sendSmsFallback}
                  onChange={() => handleToggleRule("sendSmsFallback")}
                  className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-primary accent-primary cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between py-0.5">
                <div>
                  <p className="text-xs font-semibold text-neutral-800">
                    Peringatan Zona Risiko Tinggi
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    Kirim status siaga jika melintasi area rawan malam
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={rulesSettings.notifyOnDangerZone}
                  onChange={() => handleToggleRule("notifyOnDangerZone")}
                  className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-primary accent-primary cursor-pointer"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* 6. Section: Akun & Keamanan (Tanpa Rounded Background, Padding Kecil)     */}
        {/* ========================================================================= */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-1">
            Akun & Keamanan
          </h3>

          <Card className="rounded-2xl border border-neutral-100 shadow-xs bg-white overflow-hidden divide-y divide-neutral-100">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full flex items-center justify-between py-2.5 px-3.5 hover:bg-neutral-50 active:bg-neutral-100 transition-colors text-left group"
            >
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-neutral-600" />
                <span className="text-xs font-semibold text-neutral-700 group-hover:text-neutral-900">
                  Ubah Kata Sandi
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setTempName(userName)
                setTempEmail(userEmail)
                setTempUserAvatar(selectedAvatar)
                setIsEditProfileOpen(true)
              }}
              className="w-full flex items-center justify-between py-2.5 px-3.5 hover:bg-neutral-50 active:bg-neutral-100 transition-colors text-left group"
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-neutral-600" />
                <span className="text-xs font-semibold text-neutral-700 group-hover:text-neutral-900">
                  Informasi Pribadi
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsRulesModalOpen(true)}
              className="w-full flex items-center justify-between py-2.5 px-3.5 hover:bg-neutral-50 active:bg-neutral-100 transition-colors text-left group"
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-neutral-600" />
                <span className="text-xs font-semibold text-neutral-700 group-hover:text-neutral-900">
                  Preferensi Notifikasi & Email
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 transition-transform group-hover:translate-x-0.5" />
            </button>

            <div className="w-full flex items-center justify-between py-2.5 px-3.5 text-left">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-neutral-600" />
                <div>
                  <span className="text-xs font-semibold text-neutral-700">Perangkat Aktif</span>
                  <p className="text-[10px] text-neutral-400">Mobile Browser / iPhone</p>
                </div>
              </div>
              <Badge variant="default" className="text-[10px] bg-primary text-white border-transparent px-2 py-0.5">
                Terhubung
              </Badge>
            </div>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* tombol keluar akun */}
        <div className="pt-2">
          <Button
            type="button"
            variant="default"
            onClick={logout}
            className="w-full h-11 rounded-full text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Keluar dari Akun
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: Edit / Tambah Kontak Terpercaya (Pilih Avatar Lucu, Nama, dll)  */}
      {/* ========================================================================= */}
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900">
              {editingContact ? "Edit Kontak Terpercaya" : "Tambah Kontak Terpercaya"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveContact} className="space-y-4 pt-2">
            {/* Pilihan Avatar Lucu untuk Kontak */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-neutral-700">
                Pilih Avatar Kontak
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {CUTE_OPEN_SOURCE_AVATARS.map((avatar) => {
                  const isSelected = selectedContactAvatar?.id === avatar.id
                  return (
                    <button
                      type="button"
                      key={avatar.id}
                      onClick={() => setSelectedContactAvatar(avatar)}
                      className={`flex flex-col items-center p-1.5 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-xs scale-105"
                          : "border-neutral-100 hover:border-neutral-200 bg-neutral-50/50"
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-full ${avatar.bg} flex items-center justify-center overflow-hidden mb-1`}>
                        <img src={avatar.url} alt={avatar.name} className="w-9 h-9 object-contain" />
                      </div>
                      <span className="text-[9px] font-semibold text-neutral-700 truncate w-full text-center">
                        {avatar.name.split(" ")[0]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactName" className="text-xs font-semibold text-neutral-700">
                Nama Lengkap
              </Label>
              <Input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Contoh: Alzea"
                className="h-10 text-xs rounded-xl border-neutral-200 focus-visible:ring-primary"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactPhone" className="text-xs font-semibold text-neutral-700">
                Nomor HP (WhatsApp)
              </Label>
              <Input
                id="contactPhone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+6281234567890"
                className="h-10 text-xs rounded-xl border-neutral-200 focus-visible:ring-primary"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactUsername" className="text-xs font-semibold text-neutral-700">
                Username / Panggilan
              </Label>
              <Input
                id="contactUsername"
                value={contactUsername}
                onChange={(e) => setContactUsername(e.target.value)}
                placeholder="@alzea"
                className="h-10 text-xs rounded-xl border-neutral-200 focus-visible:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-2.5 pt-3">
              <Button
                type="submit"
                variant="default"
                className="w-full h-11 rounded-full text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs"
              >
                Simpan Perubahan
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setIsContactModalOpen(false)}
                className="w-full h-11 rounded-full text-xs font-semibold border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
              >
                Batal
              </Button>

              {editingContact && (
                <button
                  type="button"
                  onClick={handleDeleteContact}
                  className="w-full pt-1 text-center text-xs text-red-500 hover:text-red-700 font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Kontak Ini
                </button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: Edit Profil Pengguna & Avatar Lucu                               */}
      {/* ========================================================================= */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900">
              Edit Informasi Profil
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-neutral-700">
                Pilih Avatar Lucu
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {CUTE_OPEN_SOURCE_AVATARS.map((avatar) => {
                  const isSelected = tempUserAvatar?.id === avatar.id
                  return (
                    <button
                      type="button"
                      key={avatar.id}
                      onClick={() => setTempUserAvatar(avatar)}
                      className={`flex flex-col items-center p-1.5 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-xs scale-105"
                          : "border-neutral-100 hover:border-neutral-200 bg-neutral-50/50"
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-full ${avatar.bg} flex items-center justify-center overflow-hidden mb-1`}>
                        <img src={avatar.url} alt={avatar.name} className="w-9 h-9 object-contain" />
                      </div>
                      <span className="text-[9px] font-semibold text-neutral-700 truncate w-full text-center">
                        {avatar.name.split(" ")[0]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-neutral-700">
                Nama Lengkap
              </Label>
              <Input
                id="name"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Masukkan nama..."
                className="h-10 text-xs rounded-xl border-neutral-200 focus-visible:ring-primary"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-neutral-700">
                Alamat Email
              </Label>
              <Input
                id="email"
                type="email"
                value={tempEmail}
                onChange={(e) => setTempEmail(e.target.value)}
                placeholder="email@sheltra.id"
                className="h-10 text-xs rounded-xl border-neutral-200 focus-visible:ring-primary"
                required
              />
            </div>

            <div className="flex flex-col gap-2.5 pt-3">
              <Button
                type="submit"
                variant="default"
                className="w-full h-11 rounded-full text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs"
              >
                Simpan Perubahan
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditProfileOpen(false)}
                className="w-full h-11 rounded-full text-xs font-semibold border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
              >
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: Ubah Kata Sandi                                                 */}
      {/* ========================================================================= */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900">
              Ubah Kata Sandi
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              setIsPasswordModalOpen(false)
            }}
            className="space-y-3.5 pt-2"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-700">
                Kata Sandi Saat Ini
              </Label>
              <Input
                type="password"
                placeholder="••••••••"
                className="h-10 text-xs rounded-xl border-neutral-200 focus-visible:ring-primary"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-700">
                Kata Sandi Baru
              </Label>
              <Input
                type="password"
                placeholder="Minimal 8 karakter"
                className="h-10 text-xs rounded-xl border-neutral-200 focus-visible:ring-primary"
                required
              />
            </div>

            <div className="flex flex-col gap-2.5 pt-3">
              <Button
                type="submit"
                variant="default"
                className="w-full h-11 rounded-full text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs"
              >
                Simpan Perubahan
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordModalOpen(false)}
                className="w-full h-11 rounded-full text-xs font-semibold border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
              >
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 4: Detail Ketentuan Aturan Kontak Terpercaya (Tanpa Icon)           */}
      {/* ========================================================================= */}
      <Dialog open={isRulesModalOpen} onOpenChange={setIsRulesModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-neutral-900">
              Aturan & Ketentuan Kontak Terpercaya
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 text-xs text-neutral-600 pt-2">
            <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1.5">
              <p className="font-semibold text-neutral-900 text-xs">
                1. Kriteria Kontak yang Disarankan
              </p>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Pilihlah orang terdekat (keluarga, pasangan, atau sahabat) yang dapat dihubungi
                24 jam dan memiliki akses cepat ke nomor darurat atau pertolongan pertama.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1.5">
              <p className="font-semibold text-neutral-900 text-xs">
                2. Batas Kuota Kontak
              </p>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Setiap akun dapat mendaftarkan hingga maksimal 5 kontak untuk memastikan pengiriman
                broadcast SOS instan tanpa latensi jaringan.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-1.5">
              <p className="font-semibold text-neutral-900 text-xs">
                3. Transparansi Privasi Lokasi
              </p>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Lokasi GPS Anda tidak pernah dibagikan secara permanen. Pelacakan live location
                hanya aktif saat fitur SOS dipicu atau saat Guardian Mode berjalan.
              </p>
            </div>
          </div>

          <div className="pt-3">
            <Button
              type="button"
              variant="default"
              onClick={() => setIsRulesModalOpen(false)}
              className="w-full h-11 rounded-full text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs"
            >
              Saya Mengerti
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </AuthGuard>
  )
}

