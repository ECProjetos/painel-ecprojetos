"use client"

import { useActionState } from "react"
import { SendEnpsForm } from "@/app/actions/enps-form"
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
import { Button } from "@/components/ui/button"

export default function FormEnps() {
  const [, formAction] = useActionState(SendEnpsForm, undefined)

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
    <Card className="w-full min-h-screen">
      <CardHeader>
        <CardTitle>Formulário eNPS</CardTitle>
        <CardDescription>
          Sua opinião é muito importante para nós.
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
                <SelectItem value="Administrativo">Administrativo</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Comercial">Comercial</SelectItem>
                <SelectItem value="Engenharia">Engenharia</SelectItem>
                <SelectItem value="Meio Ambiente">Meio Ambiente</SelectItem>
                <SelectItem value="Economia">Economia</SelectItem>
                <SelectItem value="Desenvolvimento de Tecnologias">
                  Desenvolvimento de Tecnologias
                </SelectItem>
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
        <CardFooter>
          <Button type="submit">Enviar</Button>
        </CardFooter>
      </form>
    </Card>
  )
}