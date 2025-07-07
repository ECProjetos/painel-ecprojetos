import { z } from 'zod';
import { activetSatatusEnum } from './status-enum';

export const macroprocessoSchema = z.object({
    id: z.number(),
    nome: z.string().min(1, 'Nome é obrigatório'),
    status: activetSatatusEnum,
});

export const newMacroprocessoSchema = macroprocessoSchema.omit({ id: true });

export type Macroprocesso = z.infer<typeof macroprocessoSchema>;
export type NewMacroprocesso = z.infer<typeof newMacroprocessoSchema>;