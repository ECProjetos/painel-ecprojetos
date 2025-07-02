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

import { TimeSumaryViewProject } from "@/types/projects";

import { deletProject } from "@/app/actions/projects";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Label } from "@radix-ui/react-label";

type handleDeleteProjectProps = {
  id: number;
  onUpdate: () => void;
};

const handleDeleteProject = async ({
  id,
  onUpdate,
}: handleDeleteProjectProps) => {
  try {
    await deletProject(id);
    toast.success("Projeto deletado com sucesso.");
    onUpdate(); // Chama a função de atualização após deletar
  } catch (error) {
    console.error("Erro ao deletar projeto:", error);
    toast.error("Erro ao deletar projeto. Tente novamente mais tarde.");
  }
};

type projectColumnsProps = {
  onUpdate: () => void;
};

export const projectColumns = ({
  onUpdate,
}: projectColumnsProps): ColumnDef<TimeSumaryViewProject>[] => [
  {
    accessorKey: "code",
    header: "Código",
  },
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "description",
    header: "Descrição",
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
    header: "Departamento",
  },
  {
    accessorKey: "estimated_hours",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Horas Estimadas" />
    ),
  },
  {
    accessorKey: "total_allocated_hours",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Horas Alocadas" />
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          className="capitalize"
          variant={
            status === "ativo"
              ? "ativo"
              : status === "concluido"
              ? "secondary"
              : status === "pausado"
              ? "paudado"
              : "inativel"
          }
        >
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
      const project = row.original;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [confirmText, setConfirmText] = useState("");

      const expectedText = `Deletar ${project.name}`;
      const isConfirmValid = confirmText === expectedText;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/controle-horarios/direcao/projetos/${project.id}`}>
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
                  <AlertDialogTitle>Deletar Projeto</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja deletar o projeto{" "}
                    <strong>{project.name}</strong>? Esta ação não pode ser
                    desfeita.{" "}
                    <strong>
                      Todas as informações relacionadas a este projeto serão
                      perdidas permanentemente
                    </strong>
                    . Inclusive o histórico de alocação de horas e relatórios
                    associados.
                    <strong>
                      Considere mudar o status para conluido, inativo ou pausado
                    </strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Label className="text-sm">
                  Para confirmar a exclusão, digite{" "}
                  <strong>&quot;Deletar {project.name}&quot;</strong>
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
                      handleDeleteProject({ id: project.id, onUpdate })
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
