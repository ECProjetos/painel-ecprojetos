'use client';

import SelectColaborador from "@/components/select-colaborador";
import { useUserStore } from "@/stores/userStore";
import { roles } from "@/constants/roles"; // Certifique-se de importar os roles corretamente
import { SoftSkillsDashboard } from "@/components/soft-skills-vw";

export default function AvaliacaoSelectPage() {
    const role = useUserStore((s) => s.user?.role);
    const isDiretor = role === roles.diretor;

    return (
        <div>
            {isDiretor ? (
                <SelectColaborador />
            ) : (
                <SoftSkillsDashboard />
            )}
        </div>
    );
}
