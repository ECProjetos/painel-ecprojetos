
import { getAllCargos } from "@/app/actions/get-cargos"
import { getAllDepartments } from "@/app/actions/get-departamentos"
import NewColaboradorForm from "@/components/colaboradores/new-user-form"
import { createClient } from "@/utils/supabase/server"

import { NewColaborador } from "@/types/colaboradores"

export default async function Page() {
  const cargos = await getAllCargos()
  const departamentos = await getAllDepartments()

 const handleSubmit = async (values: NewColaborador) => {
  "use server"
  const supabase = await createClient();

  try {
    const { email, password, ...rest } = values;

    // Cria usuário no Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: rest }, // Salva os outros dados em user_metadata
    });

    if (signUpError || !signUpData.user) {
      console.error("SignUp Error:", signUpError);
      return;
    }

    const userId = signUpData.user.id;

    // Se quiser inserir dados extras como departamento
    if (rest.departamentoId) {
      const { error: insertDeptError } = await supabase
        .from("user_departments")
        .insert({ user_id: userId, department_id: rest.departamentoId });

      if (insertDeptError) {
        console.error("Erro ao inserir departamento:", insertDeptError);
        return;
      }
    }

    // Mensagem de sucesso
  } catch (err) {
    console.error("Unexpected Error:", err);
  }
};

  return (
    <NewColaboradorForm
      cargos={cargos ?? []}
      departamentos={departamentos ?? []}
      onSubmit={handleSubmit}
    />
  )
}
