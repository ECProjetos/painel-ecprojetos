import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { List, AlertTriangle, Calendar } from "lucide-react";

export function AtalhosInicio() {
  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader>
        <CardTitle>Atalhos Rápidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Alocar Horas */}
          <Link
            href="/projects/time-allocation"
            className="flex items-center p-4 space-x-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
              <List className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-zinc-800">
                Alocar Horas
              </span>
              <span className="text-xs text-zinc-500">em Projetos</span>
            </div>
          </Link>

          {/* Justificar Ausência */}
          <Link
            href="/absence/justify"
            className="flex items-center p-4 space-x-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-zinc-800">
                Justificar
              </span>
              <span className="text-xs text-zinc-500">Ausência</span>
            </div>
          </Link>

          {/* Ver Histórico */}
          <Link
            href="/time-sheet/history"
            className="flex items-center p-4 space-x-4 rounded-lg border border-zinc-200 hover:bg-zinc-50 transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-zinc-800">
                Ver Histórico
              </span>
              <span className="text-xs text-zinc-500">da Semana</span>
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
