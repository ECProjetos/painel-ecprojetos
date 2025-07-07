"use server";

import { supabaseAdmin } from "@/utils/supabase/admin";
import { softSkillsAssessmentSchema, SoftSkillsAssessmentType } from "@/types/plano-carreira/soft-skills";
import { HardSkillsEconoType, HardSkillsEconoSchema, HardSkillsMeioAmbienteType, HardSkillsMeioAmbienteSchema } from "@/types/plano-carreira/hard-skills";

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

export async function getAllSoftSkillsAssessments() {
    const { data, error } = await supabaseAdmin
        .from('soft_skills_assessment')
        .select('*');
    if (error) {
        throw new Error(error.message || "Erro ao buscar avaliações de soft skills");
    }
    return data;
}

export async function getSoftSkillsAssessmentsById(colaboradorId: string) {
    const { data, error } = await supabaseAdmin
        .from('soft_skills_assessment')
        .select('*')
        .eq('colaborador_id', colaboradorId); // Substitua 'colaboradorId' pelo ID real do colaborador
    if (error) {
        throw new Error(error.message || "Erro ao buscar avaliações de soft skills");
    }
    return data;
}




export async function submitHardSkillsEcono(data: HardSkillsEconoType) {
    const parse = HardSkillsEconoSchema.safeParse(data);
    if (!parse.success) {
        throw new Error(
            "Dados inválidos para avaliação de soft skills: " +
            JSON.stringify(parse.error.format())
        );
    }
    const validData = parse.data;

    const { data: inserted, error } = await supabaseAdmin
        .from('hardskills_econo')
        .insert([validData])
        .select();

    if (error) {
        throw new Error(error.message || "Erro ao enviar avaliação");
    }
    return inserted;
}

export async function submitHardSkillsMg(data: HardSkillsMeioAmbienteType) {
    const parse = HardSkillsMeioAmbienteSchema.safeParse(data);
    if (!parse.success) {
        throw new Error(
            "Dados inválidos para avaliação de soft skills: " +
            JSON.stringify(parse.error.format())
        );
    }
    const validData = parse.data;

    const { data: inserted, error } = await supabaseAdmin
        .from('hardskills_mg')
        .insert([validData])
        .select();

    if (error) {
        throw new Error(error.message || "Erro ao enviar avaliação");
    }
    return inserted;
}