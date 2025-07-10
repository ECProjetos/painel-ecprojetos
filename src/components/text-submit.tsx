import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';
import { submitComment } from '@/app/actions/plano-carreira';
import { useState } from 'react';
import { CommentType } from '@/types/plano-carreira/comment';
import { toast } from 'sonner';

export function TextSubmit() {
    const params = useParams<{ id: string }>();
    const colaboradorId = params.id as string | undefined;
    const [comment, setComment] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (colaboradorId && comment) {
            const commentData: CommentType = {
                colaborador_id: colaboradorId,
                comment: comment,
            };
            try {
                await submitComment(commentData);
                toast.success("Comentário enviado com sucesso!");
            } catch (error) {
                console.error("Failed to submit comment: ", error);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Digite seu comentário aqui..."
            />
            <Button type="submit" className="mt-8 w-full text-white py-3" disabled={!comment}>
                Enviar Avaliação
            </Button>
        </form>
    )
};