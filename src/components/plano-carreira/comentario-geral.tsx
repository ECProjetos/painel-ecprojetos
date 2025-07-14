'use client';

import { useEffect, useState } from "react";
import { getCommentById } from "@/app/actions/plano-carreira"; // Veja, função plural
import { useParams } from "next/navigation";
import { CommentType, commentSchema } from "@/types/plano-carreira/comment";

export function ComentarioGeral() {
    const params = useParams<{ id: string }>();
    const [selected, setComment] = useState<CommentType | undefined>(undefined);


    useEffect(() => {
        async function fetchComment() {
            if (params.id) {
                const result = await getCommentById(params.id);
                // Corrigido: pega o primeiro elemento do array
                const item = Array.isArray(result) ? result[0] : result;
                const parsed = commentSchema.safeParse(item);
                if (parsed.success) {
                    setComment(parsed.data);
                } else {
                    setComment(undefined);
                    console.error(parsed.error);
                }
            }
        }
        fetchComment();
    }, [params.id]);
    return (
        <div className="py-5 px-5 mb-3">
            <h2 className="text-2xl font-semibold mb-4">Comentário Geral</h2>
            <p className="text-gray-700 dark:text-gray-300">
                {selected?.comment || <span className="text-gray-400">Nenhum comentário.</span>}
            </p>
        </div>
    );
}
