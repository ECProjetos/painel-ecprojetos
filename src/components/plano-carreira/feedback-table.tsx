import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import Link from "next/link";
import { Link as LinkIcon } from "lucide-react";
import { useUserStore } from "@/stores/userStore";
import { getSoftSkillsAssessmentsById } from "@/app/actions/plano-carreira";
import { useEffect, useState } from "react";
import { softSkillsAssessmentSchema, SoftSkillsAssessmentType } from "@/types/plano-carreira/soft-skills";
import { getColaboradorById } from "@/app/actions/colaboradores";
import { Colaborador } from "@/types/colaboradores";



export function FeedbackTable() {
    const iduser = useUserStore((state) => state?.user?.id);
    const [feedbacks, setFeedbacks] = useState<SoftSkillsAssessmentType[]>([]);
    const [avaliadores, setAvaliadores] = useState<Record<string, string>>({});

    useEffect(() => {
        async function fetchData() {
            if (!iduser) return;

            // Busca os feedbacks
            const data = await getSoftSkillsAssessmentsById(iduser);
            const parsedData = data.map((item) => {
                const parsed = softSkillsAssessmentSchema.safeParse(item);
                if (parsed.success) {
                    return parsed.data;
                } else {
                    console.error("Erro ao validar feedback:", parsed.error);
                    return null;
                }
            }).filter((item): item is SoftSkillsAssessmentType => item !== null);

            setFeedbacks(parsedData);
        }

        fetchData();
    }, [iduser]);

    useEffect(() => {
        async function fetchAvaliadores() {
            if (feedbacks.length === 0) return;
            console.log("Buscando avaliadores para os feedbacks:", feedbacks);
            const uniqueEvaluatorIds = [...new Set(feedbacks.map(fb => fb.evaluator_id))];
            const avaliadoresMap: Record<string, string> = {};

            await Promise.all(uniqueEvaluatorIds.map(async (evaluatorId) => {
                if (evaluatorId) {
                    try {
                        const colaborador = await getColaboradorById(evaluatorId) as Colaborador;
                        avaliadoresMap[evaluatorId] = colaborador.name;
                        console.log(avaliadoresMap);
                        console.log(`Avaliador ${evaluatorId} encontrado:`, colaborador.name);
                    } catch (error) {
                        console.error(`Erro ao buscar avaliador ${evaluatorId}`, error);
                        avaliadoresMap[evaluatorId] = 'Desconhecido';
                    }
                }
            }));

            setAvaliadores(avaliadoresMap);
        }

        fetchAvaliadores();
    }, [feedbacks]);

    return (
        <div>
            <h1 className="text-4xl font-semibold mb-6 justify-center text-center">
                <span className="text-black-600">Histórico de </span>
                <span className="text-blue-600">Feed</span>
                <span className="text-gray-600">backs</span>
            </h1>
            <div className="flex items-center rounded-full justify-between mb-4 mt-4">
                <Table className="w-full border rounded-lg shadow-sm bg-white">
                    <TableHeader>
                        <TableRow className="bg-gray-100">
                            <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Data</TableHead>
                            <TableHead className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Avaliador</TableHead>
                            <TableHead className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Ver detalhes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {feedbacks.map((feedback) => {
                            const formattedDate = feedback.created_at
                                ? new Date(feedback.created_at).toLocaleDateString("pt-BR")
                                : "Data inválida";
                            const nomeAvaliador = avaliadores[feedback.evaluator_id] || "Carregando...";
                            return (
                                <TableRow key={`${feedback.evaluator_id}-${feedback.created_at}`} className="hover:bg-gray-50 transition-colors">
                                    <TableCell className="font-medium px-6 py-4">{formattedDate}</TableCell>
                                    <TableCell className="font-medium px-6 py-4 text-center">{nomeAvaliador}</TableCell>
                                    <TableCell className="font-medium px-6 py-4 text-center">
                                        <Link
                                            href={`/feedback/${iduser}`}
                                            className="inline-flex items-center justify-center p-2 rounded hover:bg-gray-200 transition-colors"
                                            title="Ver detalhes"
                                        >
                                            <LinkIcon className="w-5 h-5 text-blue-600" />
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
