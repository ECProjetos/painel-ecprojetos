"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Check, Trash, MoreHorizontal, PenSquare } from "lucide-react";
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
import { toast } from "sonner";
import Link from "next/link";
import { deletProject } from "@/app/actions/projects";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Label } from "@/components/ui/label"; // Corrected import
import { Badge } from "@/components/ui/badge";
import { ProjectType } from "@/types/inicio/projetos";

const projectStatusConfig: Record<
  ProjectType["status"],
  { label: string; className: string; completed?: boolean }
> = {
  ativo: {
    label: "Ativo",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  },
  inativo: {
    label: "Inativo",
    className:
      "border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
  pausado: {
    label: "Pausado",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
  },
  concluido: {
    label: "Concluído",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
    completed: true,
  },
};

const ProjectStatusCell = ({ status }: { status: ProjectType["status"] }) => {
  const config = projectStatusConfig[status];

  return (
    <Badge
      variant="outline"
      className={`gap-1.5 rounded-full px-2.5 py-0.5 ${config.className}`}
    >
      {config.completed ? (
        <Check aria-hidden="true" strokeWidth={2.5} />
      ) : (
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-current"
        />
      )}
      {config.label}
    </Badge>
  );
};

// Component for the description cell
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DescriptionCell = ({ row }: { row: any }) => {
  const description = row.original.description
    ? row.original.description
    : "Sem descrição";
  const fullDescription = description;

  const [expanded, setExpanded] = useState(false);
  const limiteCaracteres = 50;

  const textoExibido = expanded
    ? fullDescription
    : description.slice(0, limiteCaracteres) +
      (fullDescription.length > limiteCaracteres ? "..." : "");

  return (
    <div
      className="text-sm "
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
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "gray",
            fontSize: "12px"
          }}
        >
          {expanded ? "Mostrar menos" : "Mostrar mais"}
        </button>
      )}
    </div>
  );
};

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
    onUpdate();
} catch (error) {
    console.error("Erro ao deletar projeto:", error);
    toast.error("Erro ao deletar projeto. Tente novamente mais tarde.");
}
};


// Component for the actions cell
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ActionsCell = ({ row, onUpdate }: { row: any; onUpdate: () => void }) => {
  const project = row.original;
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
          <Link href={`/projetos/${project.id}`}>
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
};

type projectColumnsProps = {
  onUpdate: () => void;
};

export const projectColumns = ({
  onUpdate,
}: projectColumnsProps): ColumnDef<ProjectType>[] => [
  {
    accessorKey: "code",
    header: "Código",
  },
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <ProjectStatusCell status={row.original.status} />,
  },
  {
    accessorKey: "description",
    header: "Descrição",
    cell: DescriptionCell,
  },
  {
    accessorKey: "estimated_hours",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Horas Estimadas" />
    ),
  },
  {
    id: "actions",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ações" />
    ),
    cell: ({ row }) => <ActionsCell row={row} onUpdate={onUpdate} />,
  },
];
