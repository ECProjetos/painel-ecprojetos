import { z } from 'zod';
import { activetSatatusEnum } from './status-enum';

export const atividadeSchema = z.object({
    id: z.number(),
    name: z.string().min(1, 'Nome é obrigatório'),
    description: z.string().optional(),
    status: activetSatatusEnum,
    macroprocesso_id: z.number(),
    processo_id: z.number(),
    sub_processo_id: z.number().optional(),
});

export const newAtividadeSchema = atividadeSchema.omit({ id: true });

export const atividadeViewSchema = atividadeSchema.extend({
    macroprocesso_nome: z.string(),
    processo_nome: z.string(),
    sub_processo_nome: z.string().optional(),
});

export type Atividade = z.infer<typeof atividadeSchema>;
export type NewAtividade = z.infer<typeof newAtividadeSchema>;
export type AtividadeView = z.infer<typeof atividadeViewSchema>;
