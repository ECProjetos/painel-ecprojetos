// src/components/NewColaboradorForm.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  NewColaboradorSchema,
  type NewColaborador,
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
import { Button } from "@/components/ui/button";

interface NewColaboradorFormProps {
  cargos: { id: number; nome: string }[];
  departamentos: { id: number; name: string }[];
  onSubmit: (values: NewColaborador) => void;
}

export function NewColaboradorForm({
  cargos,
  departamentos,
  onSubmit,
}: NewColaboradorFormProps) {
  const form = useForm<NewColaborador>({
    resolver: zodResolver(NewColaboradorSchema),
    defaultValues: {
      nome: "",
      email: "",
      cargoId: undefined as unknown as number,
      departamentoId: undefined as unknown as number,
      role: rolesListDynamic[0]?.value as NewColaborador["role"],
      working_hours_per_day: 0,
      status: "ativo",
      password: "",
      confirmPassword: "",
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
                    <SelectTrigger>
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
                    <SelectTrigger>
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

          {/* Role (COLABORADOR | GESTOR | DIRETOR) */}
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
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

          {/* Senha */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Senha" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirmação de Senha */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar Senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Confirme a senha"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Status (radio) */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
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

        {/* Buttons */}
        <div className="flex w-full justify-end space-x-2">
          <Button variant="outline" type="button" onClick={() => form.reset()}>
            Cancel
          </Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Form>
  );
}
