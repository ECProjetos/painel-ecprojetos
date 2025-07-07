// types/plano-carreira/soft-skills.ts
import { z } from "zod";

export const softSkillsAssessmentSchema = z.object({
    colaborador_id: z.string().uuid(),
    evaluator_id: z.string().uuid(),
    comunicacao: z.string(),
    comunicacao_meta: z.string().optional(),
    trabalho_em_equipe: z.string(),
    trabalho_em_equipe_meta: z.string().optional(),
    proatividade: z.string(),
    proatividade_meta: z.string().optional(),
    resolucao_de_problemas: z.string(),
    resolucao_de_problemas_meta: z.string().optional(),
    organizacao_de_tempo: z.string(),
    organizacao_de_tempo_meta: z.string().optional(),
    pensamento_critico: z.string(),
    pensamento_critico_meta: z.string().optional(),
    capricho: z.string(),
    capricho_meta: z.string().optional(),
    encarar_desafios: z.string(),
    encarar_desafios_meta: z.string().optional(),
    postura_profissional: z.string(),
    postura_profissional_meta: z.string().optional(),
    gentileza_e_educacao: z.string(),
    gentileza_e_educacao_meta: z.string().optional(),
    engajamento_missao_visao: z.string(),
    engajamento_missao_visao_meta: z.string().optional(),
    created_at: z.string().optional(),
});

export type SoftSkillsAssessmentType = z.infer<typeof softSkillsAssessmentSchema>;
