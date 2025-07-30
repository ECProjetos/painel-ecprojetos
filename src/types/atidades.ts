import { z } from 'zod';

export const activetSatatusEnum = z.enum([
    'ativo',
    'inativo',
]);
export const atividadeSchema = z.object({
    id: z.number(),
    name: z.string().min(1, 'Nome é obrigatório'),
    description: z.string().optional(),
    department_id: z.number(),
    status: activetSatatusEnum,
})

export const newAtividadeSchema = atividadeSchema.omit({ id: true });


export type Atividade = z.infer<typeof atividadeSchema>;
export type NewAtividade = z.infer<typeof newAtividadeSchema>;