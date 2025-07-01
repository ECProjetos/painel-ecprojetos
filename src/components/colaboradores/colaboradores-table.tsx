"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColaboradorView } from "@/types/colaboradores";

const statusColor = (status: string) => {
  return status.toLowerCase() === "ativo" || status.toLowerCase() === "active"
    ? "bg-green-100 text-green-800"
    : "bg-gray-100 text-gray-700";
};

interface Props {
  colaboradores: ColaboradorView[];
}

export function ColaboradoresTable({ colaboradores }: Props) {
  const [search, setSearch] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [status, setStatus] = useState("");
  const [cargo, setCargo] = useState("");

  const departamentos = Array.from(
    new Set(
      colaboradores
        .map((c) => c.nome_departamento)
        .filter((d): d is string => d !== null)
    )
  ).sort();

  const cargos = Array.from(
    new Set(
      colaboradores
        .map((c) => c.nome_cargo)
        .filter((c): c is string => c !== null)
    )
  ).sort();

  const statusList = Array.from(
    new Set(colaboradores.map((c) => c.status))
  ).sort();

  const filtered = colaboradores.filter(
    (c) =>
      c.nome.toLowerCase().includes(search.toLowerCase()) &&
      (departamento ? c.nome_departamento === departamento : true) &&
      (status ? c.status === status : true) &&
      (cargo ? c.nome_cargo === cargo : true)
  );

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <Select onValueChange={setDepartamento}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos os Departamentos" />
          </SelectTrigger>
          <SelectContent>
            {departamentos.map((dep) => (
              <SelectItem key={dep} value={dep}>
                {dep}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Todos os Status" />
          </SelectTrigger>
          <SelectContent>
            {statusList.map((st) => (
              <SelectItem key={st} value={st}>
                {st}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={setCargo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos os Cargos" />
          </SelectTrigger>
          <SelectContent>
            {cargos.map((cg) => (
              <SelectItem key={cg} value={cg}>
                {cg}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Banco de Horas</TableHead>
              <TableHead>Carga Horária</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((colab) => (
              <TableRow key={colab.id}>
                <TableCell>{colab.nome}</TableCell>
                <TableCell>{colab.email}</TableCell>
                <TableCell>{colab.nome_departamento ?? "—"}</TableCell>
                <TableCell>{colab.nome_cargo ?? "—"}</TableCell>
                <TableCell>
                  <Badge className={statusColor(colab.status)}>
                    {colab.status.charAt(0).toUpperCase() +
                      colab.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {colab.banco_horas_atual != null
                    ? colab.banco_horas_atual > 0
                      ? `+${colab.banco_horas_atual}h`
                      : `${colab.banco_horas_atual}h`
                    : "—"}
                </TableCell>
                <TableCell>
                  {colab.carga_horaria != null
                    ? `${colab.carga_horaria}h`
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">
            Nenhum colaborador encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
