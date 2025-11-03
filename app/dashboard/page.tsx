"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { api, DashboardStats } from "@/lib/api-client"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    console.log("[v0] Dashboard: Fetching stats from backend...")

    api.dashboard
      .getStats()
      .then((data) => {
        console.log("[v0] Dashboard: Stats received:", data)
        if (mounted) setStats(data)
      })
      .catch((err) => {
        console.error("[v0] Dashboard: Error fetching stats:", err)
        if (mounted) setError(err.message)
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Resumen general del inventario</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-destructive font-semibold">Error al cargar datos del backend</p>
              <p className="text-sm text-muted-foreground">{error || "Datos no disponibles"}</p>
              <p className="text-xs text-muted-foreground mt-4">
                Verifica que el backend esté corriendo en: {process.env.NEXT_PUBLIC_API_URL || "http://10.0.0.15:8000"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total en Stock",
      value: stats.total_stock?.toLocaleString() ?? "0",
      icon: Package,
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Entradas del Mes",
      value: stats.entries_this_month?.toString() ?? "0",
      icon: TrendingUp,
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Salidas del Mes",
      value: stats.exits_this_month?.toString() ?? "0",
      icon: TrendingDown,
      trend: "-3%",
      trendUp: false,
    },
    {
      title: "Alertas de Stock",
      value: stats.low_stock_alerts?.toString() ?? "0",
      icon: AlertTriangle,
      trend: "Crítico",
      trendUp: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Resumen general del inventario</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${stat.trendUp ? "text-green-600" : "text-red-600"}`}>
                  {stat.trend} desde el mes pasado
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(stats.recent_activity?.length ?? 0) > 0 ? (
                stats.recent_activity!.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.date
                          ? new Date(activity.date).toLocaleString("es-ES")
                          : "Fecha no disponible"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay actividad reciente disponible</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos con Stock Bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(stats.low_stock_products?.length ?? 0) > 0 ? (
                stats.low_stock_products!.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <span className="text-sm">{product.name}</span>
                    <span className="text-sm font-medium text-destructive">
                      {product.current_stock} / {product.minimum_stock} unidades
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay productos con stock bajo</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
