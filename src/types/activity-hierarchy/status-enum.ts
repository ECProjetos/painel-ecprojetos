import { z } from 'zod';

export const activetSatatusEnum = z.enum([
    'ativo',
    'inativo',
]);