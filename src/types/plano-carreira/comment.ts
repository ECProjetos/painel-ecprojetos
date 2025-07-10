import { z } from 'zod';

export const commentSchema = z.object({
    colaborador_id: z.string().uuid({ message: 'Colaborador ID deve ser um UUID válido' }),
    comment: z.string().min(1, { message: 'Comentário é obrigatório' }),
    created_at: z.string().optional(),
});

export type CommentType = z.infer<typeof commentSchema>;