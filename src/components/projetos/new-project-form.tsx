"use client";

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
        status: projeto?.status || "ativo",
      estimated_hours: projeto?.estimated_hours || 0,
      department_ids: projeto?.department_ids || [],
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
        
        </div>
        <FormField
          control={form.control}
          name="department_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Departamentos</FormLabel>
              <FormControl>
                <div className="flex flex-col gap-3 mt-2">
                  {departments.map((dep) => {
                    const checked = field.value?.includes(dep.id);

                    return (
                      <label key={dep.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-primary"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              field.onChange([...field.value, dep.id]);
                            } else {
                              field.onChange(field.value.filter((id) => id !== dep.id));
                            }
                          }}
                        />
                        <span>{dep.name}</span>
                      </label>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
