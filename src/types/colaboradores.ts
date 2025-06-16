import { z } from 'zod';
import { roleEnum } from './role-enum';

export const NewColaboradorSchema = z.object({
    nome: z.string().min(1, { message: 'Nome é obrigatório' }),
    email: z.string().email({ message: 'Email inválido' }),
    cargoId: z.number().int().positive({ message: 'Cargo é obrigatório' }),
    role: roleEnum,
    working_hours_per_day: z.number().int().min(1, { message: 'Horas de trabalho por dia devem ser um número positivo' }),
    status: z.enum(['ativo', 'inativo']),
    departamentoId: z.number().int().positive({ message: 'Departamento é obrigatório' }),
    password: z.string().min(8, { message: 'Senha deve ter pelo menos 8 caracteres' }),
    confirmPassword: z.string().min(8, { message: 'Confirmação de senha deve ter pelo menos 8 caracteres' }),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',

});

export type NewColaborador = z.infer<typeof NewColaboradorSchema>;