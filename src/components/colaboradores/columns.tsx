"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Trash, MoreHorizontal, PenSquare, SearchIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

import { DataTableColumnHeader } from "@/components/data-table/column-header";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";
import Link from "next/link";
import { ColaboradorView } from "@/types/colaboradores";

import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Label } from "@radix-ui/react-label";

import { deleteColaborador } from "@/app/actions/colaboradores";
import { formatMinutesToHHMM } from "@/lib/utils"


type handleDeleteColaboradorProps = {
  id: string;
  onUpdate: () => void;
};

const handleDeleteColaborador = async ({
  id,
  onUpdate,
}: handleDeleteColaboradorProps) => {
  try {
    await deleteColaborador(id);
    toast.success("Colaborador deletado com sucesso.");
    onUpdate(); // Chama a função de atualização após deletar
  } catch (error) {
    console.error("Erro ao deletar colaborador:", error);
    toast.error("Erro ao deletar colaborador. Tente novamente mais tarde.");
  }
};

type colaboradoresColumnsProps = {
  onUpdate: () => void;
};

export const colaboradoresColumns = ({
  onUpdate,
}: colaboradoresColumnsProps): ColumnDef<ColaboradorView>[] => [
  {
    accessorKey: "nome",
    header: "Nome",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "nome_departamento",
    header: "Departamento",
  },
  {
    accessorKey: "nome_cargo",
    header: "Cargo",
  },
  {
    accessorKey: "carga_horaria",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Carga Horária" />
    ),
  },
  {
    accessorKey: "banco_horas_atual",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Banco de Horas" />
    ),
    cell: ({ row }) => (
      <span
        className={
          row.original.banco_horas_atual
            ? row.original.banco_horas_atual < 0
              ? "text-red-500"
              : "text-green-500"
            : "text-gray-500"
        }
      >
        {row.original.banco_horas_atual !== null
          ? formatMinutesToHHMM(row.original.banco_horas_atual)
          : "N/A"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        className="capitalize"
        variant={row.original.status === "ativo" ? "ativo" : "secondary"}
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Ações",
    cell: ({ row }) => {
      const colaboradore = row.original;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [confirmTextm, setConfirmText] = useState("");
      const expectedText = `Deletar ${colaboradore.nome}`;
      const isConfirmValid = confirmTextm === expectedText;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ações</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/controle-horarios/gestao/colaboradores/${colaboradore.id}`}
              >
                <PenSquare className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                toast.info("Funcionalidade em desenvolvimento");
              }}
            >
              <SearchIcon className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Trash className="mr-2 h-4 w-4" />
                  Deletar
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deletar Colaborador</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja deletar o colaborador{" "}
                    <strong>{colaboradore.nome}</strong>? Esta ação não pode ser
                    desfeita. <br />
                    <strong>
                      {" "}
                      Toda a informação relacionada a este colaborador será
                      perdida PERMANENTEMENTE.
                    </strong>
                    <br />
                    Considere por favor mudar o status do colaborador para
                    &quot;inativo&quot;.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Label className="text-sm">
                  Digite <strong>{expectedText}</strong> para confirmar a
                  exclusão:
                </Label>
                <Input
                  value={confirmTextm}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="mt-2"
                />

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={!isConfirmValid}
                    className="bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                    onClick={() =>
                      handleDeleteColaborador({ id: colaboradore.id, onUpdate })
                    }
                  >
                    Deletar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
