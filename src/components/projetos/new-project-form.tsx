"use clietn";

import React from "react";
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
      name: projeto?.name || "",
      code: projeto?.code || "",
      description: projeto?.description || "",
      department_id: projeto?.department_id || (undefined as unknown as number),
      status: projeto?.status || "ativo",
      estimated_hours: projeto?.estimated_hours || 0,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <div className="grid grid-cols-2 gap-4">
          {/*nome*/}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Projeto</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Projeto Incrível EC Projetos"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/*CODE */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código do Projeto</FormLabel>
                <FormControl>
                  <Input placeholder="ECP-01 Projeto Incrível" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/*Descrption */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição do Projeto</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="descrição do projeto. Ex: Projeto para facilitar gestão interna de horarios trabalhados por projeto"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/*horaxz estimadas */}
          <FormField
            control={form.control}
            name="estimated_hours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horas Estimadas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ex: 404"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/*sTATUS */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status do Projeto</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="selecione um satatus" />
                      <SelectContent>
                        {STATUS_OPTIONS.map(
                          (s: { value: StatusValue; label: string }) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </SelectTrigger>
                  </Select>
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
        </div>
        <div className="flex w-full justify-between">
          <Link
            href="/controle-horarios/direcao/projetos"
            className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
          >
            Voltar
          </Link>
          <Button type="submit">
            {projeto ? "Atualizar Projeto" : "Criar Projeto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
