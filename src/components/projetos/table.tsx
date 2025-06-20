"use client";

import * as React from "react";
import { useState } from "react";

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
import { ListRestart } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProjectTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]; // Define as colunas da tabela
  data: TData[]; // Define os dados da tabela
}

export function ProjectTable<TData, TValue>({
  columns,
  data,
}: ProjectTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]); // Define o estado de ordenação
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]); // Define o estado de filtro

  const handleResetFiltersButtonClick = () => {
    setColumnFilters([]); // Reseta os filtros
    setSorting([]); // Reseta a ordenação
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),

    initialState: {
      pagination: {
        pageSize: 15, // Define o padrão para 5 linhas por página
      },
    },
    state: {
      sorting,
      columnFilters,
    },
  });
  return (
    <div className="overflow-x-auto">
      <div className="flex items-center justify-between p-4 ">
        <Input
          placeholder="Pesquisar Nome do Projeto..."
          value={
            (table.getColumn("name")?.getFilterValue() as string) ?? "" // Define o valor do filtro
          }
          onChange={
            (event) =>
              table.getColumn("name")?.setFilterValue(event.target.value) // Define o valor do filtro}
          }
          className="max-w-sm"
        />
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            className="ml-auto hidden h-8 lg:flex"
            onClick={handleResetFiltersButtonClick}
          >
            <ListRestart />
            Resetar Filtros
          </Button>
          <DataTableViewOptions table={table} />
        </div>
      </div>
      <div className="rounded-md border overflow-x-auto px-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
