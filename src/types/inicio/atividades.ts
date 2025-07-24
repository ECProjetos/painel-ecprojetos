import { z } from "zod";

export const activitiesSchema = z.object({
  id: z.number().int(),
  name: z.string().max(150),
  description: z.string().nullable().optional(),
  status: z.enum(["ativo", "inativo"]),
  macroprocesso_id: z.number().int(),
  processo_id: z.number().int(),
  sub_processo_id: z.number().int().nullable().optional(),
});

export type ActivityType = z.infer<typeof activitiesSchema>;
export const activitiesArraySchema = z.array(activitiesSchema);
export type ActivitiesType = z.infer<typeof activitiesArraySchema>
