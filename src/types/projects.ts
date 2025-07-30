import { z } from 'zod';

export const statusEnum = z.enum(['ativo', 'concluido', 'pausado', 'inativo']);
export const projectSchema = z.object({
    id: z.number(),
    name: z.string().min(1, { message: 'Nome é obrigatório' }),
    code: z.string().min(1, { message: 'Código é obrigatório' }),
    department_name: z.string(),
    description: z.string().optional(),
    department_id: z.number().int().positive({ message: 'Departamento é obrigatório' }),
    status: statusEnum,
    estimated_hours: z.number().int().positive({ message: 'Horas estimadas devem ser um número positivo' }),
})

export const newProjectSchema = projectSchema.omit({ id: true, department_name: true });

export const timeSumaryViewProjectSchema = projectSchema.omit({
    department_id: true,
}).extend({
    total_allocated_hours: z.number()
});

export type Project = z.infer<typeof projectSchema>;
export type NewProject = z.infer<typeof newProjectSchema>;
export type TimeSumaryViewProject = z.infer<typeof timeSumaryViewProjectSchema>;