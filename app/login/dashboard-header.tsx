"use client"

import { useAuth } from "@/lib/auth-context"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function DashboardHeader() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-10 flex h-14 md:h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6 lg:pl-6">
      <div className="lg:pl-0 pl-12">
        <h1 className="text-base md:text-xl font-semibold">Bienvenido, {user?.name}</h1>
        <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">{user?.area}</p>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" className="relative h-8 w-8 md:h-10 md:w-10">
          <Bell className="h-4 w-4 md:h-5 md:w-5" />
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 h-4 w-4 md:h-5 md:w-5 rounded-full p-0 text-[10px] md:text-xs flex items-center justify-center"
          >
            3
          </Badge>
        </Button>
      </div>
    </header>
  )
}
