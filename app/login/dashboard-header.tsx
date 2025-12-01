"use client";
/**
 * Este archivo define la página de Inventario del sistema.
 * "use client" indica que este componente se ejecutará del lado del cliente
 * en Next.js (Client Component).
 */

// Componente visual para mostrar carga mientras llegan los datos.
import { useAuth } from "@/lib/auth-context";

export function DashboardHeader() {
  //Variable que retorna el usuario del backend.
  const { user } = useAuth();
  //Retorna el nombre del Usuario y el Bienvenido en el header Principal.
  return (
    <header className="sticky top-0 z-10 flex h-14 md:h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6 lg:pl-6">
      <div className="lg:pl-0 pl-12">
        <h1 className="text-base md:text-xl font-semibold">
          👋Bienvenido, {user?.full_name}
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
          {user?.area}
        </p>
      </div>
    </header>

    // <div className="flex items-center gap-2 md:gap-4">
    // <Button variant="ghost" size="icon" className="relative h-8 w-8 md:h-10 md:w-10">
    //<Bell className="h-4 w-4 md:h-5 md:w-5" />
    //<Badge
    //variant="destructive"
    //className="absolute -right-1 -top-1 h-4 w-4 md:h-5 md:w-5 rounded-full p-0 text-[10px] md:text-xs flex items-center justify-center"
    // >
    // </Badge>
    //</Button>
    // </div>
  );
}
