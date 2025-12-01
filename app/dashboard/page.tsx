"use client";
// ⚠️ Indica que este componente debe ejecutarse en el cliente (Next.js Client Component).
// Esto permite usar hooks como useState y useEffect, que no funcionan en componentes del servidor.

import { useEffect, useState } from "react";
// Hooks de React para manejar estado y efectos secundarios.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Componentes de interfaz basados en Shadcn UI.

import { Package, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
// Iconos usados en las tarjetas de estadísticas.

import { Skeleton } from "@/components/ui/skeleton";
// Componente visual para mostrar carga mientras llegan los datos.

import { api, DashboardStats } from "@/lib/api-client";
// Cliente personalizado que realiza peticiones al backend.
// DashboardStats define la estructura que deben tener los datos recibidos.

export default function DashboardPage() {
  // -------------------------------------------------------------
  // ESTADOS PRINCIPALES DEL COMPONENTE
  // -------------------------------------------------------------

  // Guarda los datos de estadísticas enviados por el backend.
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Controla si los datos aún están cargando.
  // Se usa para mostrar Skeletons.
  const [isLoading, setIsLoading] = useState(true);

  // Guarda cualquier error ocurrido durante la petición al backend.
  const [error, setError] = useState<string | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [filteredProducts, setFilteredProducts] = useState<DashboardStats[]>(
    []
  );

  // ================================================================
  // PAGINACIÓN: calcula página actual
  // =================================================================
  const lowStockProducts = stats?.low_stock_products ?? [];
  const totalPages = Math.ceil(lowStockProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // -------------------------------------------------------------
  // useEffect: Obtiene las estadísticas cuando carga la página.
  // -------------------------------------------------------------
  // - Llama al endpoint del backend.
  // - Actualiza estados según éxito o error.
  // - Usa la bandera `mounted` para evitar actualizar el estado
  //   si el componente ya fue desmontado (buena práctica en React).
  // -------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    console.log("[v0] Dashboard: Fetching stats from backend...");

    api.dashboard
      .getStats() // Petición al servidor
      .then((data) => {
        console.log("[v0] Dashboard: Stats received:", data);

        // Si el componente sigue montado, guardamos los datos.
        if (mounted) setStats(data);
      })

      .catch((err) => {
        console.error("[v0] Dashboard: Error fetching stats:", err);

        // Solo guardamos el error si el componente sigue montado.
        if (mounted) setError(err.message);
      })

      .finally(() => {
        // Cuando termina la petición (éxito o error), quitamos el modo "loading".
        if (mounted) setIsLoading(false);
      });

    // Cleanup function: evita actualizar estado después del desmontado.
    return () => {
      mounted = false;
    };
  }, []); // Se ejecuta solo una vez al cargar el componente.

  // ------------------------------------------------------------------
  // PANTALLA DE CARGA (LOADING).
  // ------------------------------------------------------------------
  // Mientras isLoading está en true, se muestran componentes Skeleton.
  // Esto da la sensación de que la página está cargando datos.
  // ------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>

        {/* Cuatro tarjetas simuladas mientras llegan los datos */}
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
    );
  }

  // -------------------------------------------------------------
  // MANEJO DE ERRORES
  // -------------------------------------------------------------
  // Si ocurrió un error o los datos no existen,
  // se muestra un mensaje de error al usuario.
  // -------------------------------------------------------------
  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Resumen general del inventario
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-destructive font-semibold">
                Error al cargar datos del backend
              </p>

              {/* Mostrar mensaje del error si existe */}
              <p className="text-sm text-muted-foreground">
                {error || "Datos no disponibles"}
              </p>

              {/* Mostrar URL esperada del servidor */}
              <p className="text-xs text-muted-foreground mt-4">
                Verifica que el backend esté corriendo en:{" "}
                {process.env.NEXT_PUBLIC_API_URL || " http://10.0.0.15:8000"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // -------------------------------------------------------------
  // CONFIGURACIÓN DE TARJETAS DE ESTADÍSTICAS
  // -------------------------------------------------------------
  // Estas tarjetas se renderizan dinámicamente en la vista.
  // Cada una tiene:
  // - título
  // - valor numérico
  // - ícono
  // - tendencia (sube o baja)
  // ---------------------------------------------------------------
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
  ];

  // -------------------------------------------------------------
  // RENDER PRINCIPAL DEL DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Título principal */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Resumen general del inventario</p>
      </div>

      {/* ---------------------------------------------------------
         TARJETAS DE ESTADÍSTICAS
         ----------------------------------------------------------
      */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>

                {/* Ícono dinámico */}
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>

              <CardContent>
                {/* Valor principal */}
                <div className="text-2xl font-bold">{stat.value}</div>

                {/* Tendencia verde o roja */}
                <p
                  className={`text-xs ${
                    stat.trendUp ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.trend} desde el mes pasado
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ---------------------------------------------------------
         SECCIÓN: ACTIVIDAD RECIENTE
         ----------------------------------------------------------
      */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {(stats.recent_activity?.length ?? 0) > 0 ? (
                // Mapeo de actividades recientes
                stats.recent_activity!.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4">
                    {/* Punto indicador */}
                    <div className="h-2 w-2 rounded-full bg-primary" />

                    {/* Información del evento */}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {activity.description}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {activity.date
                          ? new Date(activity.date).toLocaleString("es-ES")
                          : "Fecha no disponible"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay actividad reciente disponible
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ---------------------------------------------------------
           SECCIÓN: PRODUCTOS CON STOCK BAJO
           ----------------------------------------------------------
        */}
        <Card>
          <CardHeader>
            <CardTitle>Productos con Stock Bajo</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {currentProducts.length > 0 ? (
                currentProducts.lo.map((product) => (
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

              {/* Controles de paginado */}
              {lowStockProducts.length > itemsPerPage && (
                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    ← Anterior
                  </button>

                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
