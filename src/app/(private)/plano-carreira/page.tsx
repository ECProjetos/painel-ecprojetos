import { SoftSkillsTable } from "@/components/soft-skills";

const habilidades = [
    "Comunicação",
    "Trabalho em equipe",
    "Proatividade",
    "Resolução de problemas",
    "Organização de tempo",
    "Pensamento crítico",
    "Capricho",
    "Não ter medo de encarar desafios",
    "Postura profissional",
    "Gentileza e educação",
    "Engajamento com a missão e visão da empresa",
];

const opcoes = [
    "1 - Muito abaixo do esperado",
    "2 - Abaixo do esperado",
    "3 - Dentro do esperado",
    "4 - Acima do esperado",
    "5 - Excelente",
];

export default function Page() {
    return (
        <div className="min-h-screen w-full flex flex-col bg-muted">
            <div className="w-full px-4 py-8 flex-1 flex flex-col">
                <h1 className="text-3xl font-bold mb-6 text-center">
                    Avaliação Comportamental
                </h1>
                <SoftSkillsTable habilidades={habilidades} opcoes={opcoes} />
            </div>
        </div>
    );
}
