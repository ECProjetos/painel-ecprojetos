import { z } from "zod";

export const statusEnum = z.enum(["ativo", "concluido", "pausado", "inativo"]);

export const projectProductStatusEnum = z.enum([
  "ativo",
  "inativo",
  "concluido",
]);

export const projectProductSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z
    .string()
    .trim()
    .min(1, { message: "Nome do produto é obrigatório" })
    .max(200, { message: "O nome do produto deve ter no máximo 200 caracteres" }),
  estimated_hours: z
    .number()
    .int({ message: "As horas do produto devem ser um número inteiro" })
    .positive({ message: "As horas do produto devem ser maiores que zero" }),
  status: projectProductStatusEnum,
});

export const projectSchema = z.object({
  id: z.number(),
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  code: z.string().min(1, { message: "Código é obrigatório" }),
  description: z.string().optional(),
  department_id: z
    .number()
    .int()
    .positive({ message: "Departamento é obrigatório" }),
  status: statusEnum,
  activities: z.array(z.string()),
  encharged: z.string(),
  estimated_hours: z
    .number()
    .int({ message: "Horas estimadas devem ser um número inteiro" })
    .positive({ message: "Horas estimadas devem ser um número positivo" }),
});

// Schema usado tanto na criação quanto na edição do projeto.
export const newProjectSchema = projectSchema
  .omit({
    id: true,
    department_id: true,
  })
  .extend({
    department_ids: z
      .array(z.number().int().positive())
      .min(1, { message: "Selecione pelo menos um departamento" }),
    products: z
      .array(projectProductSchema)
      .min(1, { message: "Cadastre pelo menos um produto para o projeto" }),
  })
  .superRefine((data, ctx) => {
    const produtosConsiderados = data.products.filter(
      (produto) => produto.status !== "inativo",
    );

    if (produtosConsiderados.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["products"],
        message: "O projeto deve possuir pelo menos um produto ativo ou concluído",
      });
    }

    const nomes = new Map<string, number>();

    data.products.forEach((produto, index) => {
      const nomeNormalizado = produto.name.trim().toLocaleLowerCase("pt-BR");
      const indiceAnterior = nomes.get(nomeNormalizado);

      if (indiceAnterior !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["products", index, "name"],
          message: "Já existe outro produto com este nome no projeto",
        });
      } else {
        nomes.set(nomeNormalizado, index);
      }
    });

    const totalHorasProdutos = produtosConsiderados.reduce(
      (total, produto) => total + produto.estimated_hours,
      0,
    );

    if (totalHorasProdutos > data.estimated_hours) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["products"],
        message: `A soma das horas dos produtos (${totalHorasProdutos} h) não pode ultrapassar as horas estimadas do projeto (${data.estimated_hours} h)`,
      });
    }
  });

export type Project = z.infer<typeof projectSchema>;
export type ProjectProductInput = z.infer<typeof projectProductSchema>;
export type NewProject = z.infer<typeof newProjectSchema>;