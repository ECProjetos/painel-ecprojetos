/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { ColumnDef } from "@tanstack/react-table";

import { Trash, PenSquare } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

import { Macroprocesso } from "@/types/activity-hierarchy/macroprocesso";
import { deleteMacroprocesso } from "@/app/actions/activity-hierarchy/macroprocesso";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Label } from "@/components/ui/label";

type handleDeleteMacroprocessoProps = {
  id: number;
  onUpdate: () => void;
};

const handleDeleteMacroprocesso = async ({
  id,
  onUpdate,
}: {
  id: number;
  onUpdate: () => void;
}) => {
  try {
    await deleteMacroprocesso(id);
    toast.success("Macroprocesso deletado com sucesso.");
    onUpdate();
  } catch (error) {
    console.error("Erro ao deletar macroprocesso:", error);
    toast.error("Erro ao deletar macroprocesso. Tente novamente mais tarde.");
  }
};

type MacroprocessoColumnProps = {
  onUpdate: () => void;
};

export const macroprocessoColumns = ({
  onUpdate,
}: MacroprocessoColumnProps): ColumnDef<Macroprocesso>[] => [
  {
    accessorKey: "nome",
    header: "Nome",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
];
