"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  Package,
  ClipboardList,
  FileText,
  Users,
  LogOut,
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "delivery_manager", "auditor"] },
  { name: "Inventario", href: "/dashboard/inventory", icon: Package, roles: ["admin", "delivery_manager", "auditor"] },
  { name: "Entradas", href: "/dashboard/entries", icon: ArrowUpCircle, roles: ["admin", "delivery_manager"] },
  { name: "Salidas", href: "/dashboard/exits", icon: ArrowDownCircle, roles: ["admin", "delivery_manager"] },
  {
    name: "Entregas",
    href: "/dashboard/deliveries",
    icon: ClipboardList,
    roles: ["admin", "delivery_manager", "employee"],
  },
  { name: "Reportes", href: "/dashboard/reports", icon: FileText, roles: ["admin", "auditor"] },
  { name: "Usuarios", href: "/dashboard/users", icon: Users, roles: ["admin"] },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const filteredNavigation = navigation.filter((item) => user && item.roles.includes(user.role))

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Package className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">Inventario</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
   {!user ? (
  <p className="text-sm text-muted-foreground px-3">Cargando usuario...</p>
) : filteredNavigation.length > 0 ? (
  filteredNavigation.map((item) => {
    const Icon = item.icon
    const isActive = pathname === item.href
    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
        {item.name}
      </Link>
    )
  })
) : (
  <p className="text-sm text-muted-foreground px-3">No hay opciones disponibles</p>
)}


      </nav>

      <div className="border-t border-border p-4">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <p className="mt-1 text-xs text-muted-foreground capitalize">{user?.role.replace("_", " ")}</p>
        </div>
        <Button variant="outline" className="w-full justify-start bg-transparent" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
