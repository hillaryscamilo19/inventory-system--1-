"use client";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { api, Product } from "@/lib/api-client";

interface ReportData {
  id: string;
  number: string;
  date: string;
  type: "entry" | "exit";
  product_name: string;
  product_code: string;
  category: string;
  quantity: number;
  unit: string;
  employee_name?: string;
  employee_code?: string;
  area?: string;
  supplier?: string;
  registered_by: string;
  notes?: string;
}

interface Employee {
  id: number;
  CodigoEmpleado: string;
  nombre: string;
  apellido: string;
  cargo: string;
  area: string;
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    productId: "all",
    employee_id: "all",
    category: "all",
    type: "all",
  });

  useEffect(() => {
    loadProducts();
    loadEmployees();
  }, []);

  useEffect(() => {
    if (filters.startDate || filters.endDate) {
      loadReportData();
    }
  }, [filters]);

  async function loadProducts() {
    try {
      const data = await api.products.getAll();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  }

  async function loadEmployees() {
    try {
      const data = await api.employees.getAll();
      setEmployees(data);
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  }

  async function loadReportData() {
    setLoading(true);
    try {
      const productType =
        filters.category === "all"
          ? "all"
          : filters.category === "uniform"
          ? "uniform"
          : "medication";

      console.log("[v0] Fetching movements with filters:", {
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        employee_id:
          filters.employee_id !== "all"
            ? Number.parseInt(filters.employee_id)
            : undefined,
        product_type: productType,
      });

      const response = await api.reports.getMovements({
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        employee_id:
          filters.employee_id !== "all"
            ? Number.parseInt(filters.employee_id)
            : undefined,
        product_type: productType,
      });

      console.log("[v0] API response:", response);

      let data = response;

      // If the response is wrapped in an object, extract the array
      if (
        response &&
        typeof response === "object" &&
        !Array.isArray(response)
      ) {
        // Check common wrapper properties
        if ("movements" in response) {
          data = response.movements;
        } else if ("data" in response) {
          data = response.data;
        } else if ("results" in response) {
          data = response.results;
        }
      }

      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error("[v0] Expected array but got:", typeof data, data);
        setReportData([]);
        return;
      }

      console.log("[v0] Processing", data.length, "movements");

      const transformedData: ReportData[] = data.map((item: any) => ({
        id: item.id?.toString() || "",
        number: item.number || item.entry_number || item.exit_number || "",
        date: item.date || item.entry_date || item.exit_date || "",
        type: item.type || "entry",
        product_name: item.product_name || item.product?.name || "",
        product_code: item.product_code || item.product?.code || "",
        category: item.category || item.product?.category || "",
        quantity: item.quantity || 0,
        unit: item.unit || item.product?.unit || "",
        employee_name:
          item.employee_name ||
          item.employee?.name ||
          item.empleado?.nombre ||
          undefined,

        employee_code:
          item.employee_code ||
          item.employee?.code ||
          item.empleado?.CodigoEmpleado ||
          undefined,

        area:
          item.area || item.employee?.area || item.empleado?.area || undefined,

        registered_by:
          item.registered_by || item.created_by || item.usuario?.nombre || "",

        supplier: item.supplier || undefined,

        notes: item.notes || undefined,
      }));

      // Apply client-side filters
      let filteredData = transformedData;

      if (filters.type !== "all") {
        filteredData = filteredData.filter(
          (item) => item.type === filters.type
        );
      }

      if (filters.productId !== "all") {
        filteredData = filteredData.filter((item) => {
          const product = products.find(
            (p) => p.id.toString() === filters.productId
          );
          return product && item.product_name === product.name;
        });
      }

      // Sort by date
      filteredData.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setReportData(filteredData);
    } catch (error) {
      console.error("[v0] Error loading report data:", error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV() {
    if (reportData.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    const headers = [
      "ID",
      "TIPO",
      "PRODUCTO",
      "EMPLEADO",
      "AREA",
      "CANTIDAD",
      "TALLA",
      "MEDICAMENTO",
      "FIRMA",
      "FECHA",
    ];

    const rows = reportData.map((item) => {
      const isUniform = item.category === "uniform";
      const isMedication = item.category === "medication";

      return [
        item.id,
        isUniform ? "Uniforme" : "Medicamento",
        isUniform ? item.product_name : "", // PRODUCTO column only for uniforms
        item.employee_name || "",
        item.area || "",
        item.quantity,
        isUniform ? item.unit || "" : "", // TALLA only for uniforms
        isMedication ? item.product_name : "", // MEDICAMENTO column only for medications
        item.notes || "", // FIRMA
        new Date(item.date).toLocaleDateString(),
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reporte_inventario_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const stats = {
    totalMovements: reportData.length,
    totalEntries: reportData.filter((r) => r.type === "entry").length,
    totalExits: reportData.filter((r) => r.type === "exit").length,
    totalQuantityIn: reportData
      .filter((r) => r.type === "entry")
      .reduce((sum, r) => sum + r.quantity, 0),
    totalQuantityOut: reportData
      .filter((r) => r.type === "exit")
      .reduce((sum, r) => sum + r.quantity, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reportes y Auditoría
          </h1>
          <p className="text-muted-foreground mt-1">
            Historial completo de movimientos de inventario
          </p>
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
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="endDate">Fecha Fin</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo de Movimiento</Label>
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({ ...filters, type: value })}
            >
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
            <Select
              value={filters.category}
              onValueChange={(value) =>
                setFilters({ ...filters, category: value })
              }
            >
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
            <Select
              value={filters.productId}
              onValueChange={(value) =>
                setFilters({ ...filters, productId: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los productos</SelectItem>
                {products.map((product) => (
                  <SelectItem
                    key={`${product.type || product.category}-${product.id}`}
                    value={product.id.toString()}
                  >
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="employeeId">Empleado</Label>
            <Select
              value={filters.employee_id}
              onValueChange={(value) =>
                setFilters({ ...filters, employee_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los empleados</SelectItem>
                {employees.map((empleado) => (
                  <SelectItem key={empleado.id} value={empleado.id.toString()}>
                    {empleado.nombre}
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
                <p className="text-sm text-muted-foreground">
                  Total Movimientos
                </p>
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
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalEntries}
                </p>
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
                <p className="text-2xl font-bold text-orange-600">
                  {stats.totalExits}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Cantidad Ingresada
                </p>
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
                <p className="text-sm text-muted-foreground">
                  Cantidad Entregada
                </p>
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
                  <TableHead>ID</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Empleado/Proveedor</TableHead>
                  <TableHead>Registrado por</TableHead>
                  <TableHead>Talla</TableHead>
                  <TableHead>Área Entrega</TableHead>
                  <TableHead>Firma</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Cargando datos...
                    </TableCell>
                  </TableRow>
                ) : reportData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Seleccione un rango de fechas y genere el reporte
                    </TableCell>
                  </TableRow>
                ) : (
                  reportData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        {item.id}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.type === "entry" ? "default" : "secondary"
                          }
                        >
                          {item.type === "entry" ? "Entrada" : "Salida"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(item.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.product_code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell>
                        {item.type === "exit" ? (
                          <div>
                            <div className="font-medium">
                              {item.employee_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.area}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm">{item.supplier}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.registered_by}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.unit || "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.area || ""}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.notes || ""}
                      </TableCell>
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
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Registrado por</TableHead>
                  <TableHead>Talla</TableHead>
                  <TableHead>Área Entrega</TableHead>
                  <TableHead>Firma</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.filter((r) => r.type === "entry").length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No hay entradas en el período seleccionado
                    </TableCell>
                  </TableRow>
                ) : (
                  reportData
                    .filter((r) => r.type === "entry")
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">
                          {item.id}
                        </TableCell>
                        <TableCell>
                          {new Date(item.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {item.product_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.product_code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell>{item.supplier}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.registered_by}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.unit || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.area || ""}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.notes || ""}
                        </TableCell>
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
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Área Empleado</TableHead>
                  <TableHead>Registrado por</TableHead>
                  <TableHead>Talla</TableHead>
                  <TableHead>Área Entrega</TableHead>
                  <TableHead>Firma</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.filter((r) => r.type === "exit").length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No hay salidas en el período seleccionado
                    </TableCell>
                  </TableRow>
                ) : (
                  reportData
                    .filter((r) => r.type === "exit")
                    .map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">
                          {item.id}
                        </TableCell>
                        <TableCell>
                          {new Date(item.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {item.product_name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.product_code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.quantity} {item.unit}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.employee_code}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.area}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.registered_by}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.unit || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.area || ""}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.notes || ""}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
