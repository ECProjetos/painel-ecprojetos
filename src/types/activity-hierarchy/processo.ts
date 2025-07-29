import { z } from 'zod';
import { activetSatatusEnum } from './status-enum';

export const processoSchema = z.object({
    id: z.number(),
    nome: z.string().min(1, 'Nome é obrigatório'),
    macroprocesso_id: z.number(),
    status: activetSatatusEnum,
});

export const newProcessoSchema = processoSchema.omit({ id: true });

export const processosSchema = z.array(processoSchema)


export const processoViewSchema = processoSchema.extend({
    macroprocesso_nome: z.string(),
});

export type Processo = z.infer<typeof processoSchema>;
export type NewProcesso = z.infer<typeof newProcessoSchema>;
export type ProcessoView = z.infer<typeof processoViewSchema>;