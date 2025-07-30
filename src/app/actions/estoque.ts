/* eslint-disable @typescript-eslint/no-explicit-any */
import { InventoryItemView, inventoryItemViewSchema } from "@/types/estoque";
import { createClient } from "@/utils/supabase/client";

export async function createEstoque(prevState: any, formData: FormData) {
  try {
    const supabase = await createClient();

    const nome = formData.get("nome") as string;
    const categoria = formData.get("categoria") as string;
    const valorPago = parseFloat(formData.get("valorPago") as string);
    const valorAtual = parseFloat(formData.get("valorAtual") as string);
    const quantidade = parseInt(formData.get("quantidade") as string, 10);
    const dataAquisicao = formData.get("dataAquisicao") as string;
    const descricao = formData.get("descricao") as string;

    if (
      !nome || !categoria || isNaN(valorPago) || isNaN(valorAtual) ||
      isNaN(quantidade) || !dataAquisicao
    ) {
      throw new Error("Preencha todos os campos obrigatórios corretamente.");
    }

    const { error } = await supabase
      .from("inventory_items")
      .insert({
        nome,
        categoria,
        valor_pago: valorPago,
        valor_atual: valorAtual,
        quantidade,
        data_aquisicao: dataAquisicao,
        descricao,
      });

    if (error) {
      console.error("Erro ao inserir item:", error);
      throw new Error("Erro ao cadastrar o item: " + error.message);
    }

    return { success: true, message: "Item cadastrado com sucesso." };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Erro desconhecido ao cadastrar item.",
    };
  }
}

export async function getEstoqueData(): Promise<InventoryItemView[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("vw_inventory_items")
    .select("*");

  if (error) {
    console.error("Erro ao buscar dados do estoque:", error.message);
    throw new Error("Erro ao buscar dados do estoque.");
  }

  const parsedResult = inventoryItemViewSchema.array().safeParse(data);

  if (!parsedResult.success) {
    console.error("Erro de validação Zod:", parsedResult.error.format());
    throw new Error("Erro ao validar os dados do estoque.");
  }

  return parsedResult.data;
}