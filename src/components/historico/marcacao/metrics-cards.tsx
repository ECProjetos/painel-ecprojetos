// components/MetricsCards.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarDays, Briefcase, Clock8, Plus, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Insights {
  horasPrevistasNoMes: number;
  horasTrabalhadasNoMes: number;
  bancoDeHorasInicial: number;
  ajusteDeHorasDoMes: number;
  bancoDeHorasAtual: number;
}

interface MetricsCardsProps {
  insights: Insights;
}

// Formata um número de horas (pode ter parte decimal) em "±H:MM"
function formatHours(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const hours = Math.floor(abs);
  const minutes = Math.round((abs - hours) * 60);
  return `${sign}${hours}:${minutes.toString().padStart(2, "0")}`;
}

export function MetricsCards({ insights }: MetricsCardsProps) {
  const metrics = [
    {
      id: 1,
      title: "Horas a Fazer no Mês",
      raw: insights.horasPrevistasNoMes,
      icon: CalendarDays,
      highlight: false,
    },
    {
      id: 2,
      title: "Horas Trabalhadas no Mês",
      raw: insights.horasTrabalhadasNoMes,
      icon: Briefcase,
      highlight: false,
    },
    {
      id: 3,
      title: "Banco de Horas (Mês Anterior)",
      raw: insights.bancoDeHorasInicial,
      icon: Clock8,
      highlight: true,
    },
    {
      id: 4,
      title: "Horas Somadas ao Banco",
      raw: insights.ajusteDeHorasDoMes,
      icon: Plus,
      highlight: true,
    },
    {
      id: 5,
      title: "Banco de Horas (Atual)",
      raw: insights.bancoDeHorasAtual,
      icon: PiggyBank,
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map(({ id, title, raw, icon: Icon, highlight }) => {
        const formatted = formatHours(raw);
        const valueClass = highlight
          ? raw >= 0
            ? "text-green-600"
            : "text-red-600"
          : undefined;

        return (
          <Card key={id}>
            <CardHeader className="flex items-start justify-between pb-0">
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <div className="p-2 rounded-md bg-muted">
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <span className={cn("text-2xl font-semibold", valueClass)}>
                {formatted}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
