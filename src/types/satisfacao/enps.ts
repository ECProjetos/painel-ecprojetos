import { z } from 'zod';

export const EnpsSchema = z.object({
    data: z.string().min(1, "Data é obrigatória"),
    periodo: z.string().min(1, "Período é obrigatório"),
    department: z.string().min(1, "Departamento é obrigatório").optional(),
    enps_score: z.number({ invalid_type_error: "ENPS Score deve ser um número" }).optional(),
    enps_reason: z.string().optional().optional(),
    centrado_cliente: z.number({ invalid_type_error: "Centrado no Cliente deve ser um número" }).optional(),
    qualidade_assegurada: z.number({ invalid_type_error: "Qualidade Assegurada deve ser um número" }).optional(),
    avanco_tecnologico: z.number({ invalid_type_error: "Avanço Tecnológico deve ser um número" }).optional(),
    eficiencia_dinamica: z.number({ invalid_type_error: "Eficiência Dinâmica deve ser um número" }).optional(),
    colaboracao_integral: z.number({ invalid_type_error: "Colaboração Integral deve ser um número" }).optional(),
    gestao_direta: z.number({ invalid_type_error: "Gestão Direta deve ser um número" }).optional(),
    visao_futuro: z.number({ invalid_type_error: "Visão de Futuro deve ser um número" }).optional(),
});

export type EnpsFormData = z.infer<typeof EnpsSchema>;


export const EnpsCreateSchema = z.object({
    ano: z.string(),
    periodo: z.string(),
});
export type EnpsCreateFormData = z.infer<typeof EnpsCreateSchema>;
