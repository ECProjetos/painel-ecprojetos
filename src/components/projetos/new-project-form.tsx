"use client";

import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";

import { getAtividades } from "@/app/actions/inicio/get-atividades";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { STATUS_OPTIONS, type StatusValue } from "@/constants/status";
import { cn } from "@/lib/utils";
import type { Atividade } from "@/types/atidades";
import { newProjectSchema, type NewProject } from "@/types/projects";

import MultiSelect from "../ui/multi-select";

interface NewProjectFormProps {
  departments: { id: number; name: string }[];
  onSubmit: (data: NewProject) => Promise<void> | void;
  projeto?: NewProject | null;
}

const EMPTY_PRODUCT: NewProject["products"][number] = {
  name: "",
  estimated_hours: 0,
  status: "ativo",
};

const PRODUCT_STATUS_OPTIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "concluido", label: "Concluído" },
  { value: "inativo", label: "Inativo" },
] as const;

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
      products: [{ ...EMPTY_PRODUCT }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products",
    keyName: "fieldKey",
  });

  const estimatedProjectHours = Number(
    useWatch({
      control: form.control,
      name: "estimated_hours",
    }) ?? 0,
  );

  const watchedProducts =
    useWatch({
      control: form.control,
      name: "products",
    }) ?? [];

  const totalProductHours = watchedProducts.reduce((total, product) => {
    if (!product || product.status === "inativo") {
      return total;
    }

    return total + Number(product.estimated_hours || 0);
  }, 0);

  const remainingHours = estimatedProjectHours - totalProductHours;
  const exceedsProjectHours = remainingHours < 0;

  const productsErrorMessage =
    typeof form.formState.errors.products?.message === "string"
      ? form.formState.errors.products.message
      : null;

  useEffect(() => {
    if (!projeto) {
      return;
    }

    form.reset({
      name: projeto.name ?? "",
      code: projeto.code ?? "",
      description: projeto.description ?? "",
      status: projeto.status ?? "ativo",
      estimated_hours: projeto.estimated_hours ?? 0,
      department_ids: projeto.department_ids ?? [],
      activities: projeto.activities ?? [],
      encharged: projeto.encharged ?? "",
      products:
        projeto.products && projeto.products.length > 0
          ? projeto.products.map((product) => ({
              id: product.id,
              name: product.name ?? "",
              estimated_hours: Number(product.estimated_hours ?? 0),
              status: product.status ?? "ativo",
            }))
          : [{ ...EMPTY_PRODUCT }],
    });
  }, [projeto, form]);

  const { data: activities } = useQuery<Atividade[]>({
    queryKey: ["atividades"],
    queryFn: getAtividades,
  });

  const handleSubmit = async (data: NewProject) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-8"
        noValidate
      >
        <div className="flex items-start justify-between">
          <p className="text-sm text-muted-foreground">
            Preencha os campos abaixo para {projeto ? "atualizar" : "criar"} o
            projeto.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                        (status: { value: StatusValue; label: string }) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimated_hours"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel>Horas Estimadas do Projeto</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    placeholder="Ex.: 1000"
                    value={field.value || ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      field.onChange(value === "" ? 0 : Number(value));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-2 md:col-span-2">
                <FormLabel>Descrição do Projeto</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descrição do projeto"
                    className="min-h-[120px]"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    className="w-full md:w-1/2"
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <FormField
            control={form.control}
            name="department_ids"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Departamentos</FormLabel>
                <FormControl>
                  <div className="mt-1 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {departments.map((department) => {
                      const checked = field.value?.includes(department.id);

                      return (
                        <label
                          key={department.id}
                          className="flex items-center gap-3 rounded-md border bg-background p-3"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-primary"
                            checked={checked}
                            onChange={(event) => {
                              if (event.target.checked) {
                                field.onChange([
                                  ...(field.value ?? []),
                                  department.id,
                                ]);
                              } else {
                                field.onChange(
                                  (field.value ?? []).filter(
                                    (departmentId) =>
                                      departmentId !== department.id,
                                  ),
                                );
                              }
                            }}
                          />
                          <span className="text-sm">{department.name}</span>
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

        <section className="space-y-4 rounded-lg border p-4 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Produtos do projeto</h2>
              <p className="text-sm text-muted-foreground">
                Cadastre os relatórios, estudos ou outros entregáveis previstos
                e informe as horas estimadas de cada produto.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ ...EMPTY_PRODUCT })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar produto
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((productField, index) => (
              <div
                key={productField.fieldKey}
                className="grid grid-cols-1 gap-4 rounded-md border bg-muted/20 p-4 md:grid-cols-[minmax(0,1fr)_180px_170px_auto] md:items-start"
              >
                <FormField
                  control={form.control}
                  name={`products.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produto {index + 1}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex.: Estudo de mercado"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`products.${index}.estimated_hours`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas estimadas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          placeholder="Ex.: 500"
                          value={field.value || ""}
                          onChange={(event) => {
                            const value = event.target.value;
                            field.onChange(value === "" ? 0 : Number(value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`products.${index}.status`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRODUCT_STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:pt-8">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    disabled={fields.length === 1}
                    title={productField.id ? "Inativar ao salvar" : "Remover"}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">
                      {productField.id ? "Inativar produto" : "Remover produto"}
                    </span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div
            className={cn(
              "grid gap-3 rounded-md border p-4 text-sm sm:grid-cols-3",
              exceedsProjectHours && "border-destructive bg-destructive/5",
            )}
          >
            <div>
              <span className="block text-muted-foreground">
                Horas do projeto
              </span>
              <strong>{estimatedProjectHours} h</strong>
            </div>
            <div>
              <span className="block text-muted-foreground">
                Horas distribuídas
              </span>
              <strong>{totalProductHours} h</strong>
            </div>
            <div>
              <span className="block text-muted-foreground">
                {exceedsProjectHours ? "Horas excedentes" : "Horas disponíveis"}
              </span>
              <strong className={cn(exceedsProjectHours && "text-destructive")}>
                {Math.abs(remainingHours)} h
              </strong>
            </div>
          </div>

          {exceedsProjectHours && (
            <p className="text-sm font-medium text-destructive">
              A soma das horas dos produtos não pode ultrapassar as horas
              estimadas do projeto.
            </p>
          )}

          {productsErrorMessage && (
            <p className="text-sm font-medium text-destructive">
              {productsErrorMessage}
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Ao remover um produto já cadastrado e salvar o projeto, ele será
            inativado — não apagado — para preservar os registros de ponto e o
            histórico dos relatórios.
          </p>
        </section>

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
                  onChange={(values: string[]) => field.onChange(values)}
                  placeholder="Selecione atividades..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/projetos"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full sm:w-auto",
            )}
          >
            Voltar
          </Link>

          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={form.formState.isSubmitting || exceedsProjectHours}
          >
            {form.formState.isSubmitting
              ? "Salvando..."
              : projeto
                ? "Atualizar Projeto"
                : "Criar Projeto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}