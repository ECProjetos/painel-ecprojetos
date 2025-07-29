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
    const supabase = await createClient()

    try {
      const { email, password, ...rest } = values
      console.log("Valores recebidos:", values)

      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...rest,
          },
        },
      })

      if (error) {
        console.error("SignUp Error:", error)
        return
      }

      console.log("SignUp Success:", data)
    } catch (err) {
      console.error("Unexpected Error:", err)
    }
  }

  return (
    <NewColaboradorForm
      cargos={cargos ?? []}
      departamentos={departamentos ?? []}
      onSubmit={handleSubmit}
      
    />
  )
}
