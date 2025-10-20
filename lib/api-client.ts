// Cliente API para conectar con FastAPI backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://10.0.0.15:8000"

interface ApiError {
  detail: string
}

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({ detail: "Error desconocido" }))
    throw new Error(error.detail || `Error ${response.status}: ${response.statusText}`)
  }

  return response.json()
}

// Tipos de datos
export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "delivery_manager" | "auditor" | "employee"
  area: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface Product {
  id: number
  name: string
  category: "uniform" | "medication"
  current_stock: number
  minimum_stock: number
  unit: string
  created_at: string
  updated_at: string
}

export interface Employee {
  id: number
  name: string
  email: string
  area: string
  position: string
  created_at: string
}

export interface StockEntry {
  id: number
  product_id: number
  quantity: number
  supplier: string
  entry_date: string
  notes?: string
  created_by: string
  created_at: string
  product?: Product
}

export interface StockExit {
  id: number
  product_id: number
  employee_id: number
  quantity: number
  exit_date: string
  status: "delivered" | "returned"
  notes?: string
  signature?: string
  created_by: string
  created_at: string
  product?: Product
  employee?: Employee
}

export interface DashboardStats {
  total_stock: number
  entries_this_month: number
  exits_this_month: number
  low_stock_alerts: number
  recent_activity: Array<{
    id: number
    type: "entry" | "exit"
    description: string
    created_at: string
  }>
  low_stock_products: Array<{
    id: number
    name: string
    current_stock: number
    minimum_stock: number
  }>
}

// API Client
export const api = {
  // Autenticación
  auth: {
    login: (email: string, password: string) => {
      // FastAPI OAuth2 espera form data, no JSON
      const formData = new URLSearchParams()
      formData.append("username", email)
      formData.append("password", password)

      return fetch(`${API_URL}/api/auth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      }).then(async (response) => {
        if (!response.ok) {
          const error = await response.json().catch(() => ({ detail: "Error desconocido" }))
          throw new Error(error.detail || `Error ${response.status}`)
        }
        return response.json()
      })
    },

    getCurrentUser: () => fetchAPI<User>("/api/auth/me"),
  },

  // Dashboard
  dashboard: {
    getStats: () => fetchAPI<DashboardStats>("/api/reportes/dashboard-stats"),
  },

  // Productos
  products: {
    getAll: (params?: { category?: string; search?: string }) => {
      const queryParams = new URLSearchParams()
      if (params?.category) queryParams.append("category", params.category)
      if (params?.search) queryParams.append("search", params.search)
      const query = queryParams.toString()
      return fetchAPI<Product[]>(`/api/products${query ? `?${query}` : ""}`)
    },

    getById: (id: number) => fetchAPI<Product>(`/api/products/${id}`),

    getLowStock: () => fetchAPI<Product[]>("/api/products/low-stock"),

    getStats: () => fetchAPI<any>("/api/products/stats"),

    create: (data: Omit<Product, "id" | "created_at" | "updated_at">) =>
      fetchAPI<Product>("/api/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: number, data: Partial<Product>) =>
      fetchAPI<Product>(`/api/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    delete: (id: number) =>
      fetchAPI<void>(`/api/products/${id}`, {
        method: "DELETE",
      }),
  },

  // Empleados
  employees: {
    getAll: (params?: { search?: string; area?: string }) => {
      const queryParams = new URLSearchParams()
      if (params?.search) queryParams.append("search", params.search)
      if (params?.area) queryParams.append("area", params.area)
      const query = queryParams.toString()
      return fetchAPI<Employee[]>(`/api/empleado${query ? `?${query}` : ""}`)
    },

    getById: (id: number) => fetchAPI<Employee>(`/api/empleado/${id}`),

    create: (data: Omit<Employee, "id" | "created_at">) =>
      fetchAPI<Employee>("/api/empleado", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Entradas de stock
  entries: {
    getAll: (params?: { start_date?: string; end_date?: string; product_id?: number }) => {
      const queryParams = new URLSearchParams()
      if (params?.start_date) queryParams.append("start_date", params.start_date)
      if (params?.end_date) queryParams.append("end_date", params.end_date)
      if (params?.product_id) queryParams.append("product_id", params.product_id.toString())
      const query = queryParams.toString()
      return fetchAPI<StockEntry[]>(`/api/entries${query ? `?${query}` : ""}`)
    },

    getRecent: (limit = 10) => fetchAPI<StockEntry[]>(`/api/entries/recent?limit=${limit}`),

    getById: (id: number) => fetchAPI<StockEntry>(`/api/entries/${id}`),

    create: (data: Omit<StockEntry, "id" | "created_at" | "created_by" | "product">) =>
      fetchAPI<StockEntry>("/api/entries", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Salidas de stock
  exits: {
    getAll: (params?: { start_date?: string; end_date?: string; employee_id?: number; product_id?: number }) => {
      const queryParams = new URLSearchParams()
      if (params?.start_date) queryParams.append("start_date", params.start_date)
      if (params?.end_date) queryParams.append("end_date", params.end_date)
      if (params?.employee_id) queryParams.append("employee_id", params.employee_id.toString())
      if (params?.product_id) queryParams.append("product_id", params.product_id.toString())
      const query = queryParams.toString()
      return fetchAPI<StockExit[]>(`/api/exits${query ? `?${query}` : ""}`)
    },

    getById: (id: number) => fetchAPI<StockExit>(`/api/exits/${id}`),

    create: (data: Omit<StockExit, "id" | "created_at" | "created_by" | "product" | "employee">) =>
      fetchAPI<StockExit>("/api/exits", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  // Reportes
  reports: {
    getMovements: (params: {
      start_date?: string
      end_date?: string
      employee_id?: number
      product_type?: string
    }) => {
      const queryParams = new URLSearchParams()
      if (params.start_date) queryParams.append("start_date", params.start_date)
      if (params.end_date) queryParams.append("end_date", params.end_date)
      if (params.employee_id) queryParams.append("employee_id", params.employee_id.toString())
      if (params.product_type) queryParams.append("product_type", params.product_type)
      return fetchAPI<any[]>(`/api/reportes/movements?${queryParams.toString()}`)
    },

    exportCSV: (params: {
      start_date?: string
      end_date?: string
      employee_id?: number
      product_type?: string
    }) => {
      const queryParams = new URLSearchParams()
      if (params.start_date) queryParams.append("start_date", params.start_date)
      if (params.end_date) queryParams.append("end_date", params.end_date)
      if (params.employee_id) queryParams.append("employee_id", params.employee_id.toString())
      if (params.product_type) queryParams.append("product_type", params.product_type)

      // Para descarga de archivos, retornamos la URL
      return `${API_URL}/api/reportes/export?${queryParams.toString()}`
    },
  },
}
