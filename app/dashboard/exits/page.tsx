"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, ArrowDownCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface Product {
  id: number
  name: string
  stock_actual: number
  stock_minimo: number
}

interface Employee {
  id: number
  CodigoEmpleado: string
  nombre: string
  apellido: string
  cargo: string
  area: string
}

interface Delivery {
  id: number
  cantidad: number
  area: string
  size?: string
  firma: string
  created_by: string
}

export default function ExitsPage() {
  const { user } = useAuth()
  const [uniformes, setUniformes] = useState<Product[]>([])
  const [medicamentos, setMedicamentos] = useState<Product[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [uniformDeliveries, setUniformDeliveries] = useState<any[]>([])
  const [medicationDeliveries, setMedicationDeliveries] = useState<any[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    product_type: "uniform",
    product_id: "",
    empleado_id: "",
    cantidad: "",
    size: "",
    exit_date: new Date().toISOString().split("T")[0],
    notes: "",
    area: "",
  })


  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const [uniformsRes, medicationsRes, employeesRes] = await Promise.all([
        fetch("http://10.0.0.15:8000/uniforme", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://10.0.0.15:8000/medicamento", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://10.0.0.15:8000/api/empleado/", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (uniformsRes.ok) {
        const data = await uniformsRes.json()
        setUniformes(data)
      }

      if (medicationsRes.ok) {
        const data = await medicationsRes.json()
        setMedicamentos(data)
      }

      if (employeesRes.ok) {
        const data = await employeesRes.json()
        setEmployees(data)
      }

      // Load deliveries
      await loadDeliveries(token)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  async function loadDeliveries(token: string) {
    try {
      const [uniformDelRes, medDelRes] = await Promise.all([
        fetch("http://10.0.0.15:8000/uniforme/entrega", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://10.0.0.15:8000/medicamento/entrega", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (uniformDelRes.ok) {
        const data = await uniformDelRes.json()
        setUniformDeliveries(data)
      }

      if (medDelRes.ok) {
        const data = await medDelRes.json()
        setMedicationDeliveries(data)
      }
    } catch (error) {
      console.error("Error loading deliveries:", error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const token = localStorage.getItem("token")
    if (!token) {
      alert("No está autenticado")
      setLoading(false)
      return
    }

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
        firma: formData.area,
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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Error al registrar la salida")
      }

      // Reset form
      setFormData({
        product_type: "uniform",
        product_id: "",
        empleado_id: "",
        cantidad: "",
        size: "",
        exit_date: new Date().toISOString().split("T")[0],
        notes: "",
        area: "",
      })
      setIsDialogOpen(false)
      loadData()

      alert("Salida registrada exitosamente")
    } catch (error: any) {
      console.error("Error creating exit:", error)
      alert(error.message || "Error al registrar la salida")
    } finally {
      setLoading(false)
    }
  }

  const products = formData.product_type === "uniform" ? uniformes : medicamentos
  const selectedProduct = products.find((p) => p.id === Number.parseInt(formData.product_id))
  const allDeliveries = [...uniformDeliveries, ...medicationDeliveries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Salidas de Stock</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Registro de entregas de uniformes y medicamentos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Salida
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Salida de Stock</DialogTitle>
              <DialogDescription>Complete los datos de la entrega al empleado</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="product_type">Tipo de Producto *</Label>
                  <Select
                    value={formData.product_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, product_type: value, product_id: "", size: "" })
                    }
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
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} (Stock: {product.stock_actual})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProduct && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Stock disponible: {selectedProduct.stock_actual} unidades
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="employee_id">Empleado *</Label>
                  <Select
                    value={formData.empleado_id}
                    onValueChange={(value) => setFormData({ ...formData, empleado_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un empleado" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.CodigoEmpleado} - {employee.nombre} ({employee.area})
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
                  <Label htmlFor="signature">Firma del Empleado *</Label>
                  <Input
                    id="signature"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="Nombre completo del empleado"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? "Registrando..." : "Registrar Salida"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 md:p-3 bg-orange-500/10 rounded-lg">
            <ArrowDownCircle className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
          </div>
          <div>
            <p className="text-xs md:text-sm text-muted-foreground">Total de Salidas</p>
            <p className="text-2xl md:text-3xl font-bold">{allDeliveries.length}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-3 md:p-4 border-b">
          <h2 className="text-base md:text-lg font-semibold">Historial de Salidas</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[100px]">ID</TableHead>
                <TableHead className="min-w-[120px]">Cantidad</TableHead>
                <TableHead className="min-w-[100px]">Área</TableHead>
                <TableHead className="min-w-[80px]">Talla</TableHead>
                <TableHead className="min-w-[100px]">Firma</TableHead>
                <TableHead className="min-w-[120px]">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allDeliveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay salidas registradas
                  </TableCell>
                </TableRow>
              ) : (
                allDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell className="font-mono text-xs md:text-sm">{delivery.id}</TableCell>
                    <TableCell className="text-sm md:text-base">{delivery.cantidad}</TableCell>
                    <TableCell className="text-sm md:text-base">{delivery.Area}</TableCell>
                    <TableCell className="text-sm md:text-base">{delivery.size || "-"}</TableCell>
                    <TableCell className="text-sm md:text-base">{delivery.firma}</TableCell>
                    <TableCell>{new Date(delivery.created_at).toLocaleDateString()}</TableCell>
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
