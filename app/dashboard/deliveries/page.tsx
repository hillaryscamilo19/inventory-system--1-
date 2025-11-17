"use client";
// Indica que este componente se ejecuta del lado del cliente (Client Component en Next.js)

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, CheckCircle2, Package } from "lucide-react";
// Componente visual para mostrar carga mientras llegan los datos.
import { useAuth } from "@/lib/auth-context";

// ----------------------------------------------------------------------
// MODELOS (Interfaces que describen cómo vienen los datos del backend)
// ----------------------------------------------------------------------

// Modelo de productos (uniformes o medicamentos)
interface Product {
  id: number;
  name: string;
  stock_actual: number;
}

// Modelo de empleados
interface Employee {
  id: number;
  CodigoEmpleado: string;
  nombre: string;
  apellido: string;
  cargo: string;
  area: string;
}

// -------------------------------------------------------------
// COMPONENTE PRINCIPAL DE LA PÁGINA DE ENTREGAS
// -------------------------------------------------------------
export default function DeliveriesPage() {
  // Datos globales del usuario logueado (obtenido del contexto de autenticación)
  const { user } = useAuth();

  // Estados donde se guardan los datos cargados desde el backend
  const [uniformes, setUniformes] = useState<Product[]>([]);
  const [medicamentos, setMedicamentos] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);

  // Control de carga y visibilidad del formulario
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Estado base del formulario de registro de entrega
  const [formData, setFormData] = useState({
    empleado_id: "",
    product_type: "uniform", // uniform o medication
    product_id: "",
    cantidad: "",
    size: "",
    firma: "", // firma digital del empleado
  });

  // -------------------------------------------------------------
  // Cargar datos automáticamente al cargar la página
  // -------------------------------------------------------------
  useEffect(() => {
    loadData();
  }, []);

  // -------------------------------------------------------------
  // Función para obtener todos los datos desde el backend
  // (uniformes, medicamentos, empleados y entregas)
  // -------------------------------------------------------------
  async function loadData() {
    const token = localStorage.getItem("token");
    if (!token) return; // Evita cargar si no hay token

    try {
      // Se hacen todas las peticiones EN PARALELO
      const [
        uniformsRes,
        medicationsRes,
        employeesRes,
        uniformDelRes,
        medDelRes,
      ] = await Promise.all([
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
      ]);

      // Guardar datos obtenidos
      if (uniformsRes.ok) setUniformes(await uniformsRes.json());
      if (medicationsRes.ok) setMedicamentos(await medicationsRes.json());
      if (employeesRes.ok) setEmployees(await employeesRes.json());

      // Unificar entregas de uniformes y medicamentos en una sola tabla
      const allDeliveries = [];

      if (uniformDelRes.ok) {
        const data = await uniformDelRes.json();
        allDeliveries.push(
          ...data.map((d: any) => ({ ...d, type: "uniform" }))
        );
      }

      if (medDelRes.ok) {
        const data = await medDelRes.json();
        allDeliveries.push(
          ...data.map((d: any) => ({ ...d, type: "medication" }))
        );
      }

      // Ordenar entregas por fecha (más recientes primero)
      allDeliveries.sort(
        (a, b) =>
          new Date(b.fecha_ingreso).getTime() -
          new Date(a.fecha_ingreso).getTime()
      );

      setDeliveries(allDeliveries);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  // -------------------------------------------------------------
  // ENVÍO DEL FORMULARIO DE ENTREGA
  // -------------------------------------------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // Evita refrescar la página

    // Validación de firma obligatoria
    if (!formData.firma.trim()) {
      alert("Por favor ingrese su firma digital");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      // Selección del endpoint según sea uniforme o medicamento
      const endpoint =
        formData.product_type === "uniform"
          ? "http://10.0.0.15:8000/uniforme/entrega"
          : "http://10.0.0.15:8000/medicamento/entrega";

      // Crear objeto que se enviará en la petición
      const payload: any = {
        // nombre dinámico según el tipo de producto
        [`${
          formData.product_type === "uniform" ? "uniforme" : "medicamento"
        }_id`]: Number.parseInt(formData.product_id),

        empleado_id: Number.parseInt(formData.empleado_id),
        cantidad: Number.parseInt(formData.cantidad),

        // Se obtiene el área del empleado seleccionado
        Area:
          employees.find((e) => e.id === Number.parseInt(formData.empleado_id))
            ?.area || "",
        firma: formData.firma,
      };

      // Si el producto es uniforme, se agrega la talla
      if (formData.product_type === "uniform") {
        payload.size = formData.size;
      }

      // Enviar petición al backend
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Error al registrar la entrega");

      // Reiniciar formulario
      setFormData({
        empleado_id: "",
        product_type: "uniform",
        product_id: "",
        cantidad: "",
        size: "",
        firma: "",
      });

      setShowForm(false);
      loadData(); // Actualizar tabla

      alert("Entrega registrada exitosamente");
    } catch (error) {
      console.error("Error creating delivery:", error);
      alert("Error al registrar la entrega");
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------
  // Datos derivados del formulario
  // -------------------------------------------------------------
  const products =
    formData.product_type === "uniform" ? uniformes : medicamentos;
  const selectedEmployee = employees.find(
    (e) => e.id === Number.parseInt(formData.empleado_id)
  );
  const selectedProduct = products.find(
    (p) => p.id === Number.parseInt(formData.product_id)
  );

  // -------------------------------------------------------------
  // RENDERIZADO DEL COMPONENTE COMPLETO
  // -------------------------------------------------------------
  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Encabezado de la página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Entregas a Empleados
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Registro de recepción de uniformes y medicamentos
          </p>
        </div>

        {/* Botón para mostrar formulario */}
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Nueva Entrega
          </Button>
        )}
      </div>

      {/* ---------------------------------------------------------
          FORMULARIO DE REGISTRO DE ENTREGA
         --------------------------------------------------------- 
        */}
      {showForm && (
        <Card className="p-4 md:p-6">
          <div className="mb-4">
            <h2 className="text-lg md:text-xl font-semibold">
              Confirmar Recepción de Material
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Complete el formulario para confirmar la recepción
            </p>
          </div>

          {/* Formulario principal */}
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Campos del formulario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selección de empleado */}
              <div className="md:col-span-2">
                <Label>Empleado *</Label>
                <Select
                  value={formData.empleado_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, empleado_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione su nombre" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem
                        key={employee.id}
                        value={employee.id.toString()}
                      >
                        {employee.nombre} - {employee.CodigoEmpleado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Info del empleado seleccionado */}
                {selectedEmployee && (
                  <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
                    <p>
                      <strong>Área:</strong> {selectedEmployee.area}
                    </p>
                    <p>
                      <strong>Código:</strong> {selectedEmployee.CodigoEmpleado}
                    </p>
                  </div>
                )}
              </div>

              {/* Selección del tipo de producto */}
              <div className="md:col-span-2">
                <Label>Tipo de Material *</Label>
                <Select
                  value={formData.product_type}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      product_type: value,
                      product_id: "",
                    })
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

              {/* Selección del producto */}
              <div className="md:col-span-2">
                <Label>Material Recibido *</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, product_id: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione el material" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem
                        key={product.id}
                        value={product.id.toString()}
                      >
                        {product.name} (Disponible: {product.stock_actual})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Información del stock seleccionado */}
                {selectedProduct && (
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm">
                        <strong>Stock disponible:</strong>{" "}
                        {selectedProduct.stock_actual} unidades
                      </p>
                      <Package className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>

              {/* Cantidad de producto */}
              <div>
                <Label>Cantidad Recibida *</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedProduct?.stock_actual || 999}
                  value={formData.cantidad}
                  onChange={(e) =>
                    setFormData({ ...formData, cantidad: e.target.value })
                  }
                  required
                />
              </div>

              {/* Campo visible solo si el producto es uniforme */}
              {formData.product_type === "uniform" && (
                <div>
                  <Label>Talla *</Label>
                  <Select
                    value={formData.size}
                    onValueChange={(value) =>
                      setFormData({ ...formData, size: value })
                    }
                  >
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

              {/* Firma digital */}
              <div className="md:col-span-2">
                <Label>Firma Digital *</Label>
                <Input
                  value={formData.firma}
                  onChange={(e) =>
                    setFormData({ ...formData, firma: e.target.value })
                  }
                  placeholder="Escriba su nombre completo como firma"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Al firmar, confirmo que he recibido el material.
                </p>
              </div>
            </div>

            {/* Botones del formulario */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  // limpiar formulario
                  setFormData({
                    empleado_id: "",
                    product_type: "uniform",
                    product_id: "",
                    cantidad: "",
                    size: "",
                    firma: "",
                  });
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

      {/* ---------------------------------------------------------
          CARDS RESUMEN
         --------------------------------------------------------- */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
        {/* Total entregas */}
        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClipboardList className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Entregas</p>
              <p className="text-xl md:text-2xl font-bold">
                {deliveries.length}
              </p>
            </div>
          </div>
        </Card>

        {/* Total uniformes */}
        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Package className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Uniformes</p>
              <p className="text-xl font-bold">
                {deliveries.filter((d) => d.type === "uniform").length}
              </p>
            </div>
          </div>
        </Card>

        {/* Total medicamentos */}
        <Card className="p-3 md:p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Package className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Medicamentos</p>
              <p className="text-xl font-bold">
                {deliveries.filter((d) => d.type === "medication").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ---------------------------------------------------------
          TABLA HISTÓRICA DE ENTREGAS
         --------------------------------------------------------- */}
      <Card>
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Historial de Entregas</h2>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Talla</TableHead>
                <TableHead>Firma</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {deliveries.length === 0 ? (
                // Si no hay entregas
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No hay entregas registradas
                  </TableCell>
                </TableRow>
              ) : (
                // Mostrar cada entrega
                deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {delivery.type === "uniform"
                          ? "Uniforme"
                          : "Medicamento"}
                      </Badge>
                    </TableCell>

                    <TableCell>{delivery.cantidad}</TableCell>
                    <TableCell>{delivery.Area}</TableCell>
                    <TableCell>{delivery.size || "-"}</TableCell>

                    <TableCell>
                      {delivery.firma ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm">Firmado</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Sin firma
                        </span>
                      )}
                    </TableCell>

                    {/* Fecha en formato local */}
                    <TableCell>
                      {new Date(delivery.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
