import { z } from 'zod';
import { activetSatatusEnum } from './status-enum';

export const subProcessoSchema = z.object({
    id: z.number(),
    nome: z.string().min(1, 'Nome é obrigatório'),
    macroprocesso_id: z.number(),
    status: activetSatatusEnum,
});

export const newProcessoSchema = subProcessoSchema.omit({ id: true });

export const processosSchema = z.array(subProcessoSchema)


export const processoViewSchema = subProcessoSchema.extend({
    macroprocesso_nome: z.string(),
});

export type SubProcesso = z.infer<typeof subProcessoSchema>;
export type NewSubProcesso = z.infer<typeof newProcessoSchema>;
export type SubProcessoView = z.infer<typeof processoViewSchema>;