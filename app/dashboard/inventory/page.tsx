"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, AlertTriangle, Package, TrendingDown, TrendingUp } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Product {
  id: number
  name: string
  category: string
  stock_actual: number
  stock_minimo: number
  unit?: string
  estado: boolean
  talla?: string
  fecha_vencimiento?: string
  fecha_ingreso: string
  created_at: string
  updated_at: string
}

export default function InventoryPage() {
  const { user } = useAuth()
  const [uniformes, setUniformes] = useState<Product[]>([])
  const [medicamentos, setMedicamentos] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "uniform",
    stock_actual: 0,
    stock_minimo: 10,
    fecha_vencimiento: "",
  })

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [uniformes, medicamentos, searchTerm, categoryFilter, stockFilter])

  async function loadProducts() {
    try {
      const [uniformesData, medicamentosData] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://10.0.0.15:8000"}/uniforme`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }).then((res) => res.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://10.0.0.15:8000"}/medicamento`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }).then((res) => res.json()),
      ])

      const uniformesWithCategory = uniformesData.map((u: any) => ({ ...u, category: "uniform" }))
      const medicamentosWithCategory = medicamentosData.map((m: any) => ({ ...m, category: "medication" }))

      setUniformes(uniformesWithCategory)
      setMedicamentos(medicamentosWithCategory)
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  function filterProducts() {
    let allProducts = [...uniformes, ...medicamentos]

    // Search filter
    if (searchTerm) {
      allProducts = allProducts.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Category filter
    if (categoryFilter === "uniform") {
      allProducts = uniformes
    } else if (categoryFilter === "medication") {
      allProducts = medicamentos
    }

    // Stock level filter
    if (stockFilter === "low") {
      allProducts = allProducts.filter((p) => p.stock_actual <= p.stock_minimo && p.stock_actual > 0)
    } else if (stockFilter === "out") {
      allProducts = allProducts.filter((p) => p.stock_actual === 0)
    }

    setFilteredProducts(allProducts)
  }

  function getStockStatus(product: Product) {
    if (product.stock_actual === 0) {
      return { label: "Sin Stock", variant: "destructive" as const, icon: AlertTriangle }
    } else if (product.stock_actual <= product.stock_minimo) {
      return { label: "Stock Bajo", variant: "warning" as const, icon: TrendingDown }
    } else {
      return { label: "Stock Normal", variant: "default" as const, icon: TrendingUp }
    }
  }

  const allProducts = [...uniformes, ...medicamentos]
  const stats = {
    total: allProducts.length,
    lowStock: allProducts.filter((p) => p.stock_actual <= p.stock_minimo && p.stock_actual > 0).length,
    outOfStock: allProducts.filter((p) => p.stock_actual === 0).length,
    uniforms: uniformes.length,
    medications: medicamentos.length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Cargando inventario...</div>
      </div>
    )
  }

  async function handleAddProduct() {
    try {
      if (!newProduct.name) {
        alert("El nombre del producto es requerido")
        return
      }

      if (!newProduct.fecha_vencimiento) {
        alert("La fecha de vencimiento es requerida")
        return
      }

      const endpoint = newProduct.category === "uniform" ? "/uniforme" : "/medicamento"

      const now = new Date().toISOString()
      const productData = {
        name: newProduct.name.trim(),
        stock_actual: Number(newProduct.stock_actual),
        stock_minimo: Number(newProduct.stock_minimo),
        fecha_vencimiento: `${newProduct.fecha_vencimiento}T00:00:00Z`,
        estado: Number(newProduct.stock_actual) > 0,
        fecha_ingreso: now,
        created_at: now,
        updated_at: now,
      }

      console.log("[v0] Sending product data:", JSON.stringify(productData, null, 2))
      console.log("[v0] Endpoint:", `${process.env.NEXT_PUBLIC_API_URL || "http://1.0.0.0.15:8000"}${endpoint}`)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://10.0.0.15:8000"}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(productData),
      })

      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Error response:", JSON.stringify(errorData, null, 2))

        // Extract validation errors if present
        let errorMessage = "Error al agregar producto"
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Pydantic validation errors
            errorMessage = errorData.detail.map((err: any) => `${err.loc.join(".")}: ${err.msg}`).join("\n")
          } else if (typeof errorData.detail === "string") {
            errorMessage = errorData.detail
          } else {
            errorMessage = JSON.stringify(errorData.detail)
          }
        }

        alert(`Error al agregar producto:\n${errorMessage}`)
        return
      }

      const result = await response.json()
      console.log("[v0] Success response:", result)

      setIsAddDialogOpen(false)
      setNewProduct({
        name: "",
        category: "uniform",
        stock_actual: 0,
        stock_minimo: 10,
        fecha_vencimiento: "",
      })
      loadProducts()
    } catch (error) {
      console.error("[v0] Error adding product:", error)
      alert("Error al agregar producto. Por favor intenta de nuevo.")
    }
  }

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Gestión y control de uniformes y medicamentos</p>
        </div>
        {(user?.role === "admin" || user?.role === "delivery_manager") && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Agregar Producto</span>
                <span className="sm:hidden">Agregar</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Producto</DialogTitle>
                <DialogDescription>Ingresa los detalles del nuevo producto al inventario</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uniform">Uniforme</SelectItem>
                      <SelectItem value="medication">Medicamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre del Producto</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder={newProduct.category === "uniform" ? "Ej: Camisa azul" : "Ej: Ibuprofeno"}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stock_actual">Stock Actual</Label>
                    <Input
                      id="stock_actual"
                      type="number"
                      min="0"
                      value={newProduct.stock_actual}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, stock_actual: Number.parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="stock_minimo">Stock Mínimo</Label>
                    <Input
                      id="stock_minimo"
                      type="number"
                      min="0"
                      value={newProduct.stock_minimo}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, stock_minimo: Number.parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fecha_vencimiento">
                    Fecha de Vencimiento <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fecha_vencimiento"
                    type="date"
                    value={newProduct.fecha_vencimiento}
                    onChange={(e) => setNewProduct({ ...newProduct, fecha_vencimiento: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {newProduct.category === "uniform"
                      ? "Fecha estimada de desgaste o reemplazo"
                      : "Fecha de caducidad del medicamento"}
                  </p>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddProduct}
                  className="w-full sm:w-auto"
                  disabled={!newProduct.name || !newProduct.fecha_vencimiento}
                >
                  Agregar Producto
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-2 md:gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg shrink-0">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">Total Productos</p>
              <p className="text-lg md:text-xl lg:text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 md:p-2 bg-orange-500/10 rounded-lg shrink-0">
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">Stock Bajo</p>
              <p className="text-lg md:text-xl lg:text-2xl font-bold text-orange-500">{stats.lowStock}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 md:p-2 bg-red-500/10 rounded-lg shrink-0">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">Sin Stock</p>
              <p className="text-lg md:text-xl lg:text-2xl font-bold text-red-500">{stats.outOfStock}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 md:p-2 bg-blue-500/10 rounded-lg shrink-0">
              <Package className="h-4 w-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">Uniformes</p>
              <p className="text-lg md:text-xl lg:text-2xl font-bold">{stats.uniforms}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 md:p-2 bg-green-500/10 rounded-lg shrink-0">
              <Package className="h-4 w-4 text-green-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">Medicamentos</p>
              <p className="text-lg md:text-xl lg:text-2xl font-bold">{stats.medications}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-3">
        <div className="flex flex-col gap-2 md:gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 md:h-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="uniform">Uniformes</SelectItem>
                <SelectItem value="medication">Medicamentos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="low">Stock bajo</SelectItem>
                <SelectItem value="out">Sin stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px] text-xs md:text-sm">Producto</TableHead>
                <TableHead className="min-w-[100px] text-xs md:text-sm">Categoría</TableHead>
                <TableHead className="min-w-[120px] text-xs md:text-sm">Talla/Venc.</TableHead>
                <TableHead className="text-right min-w-[90px] text-xs md:text-sm">Stock</TableHead>
                <TableHead className="text-right min-w-[90px] text-xs md:text-sm">Mínimo</TableHead>
                <TableHead className="min-w-[110px] text-xs md:text-sm">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs md:text-sm text-muted-foreground">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const status = getStockStatus(product)
                  const StatusIcon = status.icon
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="font-medium text-xs md:text-sm">{product.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] md:text-xs">
                          {product.category === "uniform" ? "Uniforme" : "Medicamento"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs md:text-sm text-muted-foreground">
                        {product.talla || product.fecha_vencimiento || "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs md:text-sm">
                        {product.stock_actual}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs md:text-sm">
                        {product.stock_minimo}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1 text-[10px] md:text-xs">
                          <StatusIcon className="h-3 w-3" />
                          <span className="hidden sm:inline">{status.label}</span>
                          <span className="sm:hidden">
                            {status.label === "Sin Stock" ? "Sin" : status.label === "Stock Bajo" ? "Bajo" : "OK"}
                          </span>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
