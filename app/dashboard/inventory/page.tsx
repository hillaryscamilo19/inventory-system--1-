"use client";
/**
 * Este archivo define la página de Inventario del sistema.
 * "use client" indica que este componente se ejecutará del lado del cliente
 * en Next.js (Client Component).
 */

import { useState, useEffect } from "react";

// Componentes UI reutilizables
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
// Selectores (categoría, status, etc.)
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Tabla de productos
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Íconos
import {
  Search,
  Plus,
  AlertTriangle,
  Package,
  TrendingDown,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Hook personalizado para saber el usuario actual (rol, permisos)
import { useAuth } from "@/lib/auth-context";

// Ventana modal para agregar productos
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
// API cliente + tipo Product
import { api, Product } from "@/lib/api-client";

export default function InventoryPage() {
  /**
   * USER: información del usuario logueado
   * se usa para determinar si puede agregar productos
   */
  const { user } = useAuth();
  /**
   * Estados principales del inventario:
   * uniformes → lista filtrada por categoría "uniform"
   * medicamentos → lista filtrada por categoría "medication"
   * filteredProducts → lista final luego de aplicar filtros
   */
  const [uniformes, setUniformes] = useState<Product[]>([]);
  const [medicamentos, setMedicamentos] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  // Estado de carga general
  const [loading, setLoading] = useState(true);
  // Controla si el modal de agregar está abierto
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  /**
   * Objeto usado para almacenar temporalmente los valores
   * del formulario para agregar un producto nuevo
   */
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "uniform" as "uniform" | "medication",
    stock_actual: 0,
    stock_minimo: 10,
  });

  // ============================================================
  // 1. CARGA INICIAL DE PRODUCTOS DESDE LA API
  // ============================================================

  useEffect(() => {
    loadProducts();
  }, []);

  // ============================================================
  // 2. EJECUTAR FILTROS CADA VEZ QUE CAMBIAN DATOS O FILTROS
  // ============================================================
  useEffect(() => {
    filterProducts();
    setCurrentPage(1);
  }, [uniformes, medicamentos, searchTerm, categoryFilter, stockFilter]);

  // ============================================================
  // FUNCIÓN PARA CARGAR PRODUCTOS DESDE LA API
  // ============================================================
  async function loadProducts() {
    try {
      const products = await api.products.getAll();

      const uniformesData = products.filter((p) => p.category === "uniform");
      const medicamentosData = products.filter(
        (p) => p.category === "medication"
      );

      setUniformes(uniformesData);
      setMedicamentos(medicamentosData);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // FUNCIÓN PARA APLICAR FILTROS (BUSCAR, CATEGORÍA, STOCK)
  // ============================================================

  function filterProducts() {
    let allProducts = [...uniformes, ...medicamentos];
    // Filtro por búsqueda (nombre)
    if (searchTerm) {
      allProducts = allProducts.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoría
    if (categoryFilter === "uniform") {
      allProducts = uniformes;
    } else if (categoryFilter === "medication") {
      allProducts = medicamentos;
    }

    // Filtro por estado de stock
    if (stockFilter === "low") {
      allProducts = allProducts.filter(
        (p) => p.stock_actual <= p.stock_minimo && p.stock_actual > 0
      );
    } else if (stockFilter === "out") {
      allProducts = allProducts.filter((p) => p.stock_actual === 0);
    }

    setFilteredProducts(allProducts);
  }
  // ============================================================
  // DETERMINAR EL ESTADO VISUAL DEL STOCK (OK / BAJO / SIN STOCK)
  // ============================================================
  function getStockStatus(product: Product) {
    if (product.stock_actual === 0) {
      return {
        label: "Sin Stock",
        variant: "destructive" as const,
        icon: AlertTriangle,
      };
    } else if (product.stock_actual <= product.stock_minimo) {
      return {
        label: "Stock Bajo",
        variant: "warning" as const,
        icon: TrendingDown,
      };
    } else {
      return {
        label: "Stock Normal",
        variant: "default" as const,
        icon: TrendingUp,
      };
    }
  }
  // ================================================================
  // PAGINACIÓN: calcula página actual
  // =================================================================
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // ============================================================
  // ESTADÍSTICAS GENERALES DEL INVENTARIO
  // ============================================================
  const allProducts = [...uniformes, ...medicamentos];
  const stats = {
    total: allProducts.length,
    lowStock: allProducts.filter(
      (p) => p.stock_actual <= p.stock_minimo && p.stock_actual > 0
    ).length,
    outOfStock: allProducts.filter((p) => p.stock_actual === 0).length,
    uniforms: uniformes.length,
    medications: medicamentos.length,
  };

  // ============================================================
  // SI ESTÁ CARGANDO MOSTRAR MENSAJE
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Cargando inventario...</div>
      </div>
    );
  }
  // ============================================================
  // FUNCIÓN PARA AGREGAR UN NUEVO PRODUCTO DESDE EL MODAL
  // ============================================================
  async function handleAddProduct() {
    try {
      // Validación básica
      if (!newProduct.name) {
        alert("El nombre del producto es requerido");
        return;
      }

      const now = new Date().toISOString();
      // Datos que se enviarán al backend
      const productData = {
        name: newProduct.name,
        stock_actual: newProduct.stock_actual || 0,
        stock_minimo: newProduct.stock_minimo || 0,
        estado: true,
        fecha_ingreso: now,
        fecha_vencimiento: now, // o null si no aplica
        created_at: now,
        updated_at: now,
        category: newProduct.category,
      };

      // Envía a la API correcta según la categoría
      if (newProduct.category === "uniform") {
        await api.products.create(productData);
      } else {
        await api.products.create(productData);
      }
      // Cerrar modal y limpiar campos
      setIsAddDialogOpen(false);
      setNewProduct({
        name: "",
        category: "uniform",
        stock_actual: 0,
        stock_minimo: 10,
      });
      // Recargar productos
      loadProducts();
    } catch (error: any) {
      console.error("Error adding product:", error);
      alert(`Error al agregar producto: ${error.message}`);
    }
  }
  // =============================================================
  // RENDER PRINCIPAL DE LA PÁGINA
  // =============================================================
  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      {/* Título + Botón Agregar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
            Inventario
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Gestión y control de uniformes y medicamentos
          </p>
        </div>
        {/* El botón solo aparece para admin y delivery manager */}
        {(user?.role === "admin" || user?.role === "delivery_manager") && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Agregar Producto</span>
                <span className="sm:hidden">Agregar</span>
              </Button>
            </DialogTrigger>
            {/* CONTENIDO DEL MODAL */}
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Producto</DialogTitle>
                <DialogDescription>
                  Ingresa los detalles del nuevo producto al inventario
                </DialogDescription>
              </DialogHeader>
              {/* FORMULARIO DEL MODAL */}
              <div className="grid gap-4 py-4">
                {/* SELECT CATEGORÍA */}
                <div className="grid gap-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value: "uniform" | "medication") =>
                      setNewProduct({ ...newProduct, category: value })
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
                {/* INPUT NOMBRE */}
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre del Producto</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    placeholder={
                      newProduct.category === "uniform"
                        ? "Ej: Camisa azul"
                        : "Ej: Ibuprofeno"
                    }
                  />
                </div>

                {/* STOCK ACTUAL / STOCK MÍNIMO */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="current_stock">Stock Actual</Label>
                    <Input
                      id="current_stock"
                      type="number"
                      min="0"
                      value={newProduct.stock_actual}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          stock_actual: Number.parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="minimum_stock">Stock Mínimo</Label>
                    <Input
                      id="minimum_stock"
                      type="number"
                      min="0"
                      value={newProduct.stock_minimo}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          stock_minimo: Number.parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleAddProduct}
                  className="w-full sm:w-auto"
                  disabled={!newProduct.name}
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
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                Total Productos
              </p>
              <p className="text-lg md:text-xl lg:text-2xl font-bold">
                {stats.total}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 md:p-2 bg-orange-500/10 rounded-lg shrink-0">
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                Stock Bajo
              </p>
              <p className="text-lg md:text-xl lg:text-2xl font-bold text-orange-500">
                {stats.lowStock}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 md:p-2 bg-red-500/10 rounded-lg shrink-0">
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                Sin Stock
              </p>
              <p className="text-lg md:text-xl lg:text-2xl font-bold text-red-500">
                {stats.outOfStock}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 md:p-2 bg-blue-500/10 rounded-lg shrink-0">
              <Package className="h-4 w-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                Uniformes
              </p>
              <p className="text-lg md:text-xl lg:text-2xl font-bold">
                {stats.uniforms}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 md:p-2 bg-green-500/10 rounded-lg shrink-0">
              <Package className="h-4 w-4 text-green-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">
                Medicamentos
              </p>
              <p className="text-lg md:text-xl lg:text-2xl font-bold">
                {stats.medications}
              </p>
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
                <TableHead className="min-w-[120px] text-xs md:text-sm">
                  Producto
                </TableHead>
                <TableHead className="min-w-[100px] text-xs md:text-sm">
                  Categoría
                </TableHead>
                <TableHead className="text-right min-w-[90px] text-xs md:text-sm">
                  Stock
                </TableHead>
                <TableHead className="text-right min-w-[90px] text-xs md:text-sm">
                  Mínimo
                </TableHead>
                <TableHead className="min-w-[110px] text-xs md:text-sm">
                  Estado
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-xs md:text-sm text-muted-foreground"
                  >
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              ) : (
                currentProducts.map((product) => {
                  const status = getStockStatus(product);
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="font-medium text-xs md:text-sm">
                          {product.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] md:text-xs"
                        >
                          {product.category === "uniform"
                            ? "Uniforme"
                            : "Medicamento"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs md:text-sm">
                        {product.stock_actual}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs md:text-sm">
                        {product.stock_minimo}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={status.variant}
                          className="gap-1 text-[10px] md:text-xs"
                        >
                          <StatusIcon className="h-3 w-3" />
                          <span className="hidden sm:inline">
                            {status.label}
                          </span>
                          <span className="sm:hidden">
                            {status.label === "Sin Stock"
                              ? "Sin"
                              : status.label === "Stock Bajo"
                              ? "Bajo"
                              : "OK"}
                          </span>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        {filteredProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 md:p-4 border-t">
            <div className="text-xs md:text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a{" "}
              {Math.min(endIndex, filteredProducts.length)} de{" "}
              {filteredProducts.length} productos
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          {page}
                        </Button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-1 text-muted-foreground">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
