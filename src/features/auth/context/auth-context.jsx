"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export const DEFAULT_USER = {
  name: "Fatiya Khairina",
  email: "fatiya.khairina@sheltra.id",
  avatar: {
    id: "fatiya",
    name: "Fatiya",
    url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Fatiya&backgroundColor=ffd5dc",
    bg: "bg-[#FFE5EC]",
  },
}

const AuthContext = createContext({
  isAuthenticated: false,
  isLoading: true,
  user: DEFAULT_USER,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
})

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(DEFAULT_USER)
  const router = useRouter()

  useEffect(() => {
    try {
      const storedAuth = typeof window !== "undefined" ? localStorage.getItem("sheltra_auth") : null
      const storedUser = typeof window !== "undefined" ? localStorage.getItem("sheltra_user") : null

      if (storedAuth === "true") {
        setIsAuthenticated(true)
      }
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch (e) {
      console.error("Failed to load auth from localStorage", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = (userData = {}, redirectPath = "/") => {
    const updatedUser = {
      ...DEFAULT_USER,
      ...user,
      ...userData,
    }
    setIsAuthenticated(true)
    setUser(updatedUser)
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("sheltra_auth", "true")
        localStorage.setItem("sheltra_user", JSON.stringify(updatedUser))
      }
    } catch (e) {
      console.error("Failed to save auth to localStorage", e)
    }
    if (redirectPath) {
      router.push(redirectPath)
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("sheltra_auth")
      }
    } catch (e) {
      console.error("Failed to clear auth from localStorage", e)
    }
    router.push("/")
  }

  const updateUser = (newUserData) => {
    setUser((prev) => {
      const next = { ...prev, ...newUserData }
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem("sheltra_user", JSON.stringify(next))
        }
      } catch (e) {
        console.error("Failed to save user to localStorage", e)
      }
      return next
    })
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
