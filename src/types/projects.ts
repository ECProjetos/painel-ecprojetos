import { z } from "zod";

export const statusEnum = z.enum(["ativo", "concluido", "pausado", "inativo"]);

export const projectSchema = z.object({
  id: z.number(),
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  code: z.string().min(1, { message: "Código é obrigatório" }),
  description: z.string().optional(),
  department_id: z.number().int().positive({ message: "Departamento é obrigatório" }),
  status: statusEnum,
  estimated_hours: z
    .number()
    .int()
    .positive({ message: "Horas estimadas devem ser um número positivo" }),
});

// Novo schema para criação de projeto (N:N com departamentos)
export const newProjectSchema = projectSchema.omit({
  id: true,
  department_id: true, // 👈 Removemos esse campo
}).extend({
  department_ids: z
    .array(z.number().int().positive())
    .min(1, { message: "Selecione pelo menos um departamento" }),
});

export const timeSumaryViewProjectSchema = projectSchema.omit({
  department_id: true,
}).extend({
  total_allocated_hours: z.number(),
});

export type Project = z.infer<typeof projectSchema>;
export type NewProject = z.infer<typeof newProjectSchema>;
export type TimeSumaryViewProject = z.infer<typeof timeSumaryViewProjectSchema>;
