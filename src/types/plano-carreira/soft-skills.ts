// types/type.ts
import { z } from "zod";

export const softSkillsAssessmentSchema = z.object({
    colaborador_id: z.string().uuid(),
    evaluator_id: z.string().uuid(),
    comunicacao: z.string(),
    trabalho_em_equipe: z.string(),
    proatividade: z.string(),
    resolucao_de_problemas: z.string(),
    organizacao_de_tempo: z.string(),
    pensamento_critico: z.string(),
    capricho: z.string(),
    nao_medo_desafios: z.string(),
    postura_profissional: z.string(),
    gentileza_educacao: z.string(),
    engajamento_missao_visao: z.string()
});

export type SoftSkillsAssessmentType = z.infer<typeof softSkillsAssessmentSchema>;
