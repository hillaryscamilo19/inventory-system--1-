"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { api } from "./api-client"

export type UserRole = "admin" | "delivery_manager" | "auditor" | "employee"

interface AuthContextType {
  user: any | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      api.auth
        .getCurrentUser()
        .then((userData) => {
          setUser(userData)
        })
        .catch(() => {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    setIsLoading(true)
    try {
      console.log("[v0] AuthContext: Starting login for", username)
      const response = await api.auth.login(username, password)

      console.log("[v0] AuthContext: Token received, storing...")
      localStorage.setItem("token", response.access_token)

      // Obtener el usuario real desde el backend
      console.log("[v0] AuthContext: Fetching current user...")
      const userData = await api.auth.getCurrentUser()
      console.log("[v0] AuthContext: User data received", userData)

      localStorage.setItem("user", JSON.stringify(userData))
      setUser(userData)
      router.push("/dashboard")
    } catch (error) {
      console.error("[v0] AuthContext: Login error", error)
      throw new Error(error instanceof Error ? error.message : "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
