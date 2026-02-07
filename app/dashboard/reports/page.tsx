"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { api, Product, Employee, getEmployeeFullName } from "@/lib/api-client";

interface ReportData {
  id: number;
  type: "entry" | "exit";
  product_name: string;
  category: string;
  quantity: number;
  employee_name?: string;
  area?: string;
  supplier?: string;
  date: string;
  size?: string;
  firma?: string;
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    employeeId: "all",
    productId: "all",
    category: "all",
    type: "all",
  });

  useEffect(() => {
    loadProducts();
    loadEmployees();
  }, []);

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

  async function exportExcel() {
    try {
      const blob = await api.reports.exportCSV({
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        employee_id:
          filters.employeeId !== "all" ? Number(filters.employeeId) : undefined,
        product_type: filters.category !== "all" ? filters.category : undefined,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exportando Excel:", error);
      alert("Error al exportar el reporte");
    }
  }

  async function loadReportData() {
    setLoading(true);
    try {
      const [entries, uniformDel, medDel] = await Promise.all([
        api.entries.getAll(),
        api.uniforme.getDeliveries(),
        api.medicamento.getDeliveries(),
      ]);

      const allData: ReportData[] = [];

      // Process entries
      if (Array.isArray(entries)) {
        entries.forEach((entry: any) => {
          const entryDate = new Date(entry.entry_date);
          if (
            (!filters.startDate || entryDate >= new Date(filters.startDate)) &&
            (!filters.endDate || entryDate <= new Date(filters.endDate)) &&
            (filters.type === "all" || filters.type === "entry") &&
            (filters.category === "all" ||
              entry.product_type === filters.category) &&
            (filters.productId === "all" ||
              entry.product_name ===
                products.find((p) => p.id.toString() === filters.productId)
                  ?.name)
          ) {
            allData.push({
              id: entry.id,
              type: "entry",
              product_name: entry.product_name,
              category: entry.product_type,
              quantity: entry.quantity,
              supplier: entry.supplier,
              date: entry.entry_date,
            });
          }
        });
      }

      // Process uniform deliveries
      if (Array.isArray(uniformDel)) {
        uniformDel.forEach((del: any) => {
          const delDate = new Date(del.created_at);
          const uniformName = del.uniforme_name || del.name || "Uniforme";
          if (
            (!filters.startDate || delDate >= new Date(filters.startDate)) &&
            (!filters.endDate || delDate <= new Date(filters.endDate)) &&
            (filters.type === "all" || filters.type === "exit") &&
            (filters.category === "all" || filters.category === "uniform") &&
            (filters.employeeId === "all" ||
              del.empleado_id === Number.parseInt(filters.employeeId)) &&
            (filters.productId === "all" ||
              uniformName ===
                products.find((p) => p.id.toString() === filters.productId)
                  ?.name)
          ) {
            allData.push({
              id: del.id,
              type: "exit",
              product_name: uniformName,
              category: "uniform",
              quantity: del.cantidad,
              employee_name: del.empleado_name || "",
              area: del.area || del.Area || "",
              size: del.size || del.talla || "",
              firma: del.firma || "",
              date: del.created_at,
            });
          }
        });
      }

      // Process medication deliveries
      if (Array.isArray(medDel)) {
        medDel.forEach((del: any) => {
          const delDate = new Date(del.created_at);
          const medName = del.medicamento_name || del.name || "Medicamento";
          if (
            (!filters.startDate || delDate >= new Date(filters.startDate)) &&
            (!filters.endDate || delDate <= new Date(filters.endDate)) &&
            (filters.type === "all" || filters.type === "exit") &&
            (filters.category === "all" || filters.category === "medication") &&
            (filters.employeeId === "all" ||
              del.empleado_id === Number.parseInt(filters.employeeId)) &&
            (filters.productId === "all" ||
              medName ===
                products.find((p) => p.id.toString() === filters.productId)
                  ?.name)
          ) {
            allData.push({
              id: del.id,
              type: "exit",
              product_name: medName,
              category: "medication",
              quantity: del.cantidad,
              employee_name: del.empleado_name || "",
              area: del.area || del.Area || "",
              firma: del.firma || "",
              date: del.created_at,
            });
          }
        });
      }

      allData.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setReportData(allData);
    } catch (error) {
      console.error("Error loading report data:", error);
    } finally {
      setLoading(false);
    }
  }

  //

  function exportToCSV() {
    if (reportData.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    const headers = [
      "ID",
      "Tipo",
      "Fecha",
      "Producto",
      "Categoria",
      "Cantidad",
      "Empleado",
      "Area",
      "Talla",
      "Proveedor",
      "Firma",
    ];

    const rows = reportData.map((item) => [
      item.id,
      item.type === "entry" ? "Entrada" : "Salida",
      new Date(item.date).toLocaleDateString(),
      item.product_name,
      item.category === "uniform" ? "Uniforme" : "Medicamento",
      item.quantity,
      item.employee_name || "-",
      item.area || "-",
      item.size || "-",
      item.supplier || "-",
      item.firma ? "Si" : "No",
    ]);

    // Agregar BOM para que Excel reconozca UTF-8 correctamente
    const BOM = "\uFEFF";
    const csvContent =
      BOM +
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reporte_movimientos_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Reportes y Auditoría
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Historial completo de movimientos
          </p>
        </div>
        <Button onClick={exportExcel} className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </Button>
      </div>

      <Card className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          <h2 className="text-base md:text-lg font-semibold">
            Filtros de Búsqueda
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="startDate" className="text-sm">
              Fecha Inicio
            </Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
              className="text-sm"
            />
          </div>

          <div>
            <Label htmlFor="endDate" className="text-sm">
              Fecha Fin
            </Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({...filters, endDate: e.target.value })
              }
              className="text-sm"
            />
          </div>

          <div>
            <Label htmlFor="type" className="text-sm">
              Tipo de Movimiento
            </Label>
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({ ...filters, type: value })}
            >
              <SelectTrigger className="text-sm">
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
            <Label htmlFor="category" className="text-sm">
              Categoría
            </Label>
            <Select
              value={filters.category}
              onValueChange={(value) =>
                setFilters({ ...filters, category: value })
              }
            >
              <SelectTrigger className="text-sm">
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
            <Label htmlFor="productId" className="text-sm">
              Producto
            </Label>
            <Select
              value={filters.productId}
              onValueChange={(value) =>
                setFilters({ ...filters, productId: value })
              }
            >
              <SelectTrigger className="text-sm">
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
            <Label htmlFor="employeeId" className="text-sm">
              Empleado
            </Label>
            <Select
              value={filters.employeeId}
              onValueChange={(value) =>
                setFilters({ ...filters, employeeId: value })
              }
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los empleados</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {getEmployeeFullName(employee)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button
            onClick={loadReportData}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            {loading ? "Generando..." : "Generar Reporte"}
          </Button>
        </div>
      </Card>

      {reportData.length > 0 && (
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-5">
          <Card className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Total
                </p>
                <p className="text-xl md:text-2xl font-bold">
                  {stats.totalMovements}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Entradas
                </p>
                <p className="text-xl md:text-2xl font-bold text-green-600">
                  {stats.totalEntries}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Salidas
                </p>
                <p className="text-xl md:text-2xl font-bold text-orange-600">
                  {stats.totalExits}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Cant. Ingresada
                </p>
                <p className="text-xl md:text-2xl font-bold">
                  {stats.totalQuantityIn}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Cant. Entregada
                </p>
                <p className="text-xl md:text-2xl font-bold">
                  {stats.totalQuantityOut}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card>
        <Tabs defaultValue="all" className="w-full">
          <div className="border-b px-3 md:px-4 pt-3 md:pt-4">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="all" className="text-xs md:text-sm">
                Todos
              </TabsTrigger>
              <TabsTrigger value="entries" className="text-xs md:text-sm">
                Entradas
              </TabsTrigger>
              <TabsTrigger value="exits" className="text-xs md:text-sm">
                Salidas
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="m-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[60px]">ID</TableHead>
                    <TableHead className="min-w-[80px]">Tipo</TableHead>
                    <TableHead className="min-w-[100px]">Fecha</TableHead>
                    <TableHead className="min-w-[120px]">Producto</TableHead>
                    <TableHead className="min-w-[80px]">Cantidad</TableHead>
                    <TableHead className="min-w-[100px]">Área/Proveedor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground text-sm"
                      >
                        Cargando datos...
                      </TableCell>
                    </TableRow>
                  ) : reportData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground text-sm"
                      >
                        Seleccione un rango de fechas y genere el reporte
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportData.map((item) => (
                      <TableRow key={`${item.type}-${item.id}`}>
                        <TableCell className="font-mono text-xs md:text-sm">
                          {item.id}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.type === "entry" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {item.type === "entry" ? "Entrada" : "Salida"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {new Date(item.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {item.product_name}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {item.area || item.supplier || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="entries" className="m-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[60px]">ID</TableHead>
                    <TableHead className="min-w-[100px]">Fecha</TableHead>
                    <TableHead className="min-w-[120px]">Producto</TableHead>
                    <TableHead className="min-w-[80px]">Cantidad</TableHead>
                    <TableHead className="min-w-[120px]">Proveedor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.filter((r) => r.type === "entry").length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground text-sm"
                      >
                        No hay entradas en el período seleccionado
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportData
                      .filter((r) => r.type === "entry")
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs md:text-sm">
                            {item.id}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {new Date(item.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {item.product_name}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {item.supplier}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="exits" className="m-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[60px]">ID</TableHead>
                    <TableHead className="min-w-[100px]">Fecha</TableHead>
                    <TableHead className="min-w-[120px]">Producto</TableHead>
                    <TableHead className="min-w-[80px]">Cantidad</TableHead>
                    <TableHead className="min-w-[100px]">Área</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.filter((r) => r.type === "exit").length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground text-sm"
                      >
                        No hay salidas en el período seleccionado
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportData
                      .filter((r) => r.type === "exit")
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs md:text-sm">
                            {item.id}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {new Date(item.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {item.product_name}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {item.area}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
