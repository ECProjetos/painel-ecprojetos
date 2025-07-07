"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Props {
  initialMonth: number;
  initialYear: number;
}

export default function MonthFilter({ initialMonth, initialYear }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [month, setMonth] = React.useState(initialMonth);
  const [year, setYear] = React.useState(initialYear);

  const applyFilter = () => {
    const q = new URLSearchParams(params.toString());
    q.set("month", String(month));
    q.set("year", String(year));
    router.push(`?${q.toString()}`);
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Seletor de Mês */}
      <Select
        defaultValue={String(initialMonth)}
        onValueChange={(v) => setMonth(Number(v))}
      >
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 12 }, (_, i) => (
            <SelectItem key={i + 1} value={String(i + 1)}>
              {String(i + 1).padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Seletor de Ano (exibe 2 anos antes e 2 anos depois) */}
      <Select
        defaultValue={String(initialYear)}
        onValueChange={(v) => setYear(Number(v))}
      >
        <SelectTrigger className="w-24">
          <SelectValue placeholder="Ano" />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 5 }, (_, i) => {
            const y = initialYear - 2 + i;
            return (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <Button onClick={applyFilter}>Filtrar</Button>
    </div>
  );
}
