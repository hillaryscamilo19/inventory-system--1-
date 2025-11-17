"use client"
/**
 * Este archivo define la página de Inventario del sistema.
 * "use client" indica que este componente se ejecutará del lado del cliente
 * en Next.js (Client Component).
 */

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
// Componente visual para mostrar carga mientras llegan los datos..
import { useAuth } from "@/lib/auth-context"
//Componente  del Dashboard-nav para todas la rutas.
import { DashboardNav } from "@/components/dashboard-nav"
//Componente del Dashboard-header principal.
import { DashboardHeader } from "@/app/login/dashboard-header"

export default function DashboardLayout({children,}: {children: React.ReactNode}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  //Codicion de que si el usuario no esta logueado no te redirecciona ala ruta del Login.
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  //Si el usuario se esta logueado correctamente saldra un mensaje de Cargando.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }


// si el usuario es contrario devuelve null
  if (!user) {
    return null
  }


  //Retorna el panel de menu de navegacion y el header.
  return (
    <div className="flex h-screen">
      <DashboardNav />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
