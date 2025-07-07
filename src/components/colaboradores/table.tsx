"use client";

import * as React from "react";
import { useState, useMemo } from "react";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table/pagination";
import { DataTableViewOptions } from "@/components/data-table/column-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface ColaboradorTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function ColaboradorTable<TData, TValue>({
  columns,
  data,
}: ColaboradorTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // extrai lista única de departamentos e statuses
  const departmentOptions = useMemo(() => {
    const setDeps = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.forEach((row) => setDeps.add((row as any).nome_departamento));
    return Array.from(setDeps).sort();
  }, [data]);

  const statusOptions = useMemo(() => {
    const setSts = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.forEach((row) => setSts.add((row as any).status));
    return Array.from(setSts).sort();
  }, [data]);

  const cargosOptions = useMemo(() => {
    const setCargos = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.forEach((row) => setCargos.add((row as any).nome_cargo));
    return Array.from(setCargos).sort();
  }, [data]);

  const handleResetFilters = () => {
    setColumnFilters([]);
    setSorting([]);
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-wrap items-center justify-between p-4 space-x-2">
        {/* Filtro por Nome */}
        <Input
          placeholder="Pesquisar Nome do Colaborador..."
          value={(table.getColumn("nome")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("nome")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        {/* Filtro por Departamento */}
        <Select
          value={
            (table
              .getColumn("nome_departamento")
              ?.getFilterValue() as string) ?? "all"
          }
          onValueChange={(value) =>
            table
              .getColumn("nome_departamento")
              ?.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="flex-1 min-w-0">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {departmentOptions.map((dep) => (
              <SelectItem key={dep} value={dep}>
                {dep}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro por Status */}
        <Select
          value={
            (table.getColumn("status")?.getFilterValue() as string) ?? "all"
          }
          onValueChange={(value) =>
            table
              .getColumn("status")
              ?.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="flex-1 min-w-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Filtro por Cargo */}
        <Select
          value={
            (table.getColumn("nome_cargo")?.getFilterValue() as string) ?? "all"
          }
          onValueChange={(value) =>
            table
              .getColumn("nome_cargo")
              ?.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="flex-1 min-w-0">
            <SelectValue placeholder="Cargo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {cargosOptions.map((cargo) => (
              <SelectItem key={cargo} value={cargo}>
                {cargo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            Resetar Filtros
          </Button>
          <DataTableViewOptions table={table} />
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto px-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="py-4">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}