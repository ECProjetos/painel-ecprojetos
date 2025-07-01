"use clietn";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { NewAtividade, newAtividadeSchema } from "@/types/atidades";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_STATUS_OPTIONS,
  ActivityStatusValue,
} from "@/constants/status";
import Link from "next/link";

interface NewAtividadeFormProps {
  departments: { id: number; name: string }[];
  onSubmit: (data: NewAtividade) => void;
  atividade?: NewAtividade | null;
}

export function NewAtividadeForm({
  departments,
  onSubmit,
  atividade,
}: NewAtividadeFormProps) {
  const form = useForm<NewAtividade>({
    resolver: zodResolver(newAtividadeSchema),
    defaultValues: {
      name: atividade?.name || "",
      description: atividade?.description || "",
      department_id:
        atividade?.department_id || (undefined as unknown as number),
      status: atividade?.status || "ativo",
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome da atividade" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea placeholder="Descrição da atividade" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Departamento */}
        <FormField
          control={form.control}
          name="department_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Departamento</FormLabel>
              <FormControl>
                <Select
                  onValueChange={(v) => field.onChange(parseInt(v, 10))}
                  value={field.value?.toString()}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value as string}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ACTIVITY_STATUS_OPTIONS.map(
                    (s: { value: ActivityStatusValue; label: string }) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between">
          <Link href="/atividades">
            <Button
              type="button"
              variant="outline"
              className={cn(buttonVariants({ variant: "secondary" }))}
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            {atividade ? "Atualizar Atividade" : "Criar Atividade"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
