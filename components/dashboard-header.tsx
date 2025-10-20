"use client"

import { useAuth } from "@/lib/auth-context"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function DashboardHeader() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div>
        <h1 className="text-xl font-semibold">Bienvenido, {user?.name}</h1>
        <p className="text-sm text-muted-foreground">{user?.area}</p>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            3
          </Badge>
        </Button>
      </div>
    </header>
  )
}
