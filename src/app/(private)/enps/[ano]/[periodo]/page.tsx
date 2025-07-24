"use client"

import { useActionState, useEffect, useState } from "react"
import { SendEnpsForm } from "@/app/actions/satisfacao/enps-form"
import { getAllDepartments } from "@/app/actions/get-departamentos"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import SubmitButton from "@/components/submit-button"
import { useParams } from "next/navigation"

type Department = {
  id: string
  name: string
}

export default function FormEnps() {
  const [departments, setDepartments] = useState<Department[]>([])
  const params = useParams()
  const ano = params.ano
  const periodo = params.periodo
  console.log("Params:", params)
  const sendEnpsFormWithParams = SendEnpsForm.bind(
    null,
    ano as string,
    periodo as string,
  )
  const [state, formAction] = useActionState(sendEnpsFormWithParams, {
    message: "",
  })

  useEffect(() => {
    async function fetchDepartments() {
      const fetchedDepartments = await getAllDepartments()
      setDepartments(fetchedDepartments)
    }
    fetchDepartments()
  }, [])

  useEffect(() => {
    if (state?.message) {
      alert(state.message)
    }
  }, [state])

  const linearScaleOptions = [1, 2, 3, 4, 5]

  const linearScaleLabels = [
    "Nunca",
    "Raramente",
    "Às vezes",
    "Frequentemente",
    "Sempre",
  ]

  const renderLinearScale = (
    name: string,
    label: string,
    description?: string,
  ) => (
    <div className="space-y-1">
      <Label>{label}</Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <RadioGroup name={name} required className="flex gap-4 mt-2">
        {linearScaleOptions.map((val, idx) => (
          <div
            key={`${name}-${val}`}
            className="flex flex-col items-center space-y-1"
          >
            <RadioGroupItem value={String(val)} id={`${name}-${val}`} />
            <span className="text-xs text-muted-foreground">
              {linearScaleLabels[idx]}
            </span>
          </div>
        ))}
      </RadioGroup>
    </div>
  )

  return (
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Formulário eNPS</CardTitle>
        <CardDescription>
          Este questionário é totalmente anônimo e será utilizado exclusivamente
          para entender o nível de satisfação e engajamento com a empresa, por
          meio da metodologia eNPS (Employee Net Promoter Score). Pedimos que
          responda com sinceridade. Sua participação contribui diretamente para
          a melhoria contínua do nosso ambiente de trabalho.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="department">Qual é o seu departamento?</Label>
            <Select name="department" required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <h2 className="font-bold">
            {" "}
            Pensando no seu trabalho na EC, como você percebe que estes valores
            são vividos e praticados por você e pelo seu time?
          </h2>
          <p className="text-sm text-muted-foreground">
            (Selecione a opção que mais representa sua experiência.)
          </p>

          <div className="space-y-4 gap-3">
            {renderLinearScale(
              "centradoCliente",
              "Centrado no Cliente",
              "No dia a dia, eu e meu time priorizamos entender e atender as necessidades dos clientes, buscando superar expectativas.",
            )}

            {renderLinearScale(
              "qualidadeAssegurada",
              "Qualidade Assegurada",
              "Eu contribuo para manter padrões de qualidade elevados em tudo o que entrego.",
            )}

            {renderLinearScale(
              "avancoTecnologico",
              "Avanço Tecnológico",
              "Eu busco aprender e usar tecnologias novas que melhoram nosso trabalho. Tenho clareza sobre como apresentar uma ideia de melhoria na EC Projetos.",
            )}

            {renderLinearScale(
              "eficienciaDinamica",
              "Eficiência Dinâmica",
              "Eu ajo com rapidez e adaptação frente a mudanças e demandas.",
            )}

            {renderLinearScale(
              "colaboracaoIntegral",
              "Colaboração Integral",
              "Eu colaboro ativamente e contribuo para o crescimento coletivo do time. Sinto que tenho liberdade e apoio para sugerir melhorias no meu trabalho.",
            )}

            {renderLinearScale(
              "gestaoDireta",
              "O quanto a sua gestão direta te valoriza, te escuta, apoia e te ajuda a se desenvolver como profissional?",
            )}

            {renderLinearScale("visaoFuturo", "Visão de futuro na empresa")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="enpsScore" className="mb-7">
              Em uma escala de 0 a 10, o quanto você recomendaria a EC a um
              colega ou amigo como um bom lugar para trabalhar?
            </Label>
            <RadioGroup
              name="enpsScore"
              required
              className="flex flex-wrap gap-5"
            >
              {Array.from({ length: 11 }, (_, i) => (
                <div key={i} className="flex flex-col items-center space-y-1">
                  <RadioGroupItem value={String(i)} id={`enpsScore-${i}`} />
                  <span className="text-xs">{i}</span>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="enpsReason">
              Por favor, conte brevemente por que você escolheu essa nota:
            </Label>
            <Textarea id="enpsReason" name="enpsReason" rows={4} required />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <SubmitButton className="w-30px mt-6 bg-blue-800">
            Enviar Resposta
          </SubmitButton>
        </CardFooter>
      </form>
    </Card>
  )
}
