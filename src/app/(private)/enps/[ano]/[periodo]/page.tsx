"use client"

import { useActionState, useEffect, useState } from "react"
import { SendEnpsForm } from "@/app/actions/enps-form"
import { getAllDepartments } from "@/app/actions/get-departamentos"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  const params = useParams();
  const ano = params.ano;
  const periodo = params.periodo;
  console.log("Params:", params);
  const sendEnpsFormWithParams = SendEnpsForm.bind(null, ano as string, periodo as string)
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

  const renderLinearScale = (name: string, label: string) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <RadioGroup name={name} required className="flex gap-4">
        {linearScaleOptions.map((val) => (
          <div key={`${name}-${val}`} className="flex items-center space-x-2">
            <RadioGroupItem value={String(val)} id={`${name}-${val}`} />
            <Label htmlFor={`${name}-${val}`}>{val}</Label>
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
          Este questionário é totalmente anônimo e será utilizado exclusivamente para entender o nível de satisfação e engajamento com a empresa, por meio da metodologia eNPS (Employee Net Promoter Score).
          Pedimos que responda com sinceridade. Sua participação contribui diretamente para a melhoria contínua do nosso ambiente de trabalho.
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

          <div className="space-y-2">
            <Label htmlFor="enpsScore">
              Em uma escala de 0 a 10, o quanto você recomendaria a EC a um
              colega ou amigo como um bom lugar para trabalhar?
            </Label>
            <Input
              type="number"
              id="enpsScore"
              name="enpsScore"
              min={0}
              max={10}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="enpsReason">
              Por favor, conte brevemente por que você escolheu essa nota:
            </Label>
            <Textarea
              id="enpsReason"
              name="enpsReason"
              rows={4}
              required
            />
          </div>
          <h2 className="font-bold"> Pensando no seu trabalho na EC, como você percebe que estes valores são vividos e praticados por você e pelo seu time?</h2>
          <p className="text-sm text-muted-foreground">
            (Selecione a opção que mais representa sua experiência.)
          </p>

          <div className="space-y-4 gap-3">
            {renderLinearScale("centradoCliente", "Centrado no Cliente")}
            {renderLinearScale(
              "qualidadeAssegurada",
              "Qualidade Assegurada",
            )}
            {renderLinearScale("avancoTecnologico", "Avanço Tecnológico")}
            {renderLinearScale(
              "eficienciaDinamica",
              "Eficiência Dinâmica",
            )}
            {renderLinearScale(
              "colaboracaoIntegral",
              "Colaboração Integral",
            )}
          </div>

          <div className="space-y-4">
            {renderLinearScale(
              "gestaoDireta",
              "O quanto a sua gestão direta te valoriza, te escuta, apoia e te ajuda a se desenvolver como profissional?",
            )}
            {renderLinearScale("visaoFuturo", "Visão de futuro na empresa")}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <SubmitButton className="w-30px mt-6 bg-blue-800">Enviar Resposta</SubmitButton>
        </CardFooter>
      </form>

    </Card>
  )
}