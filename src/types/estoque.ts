import { z } from "zod";

export const inventoryItemSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  quantidade: z.number().int().nonnegative({ message: "Quantidade deve ser positiva ou zero" }),
  valor_pago: z.number().nonnegative({ message: "Valor pago deve ser positivo" }),
  valor_atual: z.number().nonnegative({ message: "Valor atual deve ser positivo" }),
  data_aquisicao: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    { message: "Data de aquisição inválida" }
  ),
  descricao: z.string().optional(),
});

export const inventoryItemViewSchema = inventoryItemSchema.extend(
{
depreciacao: z.number(),
total_de_itens: z.number(),
total_valor_atual: z.number(),
total_valor_investido: z.number(),
total_depreciacao: z.number(),
}
)

export const inventoryItemViewSchemaList = z.array(inventoryItemViewSchema)

export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type InventoryItemView = z.infer<typeof inventoryItemViewSchema>
export type InventoryItemViewList = z.infer<typeof inventoryItemViewSchemaList>