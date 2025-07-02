import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  ColaboradorUpdateSchema,
  type ColaboradorUpdate,
} from "@/types/colaboradores";
import { rolesListDynamic, type RoleOption } from "@/constants/roles";

// shadcn/ui components
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface EditColaboradorFormProps {
  initialValues: ColaboradorUpdate & { id: string };
  cargos: { id: number; nome: string }[];
  departamentos: { id: number; name: string }[];
  onSubmit: (values: ColaboradorUpdate) => void;
}

export function EditColaboradorForm({
  initialValues,
  cargos,
  departamentos,
  onSubmit,
}: EditColaboradorFormProps) {
  const form = useForm<ColaboradorUpdate>({
    resolver: zodResolver(ColaboradorUpdateSchema),
    defaultValues: initialValues,
    mode: "onBlur",
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Nome */}
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do Colaborador" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Cargo */}
          <FormField
            control={form.control}
            name="cargoId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(v) => field.onChange(parseInt(v, 10))}
                    value={field.value?.toString()}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {cargos.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Departamento */}
          <FormField
            control={form.control}
            name="departamentoId"
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
                      {departamentos.map((d) => (
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

          {/* Role */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value as string}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {rolesListDynamic.map((r: RoleOption) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Carga Horária */}
          <FormField
            control={form.control}
            name="working_hours_per_day"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carga Horária (horas/dia)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ex: 8"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(Number(e.target.value))}
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
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value as string}
                    className="flex space-x-6"
                  >
                    <label className="flex items-center space-x-2">
                      <RadioGroupItem value="ativo" id="status-ativo" />
                      <span>Ativo</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <RadioGroupItem value="inativo" id="status-inativo" />
                      <span>Inativo</span>
                    </label>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex w-full justify-between">
          <Link
            href="/controle-horarios/gestao/colaboradores"
            className={cn(buttonVariants({ variant: "outline" }), "w-auto")}
          >
            Cancelar
          </Link>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
