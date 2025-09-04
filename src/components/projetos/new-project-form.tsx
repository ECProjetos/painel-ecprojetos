"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { NewProject, newProjectSchema } from "@/types/projects";

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
import { STATUS_OPTIONS, StatusValue } from "@/constants/status";
import Link from "next/link";
import MultiSelect from "../ui/multi-select";
import { useQuery } from "@tanstack/react-query";
import { getAtividades } from "@/app/actions/inicio/get-atividades";
import { Atividade } from "@/types/atidades";

interface NewProjectFormProps {
  departments: { id: number; name: string }[];
  onSubmit: (data: NewProject) => void;
  projeto?: NewProject | null;
}

export function NewProjectForm({
  departments,
  onSubmit,
  projeto,
}: NewProjectFormProps) {
  const form = useForm<NewProject>({
    resolver: zodResolver(newProjectSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      status: "ativo",
      estimated_hours: 0,
      department_ids: [],
      activities: [],
      encharged: "",
    },
  });

  // 🔑 Resetar valores quando receber "projeto" (edição)
  useEffect(() => {
    if (projeto) {
      form.reset({
        name: projeto.name ?? "",
        code: projeto.code ?? "",
        description: projeto.description ?? "",
        status: projeto.status ?? "ativo",
        estimated_hours: projeto.estimated_hours ?? 0,
        department_ids: projeto.department_ids ?? [],
        activities: projeto.activities ?? [],
        encharged: projeto.encharged ?? "",
      });
    }
  }, [projeto, form]);

  const { data: activities } = useQuery<Atividade[]>({
    queryKey: ["atividades"],
    queryFn: getAtividades,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
        noValidate
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Preencha os campos abaixo para{" "}
              {projeto ? "atualizar" : "criar"} o projeto.
            </p>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Nome do Projeto</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Projeto Incrível EC Projetos"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Código */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Código do Projeto</FormLabel>
                <FormControl>
                  <Input
                    placeholder="ECP-01 Projeto Incrível"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Status do Projeto</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? "ativo"}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(
                        (s: { value: StatusValue; label: string }) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Horas estimadas */}
          <FormField
            control={form.control}
            name="estimated_hours"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Horas Estimadas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ex: 404"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === "" ? null : Number(val));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descrição */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-2 md:col-span-2">
                <FormLabel>Descrição do Projeto</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descrição do projeto. Ex: Projeto para facilitar gestão interna de horários trabalhados por projeto."
                    className="min-h-[120px]"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Gestor */}
          <FormField
            control={form.control}
            name="encharged"
            render={({ field }) => (
              <FormItem className="space-y-2 md:col-span-2">
                <FormLabel>Gestor</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Gestor do projeto"
                    {...field}
                    className="w-1/2"
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Departamentos */}
        <div className="space-y-3">
          <FormField
            control={form.control}
            name="department_ids"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Departamentos</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-1">
                    {departments.map((dep) => {
                      const checked = field.value?.includes(dep.id);
                      return (
                        <label
                          key={dep.id}
                          className="flex items-center gap-3 rounded-md border p-3 bg-background"
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-primary"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                field.onChange([
                                  ...(field.value ?? []),
                                  dep.id,
                                ]);
                              } else {
                                field.onChange(
                                  (field.value ?? []).filter(
                                    (id) => id !== dep.id
                                  )
                                );
                              }
                            }}
                          />
                          <span className="text-sm">{dep.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Atividades */}
        <FormField
          control={form.control}
          name="activities"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="font-semibold">Atividades</FormLabel>
              <FormControl>
                <MultiSelect
                  className="max-w-2xl"
                  options={activities?.map((activity) => ({
                    label: activity.name,
                    value: activity.id.toString(),
                  }))}
                  value={field.value ?? []}
                  onChange={(vals: string[]) => field.onChange(vals)}
                  placeholder="Selecione atividades..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Ações */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/controle-horarios/direcao/projetos"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full sm:w-auto"
            )}
          >
            Voltar
          </Link>
          <Button type="submit" className="w-full sm:w-auto">
            {projeto ? "Atualizar Projeto" : "Criar Projeto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
