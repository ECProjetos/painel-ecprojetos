"use client"

import { useEffect, useState, useTransition } from "react"
import {
  createAvaliacaoEvolucao,
  getColaboradoresEvolucao,
} from "@/app/actions/indicadores-evolucao"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"

type Colaborador = {
  id: string
  nome: string
  departamento_nome?: string | null
}

type FormValues = {
  colaborador_id: string
  ano: string
  trimestre: string
  nota: string
}

const opcoesNotas = [
  { value: "1", descricao: "Não atendeu" },
  { value: "2", descricao: "Atendeu parcialmente" },
  { value: "3", descricao: "Atendeu" },
  { value: "4", descricao: "Atendeu plenamente" },
  { value: "5", descricao: "Excedeu expectativas" },
]

export default function IndicadoresEvolucaoForm() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [isPending, startTransition] = useTransition()

  const [formData, setFormData] = useState<FormValues>({
    colaborador_id: "",
    ano: String(new Date().getFullYear()),
    trimestre: "",
    nota: "",
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>(
    {},
  )

  useEffect(() => {
    async function load() {
      try {
        const data = await getColaboradoresEvolucao()
        setColaboradores(data ?? [])
      } catch (error) {
        console.error(error)
        toast.error("Não foi possível carregar os colaboradores.")
      }
    }

    load()
  }, [])

  function updateField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }))
  }

  function validateForm() {
    const newErrors: Partial<Record<keyof FormValues, string>> = {}

    if (!formData.colaborador_id) {
      newErrors.colaborador_id = "Selecione o colaborador."
    }

    if (!formData.ano) {
      newErrors.ano = "Informe o ano."
    }

    if (!formData.trimestre) {
      newErrors.trimestre = "Selecione o trimestre."
    }

    if (!formData.nota) {
      newErrors.nota = "Selecione a nota."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Preencha os campos obrigatórios.")
      return
    }

    startTransition(async () => {
      try {
        await createAvaliacaoEvolucao({
          colaborador_id: formData.colaborador_id,
          ano: Number(formData.ano),
          trimestre: Number(formData.trimestre),
          nota: Number(formData.nota),
        })

        toast.success("Avaliação de evolução salva com sucesso.")

        setFormData({
          colaborador_id: "",
          ano: String(new Date().getFullYear()),
          trimestre: "",
          nota: "",
        })

        setErrors({})
      } catch (error) {
        console.error(error)
        toast.error("Erro ao salvar avaliação de evolução.")
      }
    })
  }

  return (
    <div className="w-full pb-8">
      <Card className="rounded-2xl border bg-card p-4 shadow-sm md:p-6">
        <div className="mb-8 border-b pb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Indicador de Evolução
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Avaliação trimestral da evolução do colaborador.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-2xl border bg-card p-5 md:p-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="colaborador_id">Colaborador</Label>
                <select
                  id="colaborador_id"
                  value={formData.colaborador_id}
                  onChange={(e) => updateField("colaborador_id", e.target.value)}
                  className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecione o colaborador</option>
                  {colaboradores.map((colaborador) => (
                    <option key={colaborador.id} value={colaborador.id}>
                      {colaborador.nome}
                      {colaborador.departamento_nome
                        ? ` - ${colaborador.departamento_nome}`
                        : ""}
                    </option>
                  ))}
                </select>
                {errors.colaborador_id ? (
                  <p className="text-sm text-red-500">{errors.colaborador_id}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ano">Ano</Label>
                <input
                  id="ano"
                  type="number"
                  min={2020}
                  max={2100}
                  value={formData.ano}
                  onChange={(e) => updateField("ano", e.target.value)}
                  className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                />
                {errors.ano ? (
                  <p className="text-sm text-red-500">{errors.ano}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="trimestre">Trimestre</Label>
                <select
                  id="trimestre"
                  value={formData.trimestre}
                  onChange={(e) => updateField("trimestre", e.target.value)}
                  className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecione</option>
                  <option value="1">1º trimestre</option>
                  <option value="2">2º trimestre</option>
                  <option value="3">3º trimestre</option>
                  <option value="4">4º trimestre</option>
                </select>
                {errors.trimestre ? (
                  <p className="text-sm text-red-500">{errors.trimestre}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label>Nota de evolução</Label>
                <RadioGroup
                  value={formData.nota}
                  onValueChange={(value) => updateField("nota", value)}
                  className="grid grid-cols-1 gap-3"
                >
                  {opcoesNotas.map((opcao) => {
                    const id = `nota-${opcao.value}`

                    return (
                      <label
                        key={opcao.value}
                        htmlFor={id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition hover:bg-muted/40"
                      >
                        <RadioGroupItem value={opcao.value} id={id} />
                        <span className="font-medium">
                          {opcao.value} - {opcao.descricao}
                        </span>
                      </label>
                    )
                  })}
                </RadioGroup>
                {errors.nota ? (
                  <p className="text-sm text-red-500">{errors.nota}</p>
                ) : null}
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 min-w-44 rounded-xl px-6"
            >
              {isPending ? "Salvando..." : "Salvar evolução"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}