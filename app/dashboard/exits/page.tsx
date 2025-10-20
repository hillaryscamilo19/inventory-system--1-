"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getSupabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowDownCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface Product {
  id: string
  code: string
  name: string
  unit: string
  current_stock: number
}

interface Employee {
  id: string
  employee_code: string
  full_name: string
  area: string
}

interface StockExit {
  id: string
  exit_number: string
  quantity: number
  exit_date: string
  movement_type: string
  status: string
  registered_by: string
  created_at: string
  products: {
    name: string
    code: string
    unit: string
  }
  employees: {
    full_name: string
    employee_code: string
    area: string
  }
}

export default function ExitsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [exits, setExits] = useState<StockExit[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    product_id: "",
    employee_id: "",
    quantity: "",
    movement_type: "delivered",
    exit_date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  useEffect(() => {
    loadProducts()
    loadEmployees()
    loadExits()
  }, [])

  async function loadProducts() {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name, unit, current_stock")
        .eq("status", "active")
        .order("name")

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("Error loading products:", error)
    }
  }

  async function loadEmployees() {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("employees")
        .select("id, employee_code, full_name, area")
        .eq("status", "active")
        .order("full_name")

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error("Error loading employees:", error)
    }
  }

  async function loadExits() {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("stock_exits")
        .select(`
          *,
          products (name, code, unit),
          employees (full_name, employee_code, area)
        `)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      setExits(data || [])
    } catch (error) {
      console.error("Error loading exits:", error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabase()

      // Validate stock availability
      const product = products.find((p) => p.id === formData.product_id)
      const quantity = Number.parseInt(formData.quantity)

      if (formData.movement_type === "delivered" && product && product.current_stock < quantity) {
        alert("Stock insuficiente para realizar esta salida")
        setLoading(false)
        return
      }

      // Generate exit number
      const exitNumber = `SAL-${Date.now()}`

      const { error } = await supabase.from("stock_exits").insert({
        exit_number: exitNumber,
        product_id: formData.product_id,
        employee_id: formData.employee_id,
        quantity,
        movement_type: formData.movement_type,
        exit_date: formData.exit_date,
        status: "completed",
        notes: formData.notes || null,
        registered_by: user?.name || "Sistema",
      })

      if (error) throw error

      // Reset form and reload data
      setFormData({
        product_id: "",
        employee_id: "",
        quantity: "",
        movement_type: "delivered",
        exit_date: new Date().toISOString().split("T")[0],
        notes: "",
      })
      setIsDialogOpen(false)
      loadExits()
      loadProducts() // Reload to update stock display

      alert("Salida registrada exitosamente")
    } catch (error) {
      console.error("Error creating exit:", error)
      alert("Error al registrar la salida")
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = products.find((p) => p.id === formData.product_id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Salidas de Stock</h1>
          <p className="text-muted-foreground mt-1">Registro de entregas y devoluciones de inventario</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Salida
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Salida de Stock</DialogTitle>
              <DialogDescription>Complete los datos de la salida del inventario</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="product_id">Producto *</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.code} - {product.name} (Stock: {product.current_stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProduct && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Stock disponible: {selectedProduct.current_stock} {selectedProduct.unit}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="employee_id">Empleado *</Label>
                  <Select
                    value={formData.employee_id}
                    onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.employee_code} - {employee.full_name} ({employee.area})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="quantity">Cantidad *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="movement_type">Tipo de Movimiento *</Label>
                  <Select
                    value={formData.movement_type}
                    onValueChange={(value) => setFormData({ ...formData, movement_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivered">Entregado</SelectItem>
                      <SelectItem value="returned">Devuelto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="exit_date">Fecha de Salida *</Label>
                  <Input
                    id="exit_date"
                    type="date"
                    value={formData.exit_date}
                    onChange={(e) => setFormData({ ...formData, exit_date: e.target.value })}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Registrando..." : "Registrar Salida"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 rounded-lg">
            <ArrowDownCircle className="h-8 w-8 text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Salidas</p>
            <p className="text-3xl font-bold">{exits.length}</p>
          </div>
        </div>
      </Card>

      {/* Exits Table */}
      <Card>
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Historial de Salidas</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Empleado</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Registrado por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay salidas registradas
                </TableCell>
              </TableRow>
            ) : (
              exits.map((exit) => (
                <TableRow key={exit.id}>
                  <TableCell className="font-mono text-sm">{exit.exit_number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{exit.products.name}</div>
                      <div className="text-sm text-muted-foreground">{exit.products.code}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{exit.employees.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {exit.employees.employee_code} - {exit.employees.area}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {exit.quantity} {exit.products.unit}
                  </TableCell>
                  <TableCell>
                    <Badge variant={exit.movement_type === "delivered" ? "default" : "secondary"}>
                      {exit.movement_type === "delivered" ? "Entregado" : "Devuelto"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(exit.exit_date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{exit.registered_by}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
