import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

interface TextSubmitProps {
    onSubmit: (comment: string) => void;
}

export function TextSubmit({ onSubmit }: TextSubmitProps) {
    const [comment, setComment] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (comment) {
            try {
                onSubmit(comment);
                toast.success("Comentário enviado com sucesso!");
            } catch (error) {
                console.error("Failed to submit comment: ", error);
                toast.error("Falha ao enviar o comentário.");
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
