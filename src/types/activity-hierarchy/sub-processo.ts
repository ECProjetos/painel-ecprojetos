import { z } from 'zod';
import { activetSatatusEnum } from './status-enum';

export const subProcessoSchema = z.object({
    id: z.number(),
    nome: z.string().min(1, 'Nome é obrigatório'),
    processo_id: z.number(),
    status: activetSatatusEnum,
});

export const subProcessosSchema = z.array(subProcessoSchema)

export const newSubProcessoSchema = subProcessoSchema.omit({ id: true });

export const subProcessoViewSchema = subProcessoSchema.extend({
    processo_nome: z.string(),
});

export type SubProcesso = z.infer<typeof subProcessoSchema>;
export type NewSubProcesso = z.infer<typeof newSubProcessoSchema>;
export type SubProcessoView = z.infer<typeof subProcessoViewSchema>;