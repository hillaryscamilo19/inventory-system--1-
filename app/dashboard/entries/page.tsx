"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Plus, ArrowUpCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface Product {
  id: number
  name: string
  category: string
  unit?: string
}

interface StockEntry {
  id: number
  product_type: string
  product_name: string
  quantity: number
  supplier: string
  entry_date: string
  created_by: string
  created_at: string
}

export default function EntriesPage() {
  const { user } = useAuth()
  const [uniformes, setUniformes] = useState<Product[]>([])
  const [medicamentos, setMedicamentos] = useState<Product[]>([])
  const [entries, setEntries] = useState<StockEntry[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    product_type: "uniform",
    product_id: "",
    quantity: "",
    supplier: "",
    entry_date: new Date().toISOString().split("T")[0],
    notes: "",
  })

  useEffect(() => {
    loadProducts()
    loadEntries()
  }, [])

  async function loadProducts() {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://10.0.0.15:8000"
      const token = localStorage.getItem("token")

      const [uniformesData, medicamentosData] = await Promise.all([
        fetch(`${API_URL}/uniforme`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json()),
        fetch(`${API_URL}/medicamento`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json()),
      ])

      setUniformes(uniformesData.map((u: any) => ({ ...u, category: "uniform" })))
      setMedicamentos(medicamentosData.map((m: any) => ({ ...m, category: "medication" })))
    } catch (error) {
      console.error("Error loading products:", error)
    }
  }

  async function loadEntries() {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://10.0.0.15:8000"
      const token = localStorage.getItem("token")

      const response = await fetch(`${API_URL}/api/entries`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error("Error loading entries:", error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://10.0.0.15:8000"
      const token = localStorage.getItem("token")

      const response = await fetch(`${API_URL}/api/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_type: formData.product_type,
          product_id: Number.parseInt(formData.product_id),
          quantity: Number.parseInt(formData.quantity),
          supplier: formData.supplier,
          entry_date: formData.entry_date,
          notes: formData.notes || null,
        }),
      })

      if (!response.ok) throw new Error("Error al registrar entrada")

      // Reset form and reload data
      setFormData({
        product_type: "uniform",
        product_id: "",
        quantity: "",
        supplier: "",
        entry_date: new Date().toISOString().split("T")[0],
        notes: "",
      })
      setIsDialogOpen(false)
      loadEntries()
      loadProducts()

      alert("Entrada registrada exitosamente")
    } catch (error) {
      console.error("Error creating entry:", error)
      alert("Error al registrar la entrada")
    } finally {
      setLoading(false)
    }
  }

  const allProducts = formData.product_type === "uniform" ? uniformes : medicamentos

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entradas de Stock</h1>
          <p className="text-muted-foreground mt-1">Registro de compras e ingresos al inventario</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Entrada
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Entrada de Stock</DialogTitle>
              <DialogDescription>Complete los datos de la entrada al inventario</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="product_type">Tipo de Producto *</Label>
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
                      {allProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
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
                  <Label htmlFor="supplier">Proveedor *</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    required
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="entry_date">Fecha de Entrada *</Label>
                  <Input
                    id="entry_date"
                    type="date"
                    value={formData.entry_date}
                    onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
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
                  {loading ? "Registrando..." : "Registrar Entrada"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg">
            <ArrowUpCircle className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de Entradas</p>
            <p className="text-3xl font-bold">{entries.length}</p>
          </div>
        </div>
      </Card>

      {/* Entries Table */}
      <Card>
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Historial de Entradas</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Registrado por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay entradas registradas
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.product_name}</TableCell>
                  <TableCell>{entry.product_type === "uniform" ? "Uniforme" : "Medicamento"}</TableCell>
                  <TableCell>{entry.quantity}</TableCell>
                  <TableCell>{entry.supplier}</TableCell>
                  <TableCell>{new Date(entry.entry_date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entry.created_by}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
