"use client"

import { useActionState, useEffect } from "react"
import { SendNpsForm } from "@/app/actions/nps-form"
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

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import SubmitButton from "@/components/submit-button"
import { Textarea } from "@/components/ui/textarea"


export default function FormSatisfacao() {
    const [state, formAction] = useActionState(SendNpsForm, {
        message: "",
    })


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
                <CardTitle className="text-xl">Formulário de Satisfação</CardTitle>
                <CardDescription>
                    Sua opinião é muito importante para nós.
                </CardDescription>
            </CardHeader>
            <form action={formAction}>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="npsScore">
                            Pergunta 1: Em uma escala de 0 a 10, o quanto você recomendaria a EC Projetos a um colega ou parceiro do setor?
                        </Label>
                        <Input
                            type="number"
                            id="npsScore"
                            name="npsScore"
                            min={0}
                            max={10}
                            required
                        />
                    </div>
                    <div className="space-y-4 gap-3 mt-10">
                        {renderLinearScale("satisfacaoGeral", "De 1 a 5, qual foi o seu nível de satisfação geral com o projeto entregue?")}

                        <h3 className="font-bold mt-7">Qual foi o seu nível de satisfação com o projeto entregue para estes itens específicos:</h3>
                        {renderLinearScale(
                            "aplicacaoPratica",
                            "Aplicação prática do projeto",
                        )}
                        {renderLinearScale("avancoTecnologico", "Qualidade técnica do projeto")}
                        {renderLinearScale(
                            "apresentacaoVisual",
                            "Apresentação visual e clareza das entregas	",
                        )}
                        {renderLinearScale(
                            "adesaoCronograma",
                            "Adesão ao cronograma combinado",
                        )}
                        {renderLinearScale(
                            "comunicacaoIntegral",
                            "Comunicação e disponibilidade da equipe",
                        )}
                    </div>
                    <Textarea
                        name="comentarioGeral"
                        id="comentarioGeral"
                        placeholder="Comentário aberto: Fique à vontade para contar um pouco mais sobre o que funcionou bem ou o que poderíamos melhorar."
                        className="w-full h-32 mt-10"
                    />
                </CardContent>
                <CardFooter className="flex justify-end ">
                    <SubmitButton className="w-30px mt-6 bg-blue-800">Enviar Resposta</SubmitButton>
                </CardFooter>
            </form>

        </Card>
    )
}