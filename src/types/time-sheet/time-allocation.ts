import { z } from 'zod';

export const TimeAllocationSchema = z.object({
    id: z.string().uuid(),
    project_id: z.string().nonempty("Selecione um projeto"),
    activity_id: z.string().nonempty("Selecione uma atividade"),
    allocation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    hours: z
        .number({ invalid_type_error: "Horas deve ser número" })
        .min(0, "Horas não pode ser negativo"),
    comment: z.string().optional(),
});

export const newTimeAllocationSchema = TimeAllocationSchema.omit({
    id: true,
});

export type TimeAllocation = z.infer<typeof TimeAllocationSchema>;
export type NewTimeAllocation = z.infer<typeof newTimeAllocationSchema>;

