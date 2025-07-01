"use server";

import { supabaseAdmin } from "@/utils/supabase/admin";
import { softSkillsAssessmentSchema, SoftSkillsAssessmentType } from "@/types/plano-carreira/soft-skills";

export async function submitSoftSkillsAssessment(data: SoftSkillsAssessmentType) {
    const parse = softSkillsAssessmentSchema.safeParse(data);
    if (!parse.success) {
        throw new Error(
            "Dados inválidos para avaliação de soft skills: " +
            JSON.stringify(parse.error.format())
        );
    }
    const validData = parse.data;

    const { data: inserted, error } = await supabaseAdmin
        .from('soft_skills_assessment')
        .insert([validData])
        .select();

    if (error) {
        throw new Error(error.message || "Erro ao enviar avaliação");
    }
    return inserted;
}
