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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, CheckCircle2, Package } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface Product {
  id: string
  code: string
  name: string
  category: string
  unit: string
  current_stock: number
}

interface Employee {
  id: string
  employee_code: string
  full_name: string
  area: string
}

interface Delivery {
  id: string
  exit_number: string
  quantity: number
  exit_date: string
  movement_type: string
  status: string
  signature_data: string | null
  created_at: string
  products: {
    name: string
    code: string
    category: string
    unit: string
  }
  employees: {
    full_name: string
    employee_code: string
    area: string
  }
}

export default function DeliveriesPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [signature, setSignature] = useState("")
  const [formData, setFormData] = useState({
    employee_id: "",
    product_id: "",
    quantity: "",
    delivery_date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  useEffect(() => {
    loadProducts()
    loadEmployees()
    loadDeliveries()
  }, [])

  async function loadProducts() {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name, category, unit, current_stock")
        .eq("status", "active")
        .gt("current_stock", 0)
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

  async function loadDeliveries() {
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("stock_exits")
        .select(`
          *,
          products (name, code, category, unit),
          employees (full_name, employee_code, area)
        `)
        .eq("movement_type", "delivered")
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) throw error
      setDeliveries(data || [])
    } catch (error) {
      console.error("Error loading deliveries:", error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!signature.trim()) {
      alert("Por favor ingrese su firma digital")
      return
    }

    setLoading(true)

    try {
      const supabase = getSupabase()

      // Validate stock
      const product = products.find((p) => p.id === formData.product_id)
      const quantity = Number.parseInt(formData.quantity)

      if (product && product.current_stock < quantity) {
        alert("Stock insuficiente para esta entrega")
        setLoading(false)
        return
      }

      // Generate delivery number
      const deliveryNumber = `DEL-${Date.now()}`

      const { error } = await supabase.from("stock_exits").insert({
        exit_number: deliveryNumber,
        product_id: formData.product_id,
        employee_id: formData.employee_id,
        quantity,
        movement_type: "delivered",
        exit_date: formData.delivery_date,
        status: "completed",
        signature_data: signature,
        notes: formData.notes || null,
        registered_by: user?.name || "Sistema",
      })

      if (error) throw error

      // Reset form
      setFormData({
        employee_id: "",
        product_id: "",
        quantity: "",
        delivery_date: new Date().toISOString().split("T")[0],
        notes: "",
      })
      setSignature("")
      setShowForm(false)
      loadDeliveries()
      loadProducts()

      alert("Entrega registrada exitosamente")
    } catch (error) {
      console.error("Error creating delivery:", error)
      alert("Error al registrar la entrega")
    } finally {
      setLoading(false)
    }
  }

  const selectedEmployee = employees.find((e) => e.id === formData.employee_id)
  const selectedProduct = products.find((p) => p.id === formData.product_id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entregas a Empleados</h1>
          <p className="text-muted-foreground mt-1">Registro de recepción de uniformes y medicamentos</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <ClipboardList className="h-4 w-4 mr-2" />
            Nueva Entrega
          </Button>
        )}
      </div>

      {/* Delivery Form */}
      {showForm && (
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Confirmar Recepción de Material</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Complete el formulario para confirmar la recepción de uniformes o medicamentos
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Employee Selection */}
              <div className="md:col-span-2">
                <Label htmlFor="employee_id">Empleado *</Label>
                <Select
                  value={formData.employee_id}
                  onValueChange={(value) => setFormData({ ...formData, employee_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione su nombre" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.full_name} - {employee.employee_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedEmployee && (
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">Área:</span> {selectedEmployee.area}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Código:</span> {selectedEmployee.employee_code}
                    </p>
                  </div>
                )}
              </div>

              {/* Product Selection */}
              <div className="md:col-span-2">
                <Label htmlFor="product_id">Material Recibido *</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el material" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {product.code} (Disponible: {product.current_stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProduct && (
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">Tipo:</span>{" "}
                          {selectedProduct.category === "uniform" ? "Uniforme" : "Medicamento"}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Stock disponible:</span> {selectedProduct.current_stock}{" "}
                          {selectedProduct.unit}
                        </p>
                      </div>
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div>
                <Label htmlFor="quantity">Cantidad Recibida *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedProduct?.current_stock || 999}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>

              {/* Date */}
              <div>
                <Label htmlFor="delivery_date">Fecha de Recepción *</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  required
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <Label htmlFor="notes">Observaciones</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Ingrese cualquier observación sobre el material recibido"
                />
              </div>

              {/* Digital Signature */}
              <div className="md:col-span-2">
                <Label htmlFor="signature">Firma Digital (Nombre Completo) *</Label>
                <Input
                  id="signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Escriba su nombre completo como firma"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Al firmar, confirmo que he recibido el material en las condiciones especificadas
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    employee_id: "",
                    product_id: "",
                    quantity: "",
                    delivery_date: new Date().toISOString().split("T")[0],
                    notes: "",
                  })
                  setSignature("")
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {loading ? "Registrando..." : "Confirmar Recepción"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Entregas</p>
              <p className="text-2xl font-bold">{deliveries.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uniformes Entregados</p>
              <p className="text-2xl font-bold">{deliveries.filter((d) => d.products.category === "uniform").length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Package className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Medicamentos Entregados</p>
              <p className="text-2xl font-bold">
                {deliveries.filter((d) => d.products.category === "medication").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Deliveries History */}
      <Card>
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Historial de Entregas</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Empleado</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Firma</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay entregas registradas
                </TableCell>
              </TableRow>
            ) : (
              deliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-mono text-sm">{delivery.exit_number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{delivery.employees.full_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {delivery.employees.employee_code} - {delivery.employees.area}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{delivery.products.name}</div>
                      <div className="text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {delivery.products.category === "uniform" ? "Uniforme" : "Medicamento"}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {delivery.quantity} {delivery.products.unit}
                  </TableCell>
                  <TableCell>{new Date(delivery.exit_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {delivery.signature_data ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">Firmado</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin firma</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">Completado</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
