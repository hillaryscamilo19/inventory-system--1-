"use client"
// Indica que este componente se ejecuta del lado del cliente dentro de Next.js

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

// ---------------------------------------------------------------------------
// Interfaces para tipar los datos recibidos desde el backend
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Componente principal: Página de salidas del inventario
// ---------------------------------------------------------------------------

export default function ExitsPage() {
  // Obtiene el usuario autenticado mediante el contexto de autenticación
  const { user } = useAuth()

  // Estados para almacenar productos, empleados y registros de salidas
  const [uniformes, setUniformes] = useState<Product[]>([])
  const [medicamentos, setMedicamentos] = useState<Product[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [uniformDeliveries, setUniformDeliveries] = useState<any[]>([])
  const [medicationDeliveries, setMedicationDeliveries] = useState<any[]>([])

  // Controla si el modal de registro está abierto
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Buscador (aunque no usado en este archivo)
  const [searchTerm, setSearchTerm] = useState("")

  // Estado para controlar carga de formulario
  const [loading, setLoading] = useState(false)

  // Datos del formulario para la salida de stock
  const [formData, setFormData] = useState({
    product_type: "uniform", // Tipo por defecto
    product_id: "",
    empleado_id: "",
    cantidad: "",
    size: "",
    exit_date: new Date().toISOString().split("T")[0],
    notes: "",
    area: "",
  })

  // -------------------------------------------------------------------------
  // Cargar datos del backend al montar el componente
  // -------------------------------------------------------------------------
  useEffect(() => {
    loadData()
  }, [])

  // -------------------------------------------------------------------------
  // Función principal para cargar productos, empleados y entregas
  // -------------------------------------------------------------------------
  async function loadData() {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      // Solicitudes paralelas para optimizar tiempo de carga
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

      // Cargar uniformes
      if (uniformsRes.ok) {
        const data = await uniformsRes.json()
        setUniformes(data)
      }

      // Cargar medicamentos
      if (medicationsRes.ok) {
        const data = await medicationsRes.json()
        setMedicamentos(data)
      }

      // Cargar empleados
      if (employeesRes.ok) {
        const data = await employeesRes.json()
        setEmployees(data)
      }

      // Cargar salidas registradas
      await loadDeliveries(token)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  // -------------------------------------------------------------------------
  // Cargar historial de salidas
  // -------------------------------------------------------------------------
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

      // Guardar entregas de uniformes
      if (uniformDelRes.ok) {
        const data = await uniformDelRes.json()
        setUniformDeliveries(data)
      }

      // Guardar entregas de medicamentos
      if (medDelRes.ok) {
        const data = await medDelRes.json()
        setMedicationDeliveries(data)
      }
    } catch (error) {
      console.error("Error loading deliveries:", error)
    }
  }

  // -------------------------------------------------------------------------
  // Manejar envío del formulario de salida
  // -------------------------------------------------------------------------
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
      // Selecciona la URL correcta según el tipo de producto
      const endpoint =
        formData.product_type === "uniform"
          ? "http://10.0.0.15:8000/uniforme/entrega"
          : "http://10.0.0.15:8000/medicamento/entrega"

      // Construir payload dinámico para uniforme o medicamento
      const payload: any = {
        [`${formData.product_type === "uniform" ? "uniforme" : "medicamento"}_id`]:
          Number.parseInt(formData.product_id),
        empleado_id: Number.parseInt(formData.empleado_id),
        cantidad: Number.parseInt(formData.cantidad),
        Area: employees.find((e) => e.id === Number.parseInt(formData.empleado_id))?.area || "",
        firma: formData.area,
      }

      // Si es uniforme, agregar talla
      if (formData.product_type === "uniform") {
        payload.size = formData.size
      }

      // Enviar solicitud POST al backend
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

      // Resetear formulario
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

  // -------------------------------------------------------------------------
  // Variables derivadas
  // -------------------------------------------------------------------------
  const products = formData.product_type === "uniform" ? uniformes : medicamentos
  const selectedProduct = products.find((p) => p.id === Number.parseInt(formData.product_id))

  // Unifica entregas y las ordena por fecha
  const allDeliveries = [...uniformDeliveries, ...medicationDeliveries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  // -------------------------------------------------------------------------
  // Renderizado del componente
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">

      {/* Encabezado de la página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Salidas de Stock</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Registro de entregas de uniformes y medicamentos
          </p>
        </div>

        {/* Botón para abrir el formulario de registro */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Salida
            </Button>
          </DialogTrigger>

          {/* Modal con formulario */}
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Salida de Stock</DialogTitle>
              <DialogDescription>Complete los datos de la entrega al empleado</DialogDescription>
            </DialogHeader>

            {/* Formulario de salida */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Campos organizados en grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Tipo de producto */}
                <div className="md:col-span-2">
                  <Label>Tipo de Producto *</Label>
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

                {/* Selección de producto */}
                <div className="md:col-span-2">
                  <Label>Producto *</Label>
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

                  {/* Mostrar stock disponible */}
                  {selectedProduct && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Stock disponible: {selectedProduct.stock_actual} unidades
                    </p>
                  )}
                </div>

                {/* Selección de empleado */}
                <div className="md:col-span-2">
                  <Label>Empleado *</Label>
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

                {/* Cantidad */}
                <div>
                  <Label>Cantidad *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                    required
                  />
                </div>

                {/* Talla (solo uniformes) */}
                {formData.product_type === "uniform" && (
                  <div>
                    <Label>Talla *</Label>
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

                {/* Firma del empleado */}
                <div className="md:col-span-2">
                  <Label>Firma del Empleado *</Label>
                  <Input
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="Nombre completo del empleado"
                    required
                  />
                </div>
              </div>

              {/* Botones del formulario */}
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

      {/* Tarjeta con total de salidas */}
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

      {/* Tabla de historial */}
      <Card>
        <div className="p-3 md:p-4 border-b">
          <h2 className="text-base md:text-lg font-semibold">Historial de Salidas</h2>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cantidad</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Talla</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {/* Si no hay salidas */}
              {allDeliveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay salidas registradas
                  </TableCell>
                </TableRow>
              ) : (
                /* Mostrar historial */
                allDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>{delivery.cantidad}</TableCell>
                    <TableCell>{delivery.Area}</TableCell>
                    <TableCell>{delivery.size || "-"}</TableCell>
                    <TableCell>{delivery.firma}</TableCell>
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
