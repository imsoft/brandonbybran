import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Página no encontrada",
  description: "La página que buscas no existe en brandonbybran.com.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 py-12">
      <h1 className="text-center text-2xl font-semibold text-foreground">
        404 — Página no encontrada
      </h1>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        Esa ruta no existe o se movió. Puedes volver al inicio o abrir un minijuego.
      </p>
      <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-2">
        <Button asChild>
          <Link href="/">Inicio</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/clicker">Clicker</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/pingpong">Ping Pong</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/laser">Laser Terror</Link>
        </Button>
      </div>
    </div>
  );
}
