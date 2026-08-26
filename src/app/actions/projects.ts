/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from "next/cache";

import {
  newProjectSchema,
  type NewProject,
  type ProjectProductInput,
} from "@/types/projects";
import { createClient } from "@/utils/supabase/server";

type ExistingProductRow = {
  id: number;
  project_id: number;
  name: string;
  estimated_hours: number;
  status: "ativo" | "inativo" | "concluido";
  sort_order: number | null;
};

function validateProject(project: NewProject) {
  const result = newProjectSchema.safeParse(project);

  if (!result.success) {
    throw new Error(
      result.error.issues[0]?.message ?? "Os dados do projeto são inválidos.",
    );
  }

  return result.data;
}

function normalizeProducts(products: ProjectProductInput[]) {
  return products.map((product, index) => ({
    id: product.id,
    name: product.name.trim(),
    estimated_hours: Number(product.estimated_hours),
    status: product.status,
    sort_order: index,
  }));
}

function revalidateProjectPages(id?: number) {
  revalidatePath("/projetos");
  revalidatePath("/projetos/novo");
  revalidatePath("/portfolio")

  if (id) {
    revalidatePath(`/projetos/${id}`);
  }

  revalidatePath("/controle-horarios/inicio");
}

// CRIAR projeto com departamentos e produtos.
export async function createProject(project: NewProject) {
  const supabase = await createClient();
  let createdProjectId: number | null = null;

  try {
    const validProject = validateProject(project);
    const { department_ids, products, ...projectData } = validProject;
    const normalizedProducts = normalizeProducts(products);

    if (normalizedProducts.some((product) => product.id !== undefined)) {
      throw new Error("Um produto novo não pode possuir ID já cadastrado.");
    }

    const { data, error: projectError } = await supabase
      .from("projects")
      .insert([projectData])
      .select("id")
      .single();

    if (projectError?.code === "23505") {
      throw new Error("Já existe um projeto com o mesmo código.");
    }

    if (projectError) {
      throw new Error("Erro ao inserir projeto: " + projectError.message);
    }

    createdProjectId = Number(data.id);

    const { error: departmentError } = await supabase
      .from("project_departments")
      .insert(
        department_ids.map((department_id) => ({
          project_id: createdProjectId,
          department_id,
        })),
      );

    if (departmentError) {
      throw new Error(
        "Erro ao relacionar departamentos: " + departmentError.message,
      );
    }

    const { error: productsError } = await supabase
      .from("project_products")
      .insert(
        normalizedProducts.map((product) => ({
          project_id: createdProjectId,
          name: product.name,
          estimated_hours: product.estimated_hours,
          status: product.status,
          sort_order: product.sort_order,
        })),
      );

    if (productsError?.code === "23505") {
      throw new Error("Existem produtos repetidos neste projeto.");
    }

    if (productsError) {
      throw new Error("Erro ao inserir produtos: " + productsError.message);
    }

    revalidateProjectPages(createdProjectId);

    return { id: createdProjectId };
  } catch (error: any) {
    // Compensação para não deixar um projeto incompleto se alguma etapa falhar.
    if (createdProjectId) {
      await supabase
        .from("project_products")
        .delete()
        .eq("project_id", createdProjectId);

      await supabase
        .from("project_departments")
        .delete()
        .eq("project_id", createdProjectId);

      await supabase.from("projects").delete().eq("id", createdProjectId);
    }

    console.error("Erro ao criar projeto:", error);
    throw new Error(error.message || "Erro desconhecido ao criar projeto.");
  }
}

// OBTER todos os projetos.
export async function getAllProjects() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("project_time_summary")
      .select("*")
      .order("name", { ascending: false });

    if (error) {
      throw new Error("Erro ao buscar projetos: " + error.message);
    }

    return data;
  } catch (error) {
    console.error(error);
  }
}

