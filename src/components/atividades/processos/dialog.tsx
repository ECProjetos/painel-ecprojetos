"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import {
  NewProcesso,
  newProcessoSchema,
  Processo,
} from "@/types/activity-hierarchy/processo";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Edit, PlusCircle } from "lucide-react";
import { createProcesso } from "@/app/actions/activity-hierarchy/processos";

type MacroprocessDialogProps = {
  processo?: Processo;
  onSuccess: () => void;
};

export function ProcessoDialog({
  processo,
  onSuccess,
}: MacroprocessDialogProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NewProcesso>({
    resolver: zodResolver(newProcessoSchema),
    defaultValues: processo
      ? {
          nome: processo.nome,
          status: processo.status,
        }
      : {
          nome: "",
          status: "ativo", // valor padrão, ajuste conforme necessário
        },
  });

  const isEditing = !!processo;

  const onSubmit = async (data: NewProcesso) => {
    try {
      await createProcesso(data);
      toast.success(
        isEditing
          ? "Processo atualizado com sucesso!"
          : "Processo criado com sucesso!"
      );
      setOpen(false);
      reset();
      onSuccess?.();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error("Erro ao salvar processo: " + error.message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o && !isEditing) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {isEditing ? (
            <>
              <Edit className="w-4 h-4" />
              <span>Editar</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              <span>Processos</span>
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Processo" : "Novo Processo"}
          </DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo e clique em{" "}
            {isEditing ? "salvar" : "criar"}.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col space-y-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" {...register("nome")} />
            {errors.nome && (
              <p className="text-red-500 text-sm">{errors.nome.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={processo?.status}
              onValueChange={(value) =>
                setValue("status", value as "ativo" | "inativo")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={processo?.status}
              onValueChange={(value) =>
                setValue("status", value as "ativo" | "inativo")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-red-500 text-sm">{errors.status.message}</p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : isEditing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
