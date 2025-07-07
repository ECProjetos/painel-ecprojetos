import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import Link from "next/link";
import { Link as LinkIcon } from "lucide-react";
import { useUserStore } from "@/stores/userStore";
import { getSoftSkillsAssessmentsById } from "@/app/actions/plano-carreira";
import { useEffect, useState } from "react";
import { softSkillsAssessmentSchema, SoftSkillsAssessmentType } from "@/types/plano-carreira/soft-skills";
import { getColaboradorById } from "@/app/actions/colaboradores";



export function FeedbackTable() {
    const iduser = useUserStore((state) => state?.user?.id);
    console.log("ID do usuário:", iduser);
    const [feedbacks, setFeedbacks] = useState<SoftSkillsAssessmentType[]>([]);
    console.log("Feedbacks:", feedbacks);
    const [avaliadores, setAvaliadores] = useState<Record<string, string>>({});


    useEffect(() => {
        async function fetchFeedbacks() {
            if (iduser) {
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

                if (parsedData.length > 0) {
                    const evaluatorIds = parsedData.map(fb => fb.evaluator_id);
                    const uniqueEvaluatorIds = [...new Set(evaluatorIds)];
                    
                    const avaliadoresData: Record<string, string> = {};
                    for (const id of uniqueEvaluatorIds) {
                        const colaborador = await getColaboradorById(id);
                        if (colaborador) {
                            avaliadoresData[id] = colaborador.nome;
                        }
                    }
                    setAvaliadores(avaliadoresData);
                }
            }
        }
        fetchFeedbacks();
    }, [iduser]);


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
                            const { } = feedback;
                            return (
                                <TableRow key={feedback.evaluator_id} className="hover:bg-gray-50 transition-colors">
                                    <TableCell className="font-medium px-6 py-4">{feedback.created_at}</TableCell>
                                    <TableCell className="font-medium px-6 py-4 text-center">{avaliadores[feedback.evaluator_id] || 'Carregando...'}</TableCell>
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
                        {/* Example static row, remove if not needed */}
                        {/*
                        <TableRow className="hover:bg-gray-50 transition-colors">
                            <TableCell className="font-medium px-6 py-4">20/06/2025</TableCell>
                            <TableCell className="font-medium px-6 py-4 text-center">Tiago Buss</TableCell>
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
                        */}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}