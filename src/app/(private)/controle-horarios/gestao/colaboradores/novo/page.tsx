import { getAllCargos } from "@/app/actions/get-cargos"
import { getAllDepartments } from "@/app/actions/get-departamentos"
import NewColaboradorForm from "@/components/colaboradores/new-user-form"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function Page() {
  const cargos = await getAllCargos()
  const departamentos = await getAllDepartments()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (values: any) => {
    "use server"
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          ...values,
        },
      },
    })

    if (error) {
      console.error(error)
      return
    }

    redirect("/controle-horarios/gestao/colaboradores")
  }

  return (
    <NewColaboradorForm
      cargos={cargos ?? []}
      departamentos={departamentos ?? []}
      onSubmit={handleSubmit}
    />
  )
}
