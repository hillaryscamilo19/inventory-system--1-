"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Package,
  ClipboardList,
  FileText,
  LogOut,
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "delivery_manager", "auditor"],
  },
  {
    name: "Inventario",
    href: "/dashboard/inventory",
    icon: Package,
    roles: ["admin", "delivery_manager", "auditor"],
  },
  {
    name: "Entradas",
    href: "/dashboard/entries",
    icon: ArrowUpCircle,
    roles: ["admin", "delivery_manager"],
  },
  {
    name: "Salidas",
    href: "",
    icon: ArrowDownCircle,
    roles: ["admin", "delivery_manager"],
  },
  {
    name: "Entregas",
    href: "/dashboard/deliveries",
    icon: ClipboardList,
    roles: ["admin", "delivery_manager", "employee"],
  },
  {
    name: "Reportes",
    href: "/dashboard/reports",
    icon: FileText,
    roles: ["admin", "auditor"],
  },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const filteredNavigation = navigation.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      <div
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-300",
          // Desktop: collapsible sidebar
          isCollapsed ? "w-16" : "w-64",
          // Mobile/Tablet: slide in from left
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div
            className={cn(
              "flex items-center gap-2",
              isCollapsed && "justify-center w-full"
            )}
          >
            <Package className="h-6 w-6 text-primary flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-lg font-semibold">Inventario</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn("hidden lg:flex", isCollapsed && "absolute right-2")}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {!user ? (
            <p
              className={cn(
                "text-sm text-muted-foreground px-3",
                isCollapsed && "text-center px-0"
              )}
            >
              {isCollapsed ? "..." : "Cargando usuario..."}
            </p>
          ) : filteredNavigation.length > 0 ? (
            filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed && "justify-center px-2"
                  )}
                  title={isCollapsed ? item.name : undefined}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && item.name}
                </Link>
              );
            })
          ) : (
            <p
              className={cn(
                "text-sm text-muted-foreground px-3",
                isCollapsed && "text-center px-0"
              )}
            >
              {isCollapsed ? "..." : "No hay opciones disponibles"}
            </p>
          )}
        </nav>

        <div className="border-t border-border p-3">
          {!isCollapsed ? (
            <>
              <div className="mb-3 px-2">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
                <p className="mt-1 text-xs text-muted-foreground capitalize">
                  {user?.role.replace("_", " ")}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start bg-transparent"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="w-full bg-transparent"
              onClick={logout}
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "hidden lg:block transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      />
    </>
  );
}
