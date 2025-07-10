"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Trash, MoreHorizontal, PenSquare } from "lucide-react";

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

import { AtividadeView } from "@/types/atidades";

import { deleteAtividade } from "@/app/actions/atividades";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Label } from "@/components/ui/label";

type handleDeleteAtividadeProps = {
  id: number;
  onUpdate: () => void;
};

const handleDeleteAtividade = async ({
  id,
  onUpdate,
}: handleDeleteAtividadeProps) => {
  try {
    await deleteAtividade(id);
    toast.success("Atividade deletada com sucesso.");
    onUpdate(); // Chama a função de atualização após deletar
  } catch (error) {
    console.error("Erro ao deletar atividade:", error);
    toast.error("Erro ao deletar atividade. Tente novamente mais tarde.");
  }
};
type atividadeColumnsProps = {
  onUpdate: () => void;
};

export const atividadeColumns = ({
  onUpdate,
}: atividadeColumnsProps): ColumnDef<AtividadeView>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Descrição" />
    ),
    cell: ({ row }) => {
      const description = row.original.description
        ? row.original.description
        : "Sem descrição";
      const fullDescription = description;

      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [expanded, setExpanded] = useState(false);
      const limiteCaracteres = 50; // ajuste conforme necessário

      const textoExibido = expanded
        ? fullDescription
        : description.slice(0, limiteCaracteres) +
          (fullDescription.length > limiteCaracteres ? "..." : "");

      return (
        <div
          className="text-sm text-muted-foreground"
          style={{
            whiteSpace: "normal",
            wordWrap: "break-word",
            maxWidth: "400px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {textoExibido}
          <br />
          {fullDescription.length > limiteCaracteres && (
            <button
              className="text-sm"
              onClick={() => setExpanded(!expanded)}
              style={{
                background: "none",
                border: "none",
                color: "black",
                cursor: "pointer",
              }}
            >
              {expanded ? "Mostrar menos" : "Mostrar mais"}
            </button>
          )}
        </div>
      );
    },
  },

  {
    accessorKey: "department_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Departamento" />
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={status === "ativo" ? "ativo" : "inativel"}>
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ações" />
    ),
    cell: ({ row }) => {
      const atividade = row.original;

      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [confirmText, setConfirmText] = useState("");

      const expectedText = `Deletar ${atividade.name}`;
      const isConfirmValid = confirmText === expectedText;

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
                href={`/controle-horarios/direcao/atividades/${atividade.id}`}
              >
                <PenSquare className="mr-2 h-4 w-4" />
                Editar
              </Link>
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
                  <AlertDialogTitle>Deletar Atividade</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja deletar a atividade{" "}
                    <strong>{atividade.name}</strong>? Esta ação não pode ser
                    desfeita.
                    <strong>
                      Todas as informações relacionadas a esta atividade serão
                      perdidas permanentemente.
                    </strong>
                    Inclusive o histórico de alocação de horas e relatórios
                    associados.
                    <strong>Considere mudar o status para inativa.</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Label className="text-sm ">
                  Para confirmar a exclusão, digite:{" "}
                  <strong>&quot;Deletar {atividade.name}&quot;</strong>
                </Label>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="mt-2"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={!isConfirmValid}
                    className="bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                    onClick={() =>
                      handleDeleteAtividade({ id: atividade.id, onUpdate })
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
