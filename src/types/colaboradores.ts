import { z } from "zod"
import { roleEnum } from "./role-enum"

export const ColaboradorSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().min(1, { message: "Nome é obrigatório" }),
  email: z.string().email({ message: "Email inválido" }),
  cargoId: z.number().int().positive({ message: "Cargo é obrigatório" }),
  role: roleEnum,
  working_hours_per_day: z
    .number()
    .int()
    .min(1, {
      message: "Horas de trabalho por dia devem ser um número positivo",
    }),
  status: z.enum(["ativo", "inativo"]),
  departamentoId: z
    .number()
    .int()
    .positive({ message: "Departamento é obrigatório" }),

  // Novos campos
  endereco: z.string().min(1, { message: "Endereço é obrigatório" }),
  cep: z.string().min(8, { message: "CEP deve ter ao menos 8 caracteres" }),
  cidade: z.string().min(1, { message: "Cidade é obrigatória" }),
  estado: z.string().min(2, { message: "Estado é obrigatório" }),
  telefone: z.string().min(10, { message: "Telefone inválido" }),
  data_nascimento: z
    .string()
    .min(1, { message: "Data de nascimento é obrigatória" }), // pode ser z.coerce.date() se for Date
  naturalidade: z.string().min(1, { message: "Naturalidade é obrigatória" }),
  grau_escolaridade: z
    .string()
    .min(1, { message: "Escolaridade é obrigatória" }),
  pis: z.string().min(1, { message: "PIS é obrigatório" }),
  cpf: z.string().min(11, { message: "CPF inválido" }),
  rg: z.string().min(1, { message: "RG é obrigatório" }),
  orgao_emissor: z.string().min(1, { message: "Órgão emissor é obrigatório" }),
  uf_rg: z.string().min(2, { message: "UF do RG é obrigatória" }),
  data_admissao: z
    .string()
    .min(1, { message: "Data de admissão é obrigatória" }), // pode ser z.coerce.date()
  horario: z.string().min(1, { message: "Horário é obrigatório" }),
})

export const NewColaboradorSchema = ColaboradorSchema.omit({ id: true })
  .extend({
    password: z
      .string()
      .min(8, { message: "Senha deve ter pelo menos 8 caracteres" }),
    confirmPassword: z
      .string()
      .min(8, {
        message: "Confirmação de senha deve ter pelo menos 8 caracteres",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

export const ColaboradorUpdateSchema = ColaboradorSchema.partial()

export const ColaboradorViewSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  email: z.string().email(),
  nome_departamento: z.string().nullable(),
  nome_cargo: z.string().nullable(),
  status: z.enum(["ativo", "inativo"]),
  carga_horaria: z.number().nullable(),
  banco_horas_atual: z.number().nullable(),
})

export type Colaborador = z.infer<typeof ColaboradorSchema>
export type NewColaborador = z.infer<typeof NewColaboradorSchema>
export type ColaboradorUpdate = z.infer<typeof ColaboradorUpdateSchema>
export type ColaboradorView = z.infer<typeof ColaboradorViewSchema>