// OBTER projeto por ID, incluindo departamentos e produtos.
export async function getProjectById(id: number) {
  try {
    const supabase = await createClient();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (projectError) {
      throw new Error("Erro ao buscar projeto: " + projectError.message);
    }

    const { data: departments, error: departmentError } = await supabase
      .from("project_departments")
      .select("department_id")
      .eq("project_id", id);

    if (departmentError) {
      throw new Error(
        "Erro ao buscar departamentos do projeto: " + departmentError.message,
      );
    }

    // Carregamos ativos, concluídos e inativos para permitir reativação e
    // evitar a criação de outro produto com o mesmo nome.
    const { data: products, error: productsError } = await supabase
      .from("project_products")
      .select("id, project_id, name, estimated_hours, status, sort_order")
      .eq("project_id", id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (productsError) {
      throw new Error(
        "Erro ao buscar produtos do projeto: " + productsError.message,
      );
    }

    return {
      ...project,
      department_ids: (departments ?? []).map((department) =>
        Number(department.department_id),
      ),
      products: (products ?? []).map((product) => ({
        id: Number(product.id),
        name: String(product.name),
        estimated_hours: Number(product.estimated_hours),
        status: product.status as "ativo" | "inativo" | "concluido",
      })),
    } as NewProject;
  } catch (error: any) {
    throw new Error(error.message || "Erro desconhecido ao obter projeto.");
  }
}

// ATUALIZAR projeto, departamentos e produtos.
export async function updateProject(id: number, project: NewProject) {
  try {
    const supabase = await createClient();
    const validProject = validateProject(project);
    const { department_ids, products, ...projectData } = validProject;
    const normalizedProducts = normalizeProducts(products);

    const { data: existingProducts, error: existingProductsError } =
      await supabase
        .from("project_products")
        .select("id, project_id, name, estimated_hours, status, sort_order")
        .eq("project_id", id);

    if (existingProductsError) {
      throw new Error(
        "Erro ao validar os produtos existentes: " +
          existingProductsError.message,
      );
    }

    const currentProducts = (existingProducts ?? []) as ExistingProductRow[];
    const currentIds = new Set(currentProducts.map((product) => Number(product.id)));
    const receivedIds = normalizedProducts
      .filter((product) => product.id !== undefined)
      .map((product) => Number(product.id));

    if (new Set(receivedIds).size !== receivedIds.length) {
      throw new Error("O mesmo produto foi enviado mais de uma vez.");
    }

    const invalidProductId = receivedIds.find(
      (productId) => !currentIds.has(productId),
    );

    if (invalidProductId) {
      throw new Error(
        "Foi informado um produto que não pertence a este projeto.",
      );
    }

    const { error: updateError } = await supabase
      .from("projects")
      .update(projectData)
      .eq("id", id);

    if (updateError?.code === "23505") {
      throw new Error("Já existe outro projeto com o mesmo código.");
    }

    if (updateError) {
      throw new Error("Erro ao atualizar projeto: " + updateError.message);
    }

    const { error: deleteDepartmentsError } = await supabase
      .from("project_departments")
      .delete()
      .eq("project_id", id);

    if (deleteDepartmentsError) {
      throw new Error(
        "Erro ao remover departamentos antigos: " +
          deleteDepartmentsError.message,
      );
    }

    const { error: insertDepartmentsError } = await supabase
      .from("project_departments")
      .insert(
        department_ids.map((department_id) => ({
          project_id: id,
          department_id,
        })),
      );

    if (insertDepartmentsError) {
      throw new Error(
        "Erro ao atualizar departamentos: " +
          insertDepartmentsError.message,
      );
    }

    const existingPayload = normalizedProducts
      .filter((product) => product.id !== undefined)
      .map((product) => ({
        id: Number(product.id),
        project_id: id,
        name: product.name,
        estimated_hours: product.estimated_hours,
        status: product.status,
        sort_order: product.sort_order,
      }));

    if (existingPayload.length > 0) {
      const { error: updateProductsError } = await supabase
        .from("project_products")
        .upsert(existingPayload, { onConflict: "id" });

      if (updateProductsError?.code === "23505") {
        throw new Error("Existem produtos repetidos neste projeto.");
      }

      if (updateProductsError) {
        throw new Error(
          "Erro ao atualizar produtos: " + updateProductsError.message,
        );
      }
    }

    const newProductsPayload = normalizedProducts
      .filter((product) => product.id === undefined)
      .map((product) => ({
        project_id: id,
        name: product.name,
        estimated_hours: product.estimated_hours,
        status: product.status,
        sort_order: product.sort_order,
      }));

    if (newProductsPayload.length > 0) {
      const { error: insertProductsError } = await supabase
        .from("project_products")
        .insert(newProductsPayload);

      if (insertProductsError?.code === "23505") {
        throw new Error("Já existe um produto com este nome no projeto.");
      }

      if (insertProductsError) {
        throw new Error(
          "Erro ao inserir novos produtos: " + insertProductsError.message,
        );
      }
    }

    // Produto removido da tela não é apagado: ele fica inativo para preservar
    // os registros de ponto e os relatórios históricos.
    const receivedIdSet = new Set(receivedIds);
    const idsToInactivate = currentProducts
      .filter((product) => !receivedIdSet.has(Number(product.id)))
      .map((product) => Number(product.id));

    if (idsToInactivate.length > 0) {
      const { error: inactivateError } = await supabase
        .from("project_products")
        .update({ status: "inativo" })
        .in("id", idsToInactivate)
        .eq("project_id", id);

      if (inactivateError) {
        throw new Error(
          "Erro ao inativar produtos removidos: " + inactivateError.message,
        );
      }
    }

    revalidateProjectPages(id);
  } catch (error: any) {
    console.error("Erro ao atualizar projeto:", error);
    throw new Error(error.message || "Erro desconhecido ao atualizar projeto.");
  }
}

// DELETAR projeto somente quando não houver registros de ponto.
export async function deletProject(id: number) {
  try {
    const supabase = await createClient();

    const { count, error: countError } = await supabase
      .from("ponto")
      .select("id", { count: "exact", head: true })
      .eq("projeto", id);

    if (countError) {
      throw new Error(
        "Erro ao verificar lançamentos do projeto: " + countError.message,
      );
    }

    if ((count ?? 0) > 0) {
      throw new Error(
        "Este projeto possui registros de ponto. Altere o status para concluído ou inativo em vez de excluí-lo.",
      );
    }

    const { error: productsError } = await supabase
      .from("project_products")
      .delete()
      .eq("project_id", id);

    if (productsError) {
      throw new Error("Erro ao excluir produtos: " + productsError.message);
    }

    const { error: departmentsError } = await supabase
      .from("project_departments")
      .delete()
      .eq("project_id", id);

    if (departmentsError) {
      throw new Error(
        "Erro ao excluir departamentos: " + departmentsError.message,
      );
    }

    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      throw new Error("Erro ao excluir projeto: " + error.message);
    }

    revalidateProjectPages(id);
  } catch (error: any) {
    console.error("Erro ao excluir projeto:", error);
    throw new Error(error.message || "Erro desconhecido ao excluir projeto.");
  }
}