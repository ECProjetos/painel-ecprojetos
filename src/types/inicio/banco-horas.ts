import { z } from "zod";

export const FuncionarioSchema = z.object({
  user_id: z.string(),
  user_name: z.string(),
  working_hours_per_day: z.number(),
  business_days_passed: z.number(),
  expected_hours: z.number(),
  actual_hours: z.number(),
  banco_horas_atual: z.number(),
});

export const BancoHorasResponseSchema = z.object({
  error: z.string().nullable(),
  data: z.array(FuncionarioSchema),
  count: z.number().nullable(),
  status: z.number(),
  statusText: z.string(),
});

export type BancoHorasType = z.infer<typeof BancoHorasResponseSchema>