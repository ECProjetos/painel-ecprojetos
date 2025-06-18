"use client";

import React from "react";
import type { TimeEntryDaily } from "@/types/time-sheet/time-entry-daily ";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface Props {
  data: TimeEntryDaily[];
}

export default function TimeEntriesTable({ data }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>1º Período</TableHead>
          <TableHead>2º Período</TableHead>
          <TableHead>3º Período</TableHead>
          <TableHead>Horas a Fazer</TableHead>
          <TableHead>Horas Feitas</TableHead>
          <TableHead>Saldo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((r) => (
          <TableRow key={r.entry_date}>
            <TableCell>
              {new Date(r.entry_date).toLocaleDateString("pt-BR")}
            </TableCell>
            <TableCell>
              {r.p1_entry ?? "-"} – {r.p1_exit ?? "-"}
            </TableCell>
            <TableCell>
              {r.p2_entry ?? "-"} – {r.p2_exit ?? "-"}
            </TableCell>
            <TableCell>
              {r.p3_entry ?? "-"} – {r.p3_exit ?? "-"}
            </TableCell>
            <TableCell>{r.hours_to_do.replace(/:00$/, "")}</TableCell>
            <TableCell>{r.hours_done.replace(/:00$/, "")}</TableCell>
            <TableCell
              className={
                r.hours_balance.startsWith("-")
                  ? "text-red-600"
                  : "text-green-600"
              }
            >
              {r.hours_balance.replace(/:00$/, "")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
