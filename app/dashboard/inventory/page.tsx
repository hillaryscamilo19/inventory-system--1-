"use client"

import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, AlertTriangle, Package, TrendingDown, TrendingUp } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface Product {
  id: string
  code: string
  name: string
  category: string
  subcategory: string
  current_stock: number
  minimum_stock: number
  unit: string
  location: string
  status: string
}

export default function InventoryPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, categoryFilter, stockFilter])

  async function loadProducts() {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase.from("products").select("*").eq("status", "active").order("name")

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  function filterProducts() {
    let filtered = [...products]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.code.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter)
    }

    // Stock level filter
    if (stockFilter === "low") {
      filtered = filtered.filter((p) => p.current_stock <= p.minimum_stock)
    } else if (stockFilter === "out") {
      filtered = filtered.filter((p) => p.current_stock === 0)
    }

    setFilteredProducts(filtered)
  }

  function getStockStatus(product: Product) {
    if (product.current_stock === 0) {
      return { label: "Sin Stock", variant: "destructive" as const, icon: AlertTriangle }
    } else if (product.current_stock <= product.minimum_stock) {
      return { label: "Stock Bajo", variant: "warning" as const, icon: TrendingDown }
    } else {
      return { label: "Stock Normal", variant: "default" as const, icon: TrendingUp }
    }
  }

  const stats = {
    total: products.length,
    lowStock: products.filter((p) => p.current_stock <= p.minimum_stock && p.current_stock > 0).length,
    outOfStock: products.filter((p) => p.current_stock === 0).length,
    uniforms: products.filter((p) => p.category === "uniform").length,
    medications: products.filter((p) => p.category === "medication").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Cargando inventario...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground mt-1">Gestión y control de uniformes y medicamentos</p>
        </div>
        {(user?.role === "admin" || user?.role === "delivery_manager") && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Producto
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Productos</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <TrendingDown className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stock Bajo</p>
              <p className="text-2xl font-bold text-orange-500">{stats.lowStock}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sin Stock</p>
              <p className="text-2xl font-bold text-red-500">{stats.outOfStock}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uniformes</p>
              <p className="text-2xl font-bold">{stats.uniforms}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Package className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Medicamentos</p>
              <p className="text-2xl font-bold">{stats.medications}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="uniform">Uniformes</SelectItem>
              <SelectItem value="medication">Medicamentos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Estado de stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="low">Stock bajo</SelectItem>
              <SelectItem value="out">Sin stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Products Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead className="text-right">Stock Actual</TableHead>
              <TableHead className="text-right">Stock Mínimo</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No se encontraron productos
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const status = getStockStatus(product)
                const StatusIcon = status.icon
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">{product.code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.subcategory}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.category === "uniform" ? "Uniforme" : "Medicamento"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{product.location}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {product.current_stock} {product.unit}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {product.minimum_stock} {product.unit}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
