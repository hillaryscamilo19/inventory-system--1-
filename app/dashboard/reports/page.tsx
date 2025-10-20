"use client"

import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download, Filter, TrendingUp, TrendingDown } from "lucide-react"

interface ReportData {
  id: string
  number: string
  date: string
  type: "entry" | "exit"
  product_name: string
  product_code: string
  category: string
  quantity: number
  unit: string
  employee_name?: string
  employee_code?: string
  area?: string
  supplier?: string
  registered_by: string
  notes?: string
}

interface Product {
  id: string
  code: string
  name: string
}

interface Employee {
  id: string
  employee_code: string
  full_name: string
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    productId: "all",
    employeeId: "all",
    category: "all",
    type: "all",
  })

  useEffect(() => {
    loadProducts()
    loadEmployees()
  }, [])

  useEffect(() => {
    if (filters.startDate || filters.endDate) {
      loadReportData()
    }
  }, [filters])

  async function loadProducts() {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase.from("products").select("id, code, name").order("name")

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error loading products:", error)
    }
  }

  async function loadEmployees() {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase.from("employees").select("id, employee_code, full_name").order("full_name")

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error("Error loading employees:", error)
    }
  }

  async function loadReportData() {
    setLoading(true)
    try {
      const supabase = getSupabase()
      const allData: ReportData[] = []

      // Load entries
      if (filters.type === "all" || filters.type === "entry") {
        let entriesQuery = supabase
          .from("stock_entries")
          .select(
            `
          id,
          entry_number,
          entry_date,
          quantity,
          supplier,
          registered_by,
          notes,
          products (code, name, category, unit)
        `,
          )
          .order("entry_date", { ascending: false })

        if (filters.startDate) {
          entriesQuery = entriesQuery.gte("entry_date", filters.startDate)
        }
        if (filters.endDate) {
          entriesQuery = entriesQuery.lte("entry_date", filters.endDate)
        }
        if (filters.productId !== "all") {
          entriesQuery = entriesQuery.eq("product_id", filters.productId)
        }

        const { data: entries, error: entriesError } = await entriesQuery

        if (entriesError) throw entriesError

        entries?.forEach((entry: any) => {
          if (filters.category === "all" || entry.products.category === filters.category) {
            allData.push({
              id: entry.id,
              number: entry.entry_number,
              date: entry.entry_date,
              type: "entry",
              product_name: entry.products.name,
              product_code: entry.products.code,
              category: entry.products.category,
              quantity: entry.quantity,
              unit: entry.products.unit,
              supplier: entry.supplier,
              registered_by: entry.registered_by,
              notes: entry.notes,
            })
          }
        })
      }

      // Load exits
      if (filters.type === "all" || filters.type === "exit") {
        let exitsQuery = supabase
          .from("stock_exits")
          .select(
            `
          id,
          exit_number,
          exit_date,
          quantity,
          registered_by,
          notes,
          products (code, name, category, unit),
          employees (employee_code, full_name, area)
        `,
          )
          .order("exit_date", { ascending: false })

        if (filters.startDate) {
          exitsQuery = exitsQuery.gte("exit_date", filters.startDate)
        }
        if (filters.endDate) {
          exitsQuery = exitsQuery.lte("exit_date", filters.endDate)
        }
        if (filters.productId !== "all") {
          exitsQuery = exitsQuery.eq("product_id", filters.productId)
        }
        if (filters.employeeId !== "all") {
          exitsQuery = exitsQuery.eq("employee_id", filters.employeeId)
        }

        const { data: exits, error: exitsError } = await exitsQuery

        if (exitsError) throw exitsError

        exits?.forEach((exit: any) => {
          if (filters.category === "all" || exit.products.category === filters.category) {
            allData.push({
              id: exit.id,
              number: exit.exit_number,
              date: exit.exit_date,
              type: "exit",
              product_name: exit.products.name,
              product_code: exit.products.code,
              category: exit.products.category,
              quantity: exit.quantity,
              unit: exit.products.unit,
              employee_name: exit.employees.full_name,
              employee_code: exit.employees.employee_code,
              area: exit.employees.area,
              registered_by: exit.registered_by,
              notes: exit.notes,
            })
          }
        })
      }

      // Sort by date
      allData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setReportData(allData)
    } catch (error) {
      console.error("Error loading report data:", error)
    } finally {
      setLoading(false)
    }
  }

  function exportToCSV() {
    if (reportData.length === 0) {
      alert("No hay datos para exportar")
      return
    }

    const headers = [
      "Número",
      "Tipo",
      "Fecha",
      "Producto",
      "Código",
      "Categoría",
      "Cantidad",
      "Unidad",
      "Empleado",
      "Código Empleado",
      "Área",
      "Proveedor",
      "Registrado por",
      "Notas",
    ]

    const rows = reportData.map((item) => [
      item.number,
      item.type === "entry" ? "Entrada" : "Salida",
      new Date(item.date).toLocaleDateString(),
      item.product_name,
      item.product_code,
      item.category === "uniform" ? "Uniforme" : "Medicamento",
      item.quantity,
      item.unit,
      item.employee_name || "-",
      item.employee_code || "-",
      item.area || "-",
      item.supplier || "-",
      item.registered_by,
      item.notes || "-",
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `reporte_inventario_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const stats = {
    totalMovements: reportData.length,
    totalEntries: reportData.filter((r) => r.type === "entry").length,
    totalExits: reportData.filter((r) => r.type === "exit").length,
    totalQuantityIn: reportData.filter((r) => r.type === "entry").reduce((sum, r) => sum + r.quantity, 0),
    totalQuantityOut: reportData.filter((r) => r.type === "exit").reduce((sum, r) => sum + r.quantity, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes y Auditoría</h1>
          <p className="text-muted-foreground mt-1">Historial completo de movimientos de inventario</p>
        </div>
        <Button onClick={exportToCSV} disabled={reportData.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Filtros de Búsqueda</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="startDate">Fecha Inicio</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="endDate">Fecha Fin</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo de Movimiento</Label>
            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="entry">Entradas</SelectItem>
                <SelectItem value="exit">Salidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="uniform">Uniformes</SelectItem>
                <SelectItem value="medication">Medicamentos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="productId">Producto</Label>
            <Select value={filters.productId} onValueChange={(value) => setFilters({ ...filters, productId: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los productos</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.code} - {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="employeeId">Empleado</Label>
            <Select value={filters.employeeId} onValueChange={(value) => setFilters({ ...filters, employeeId: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los empleados</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.employee_code} - {employee.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={loadReportData} disabled={loading}>
            <FileText className="h-4 w-4 mr-2" />
            {loading ? "Generando..." : "Generar Reporte"}
          </Button>
        </div>
      </Card>

      {/* Stats */}
      {reportData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Movimientos</p>
                <p className="text-2xl font-bold">{stats.totalMovements}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entradas</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalEntries}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <TrendingDown className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Salidas</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalExits}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cantidad Ingresada</p>
                <p className="text-2xl font-bold">{stats.totalQuantityIn}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingDown className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cantidad Entregada</p>
                <p className="text-2xl font-bold">{stats.totalQuantityOut}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Report Table */}
      <Card>
        <Tabs defaultValue="all" className="w-full">
          <div className="border-b px-4 pt-4">
            <TabsList>
              <TabsTrigger value="all">Todos los Movimientos</TabsTrigger>
              <TabsTrigger value="entries">Entradas</TabsTrigger>
              <TabsTrigger value="exits">Salidas</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Empleado/Proveedor</TableHead>
                  <TableHead>Registrado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Cargando datos...
                    </TableCell>
                  </TableRow>
                ) : reportData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Seleccione un rango de fechas y genere el reporte
                    </TableCell>
                  </TableRow>
                ) : (
                  reportData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">{item.number}</TableCell>
                      <TableCell>
                        <Badge variant={item.type === "entry" ? "default" : "secondary"}>
                          {item.type === "entry" ? "Entrada" : "Salida"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-sm text-muted-foreground">{item.product_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell>
                        {item.type === "exit" ? (
                          <div>
                            <div className="font-medium">{item.employee_name}</div>
                            <div className="text-sm text-muted-foreground">{item.area}</div>
                          </div>
                        ) : (
                          <div className="text-sm">{item.supplier}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.registered_by}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="entries" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Registrado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.filter((r) => r.type === "entry").length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay entradas en el período seleccionado
                    </TableCell>
                  </TableRow>
                ) : (
                  reportData
                    .filter((r) => r.type === "entry")
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">{item.number}</TableCell>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.product_name}</div>
                            <div className="text-sm text-muted-foreground">{item.product_code}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell>{item.supplier}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.registered_by}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="exits" className="m-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Registrado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.filter((r) => r.type === "exit").length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No hay salidas en el período seleccionado
                    </TableCell>
                  </TableRow>
                ) : (
                  reportData
                    .filter((r) => r.type === "exit")
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">{item.number}</TableCell>
                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.product_name}</div>
                            <div className="text-sm text-muted-foreground">{item.product_code}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell className="font-medium">{item.employee_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.area}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.registered_by}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
