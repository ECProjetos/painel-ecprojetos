import { z } from 'zod';

const timeAllocationSchema = z.object({
    project_id: z.number().int().min(1, "Projeto é obrigatório"),
    activity_id: z.number().int().min(1, "Atividade é obrigatória"),
    hours: z.number().positive("Horas devem ser maiores que zero"),
    comment: z.string().optional(),
});

export const timeEntryFormSchema = z.object({
    entry_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Data inválida",
    }),
    period: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    entry_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: "Hora de entrada inválida (HH:mm)",
    }),
    exit_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
        message: "Hora de saída inválida (HH:mm)",
    }),
    allocations: z.array(timeAllocationSchema).min(1, "Adicione pelo menos uma alocação"),
});

export type TimeEntryFormValues = z.infer<typeof timeEntryFormSchema>;
