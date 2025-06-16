// type.ts
import { z } from "zod";

export const habilidades = [
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

export const opcoes = ["1", "2", "3", "4", "5"] as const;

export const respostaSchema = z.enum(opcoes);

export const respostasSchema = z.object(
  Object.fromEntries(
    habilidades.map((_, idx) => [idx, respostaSchema])
  )
);

export type RespostasType = z.infer<typeof respostasSchema>;
