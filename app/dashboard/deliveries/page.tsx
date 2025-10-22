"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, CheckCircle2, Package } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface Product {
  id: number
  name: string
  stock_actual: number
}

interface Employee {
  id: number
  CodigoEmpleado: string
  nombre: string
  apellido: string
  cargo: string
  area: string
}

export default function DeliveriesPage() {
  const { user } = useAuth()
  const [uniformes, setUniformes] = useState<Product[]>([])
  const [medicamentos, setMedicamentos] = useState<Product[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    empleado_id: "",
    product_type: "uniform",
    product_id: "",
    cantidad: "",
    size: "",
    firma: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const [uniformsRes, medicationsRes, employeesRes, uniformDelRes, medDelRes] = await Promise.all([
        fetch("http://10.0.0.15:8000/uniforme", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://10.0.0.15:8000/medicamento", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://10.0.0.15:8000/api/empleado/", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://10.0.0.15:8000/uniforme/entrega", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://10.0.0.15:8000/medicamento/entrega", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (uniformsRes.ok) setUniformes(await uniformsRes.json())
      if (medicationsRes.ok) setMedicamentos(await medicationsRes.json())
      if (employeesRes.ok) setEmployees(await employeesRes.json())

      const allDeliveries = []
      if (uniformDelRes.ok) {
        const data = await uniformDelRes.json()
        allDeliveries.push(...data.map((d: any) => ({ ...d, type: "uniform" })))
      }
      if (medDelRes.ok) {
        const data = await medDelRes.json()
        allDeliveries.push(...data.map((d: any) => ({ ...d, type: "medication" })))
      }

      allDeliveries.sort((a, b) => new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime())
      setDeliveries(allDeliveries)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.firma.trim()) {
      alert("Por favor ingrese su firma digital")
      return
    }

    setLoading(true)
    const token = localStorage.getItem("token")

    try {
      const endpoint =
        formData.product_type === "uniform"
          ? "http://10.0.0.15:8000/uniforme/entrega"
          : "http://10.0.0.15:8000/medicamento/entrega"

      const payload: any = {
        [`${formData.product_type === "uniform" ? "uniforme" : "medicamento"}_id`]: Number.parseInt(
          formData.product_id,
        ),
        empleado_id: Number.parseInt(formData.empleado_id),
        cantidad: Number.parseInt(formData.cantidad),
        Area: employees.find((e) => e.id === Number.parseInt(formData.empleado_id))?.area || "",
        firma: formData.firma,
      }

      if (formData.product_type === "uniform") {
        payload.size = formData.size
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Error al registrar la entrega")

      setFormData({
        empleado_id: "",
        product_type: "uniform",
        product_id: "",
        cantidad: "",
        size: "",
        firma: "",
      })
      setShowForm(false)
      loadData()

      alert("Entrega registrada exitosamente")
    } catch (error) {
      console.error("Error creating delivery:", error)
      alert("Error al registrar la entrega")
    } finally {
      setLoading(false)
    }
  }

  const products = formData.product_type === "uniform" ? uniformes : medicamentos
  const selectedEmployee = employees.find((e) => e.id === Number.parseInt(formData.empleado_id))
  const selectedProduct = products.find((p) => p.id === Number.parseInt(formData.product_id))

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Entregas a Empleados</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Registro de recepción de uniformes y medicamentos
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <ClipboardList className="h-4 w-4 mr-2" />
            Nueva Entrega
          </Button>
        )}
      </div>

      {/* Delivery Form */}
      {showForm && (
        <Card className="p-4 md:p-6">
          <div className="mb-4">
            <h2 className="text-lg md:text-xl font-semibold">Confirmar Recepción de Material</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Complete el formulario para confirmar la recepción
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="employee_id">Empleado *</Label>
                <Select
                  value={formData.empleado_id}
                  onValueChange={(value) => setFormData({ ...formData, empleado_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione su nombre" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.nombre} - {employee.CodigoEmpleado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedEmployee && (
                  <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                    <p>
                      <span className="font-medium">Área:</span> {selectedEmployee.area}
                    </p>
                    <p>
                      <span className="font-medium">Código:</span> {selectedEmployee.CodigoEmpleado}
                    </p>
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="product_type">Tipo de Material *</Label>
                <Select
                  value={formData.product_type}
                  onValueChange={(value) => setFormData({ ...formData, product_type: value, product_id: "" })}
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
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name} (Disponible: {product.stock_actual})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProduct && (
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <p>
                          <span className="font-medium">Stock disponible:</span> {selectedProduct.stock_actual} unidades
                        </p>
                      </div>
                      <Package className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="quantity">Cantidad Recibida *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedProduct?.stock_actual || 999}
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  required
                />
              </div>

              {formData.product_type === "uniform" && (
                <div>
                  <Label htmlFor="size">Talla *</Label>
                  <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione talla" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XS">XS</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                      <SelectItem value="XXL">XXL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="md:col-span-2">
                <Label htmlFor="signature">Firma Digital (Nombre Completo) *</Label>
                <Input
                  id="signature"
                  value={formData.firma}
                  onChange={(e) => setFormData({ ...formData, firma: e.target.value })}
                  placeholder="Escriba su nombre completo como firma"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Al firmar, confirmo que he recibido el material en las condiciones especificadas
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setFormData({
                    empleado_id: "",
                    product_type: "uniform",
                    product_id: "",
                    cantidad: "",
                    size: "",
                    firma: "",
                  })
                }}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {loading ? "Registrando..." : "Confirmar Recepción"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClipboardList className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">Total Entregas</p>
              <p className="text-xl md:text-2xl font-bold">{deliveries.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Package className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">Uniformes</p>
              <p className="text-xl md:text-2xl font-bold">{deliveries.filter((d) => d.type === "uniform").length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Package className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">Medicamentos</p>
              <p className="text-xl md:text-2xl font-bold">
                {deliveries.filter((d) => d.type === "medication").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-3 md:p-4 border-b">
          <h2 className="text-base md:text-lg font-semibold">Historial de Entregas</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[80px]">ID</TableHead>
                <TableHead className="min-w-[100px]">Tipo</TableHead>
                <TableHead className="min-w-[100px]">Cantidad</TableHead>
                <TableHead className="min-w-[100px]">Área</TableHead>
                <TableHead className="min-w-[80px]">Talla</TableHead>
                <TableHead className="min-w-[100px]">Firma</TableHead>
                <TableHead className="min-w-[120px]">Fecha</TableHead>
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
                    <TableCell className="font-mono text-xs md:text-sm">{delivery.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {delivery.type === "uniform" ? "Uniforme" : "Medicamento"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm md:text-base">{delivery.cantidad}</TableCell>
                    <TableCell className="text-sm md:text-base">{delivery.Area}</TableCell>
                    <TableCell className="text-sm md:text-base">{delivery.size || "-"}</TableCell>
                    <TableCell>
                      {delivery.firma ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" />
                          <span className="text-xs md:text-sm">Firmado</span>
                        </div>
                      ) : (
                        <span className="text-xs md:text-sm text-muted-foreground">Sin firma</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">
                      {new Date(delivery.fecha_ingreso).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
