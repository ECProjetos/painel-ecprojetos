import { z } from 'zod';

export const roleEnum = z.enum(['COLABORADOR', 'GESTOR', 'DIRETOR']);
export type RoleEnum = z.infer<typeof roleEnum>;