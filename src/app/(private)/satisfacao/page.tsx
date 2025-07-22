"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { criarNps } from "@/app/actions/criar-nps";
import { useActionState } from "react";


export default function CriarNpsPage() {
    const [state, formAction] = useActionState(criarNps, undefined);


    return (
        <Card className="w-full max-w-4xl mx-auto my-60">
            <form action={formAction}>
                <CardHeader>
                    <CardTitle className="text-xl">Criar NPS</CardTitle>
                    <CardDescription>
                        Preencha os detalhes do formulário NPS.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex container mx-auto p-4 flex-col gap-6">
                        <div className="flex flex-col gap-2 max-w-2xl">
                            <label htmlFor="cliente" className="text-lg font-semibold">
                                Razão Social:
                            </label>
                            <Input className="placeholder:text-gray-400" placeholder="Insira a razão social" id="cliente" name="cliente" />
                        </div>
                        <div className="flex flex-col gap-2 max-w-2xl">
                            <label htmlFor="projeto" className="text-lg font-semibold">
                                Projeto:
                            </label>
                            <Input className="placeholder:text-gray-400" placeholder="Insira o código do Projeto" id="projeto" name="projeto" />
                        </div>
                    </div>
                </CardContent>
                {state?.success && (
                    <div className="text-green-600 text-center mb-2">
                        Cadastro realizado com sucesso!
                    </div>
                )}
                {state?.error && (
                    <div className="text-red-600 text-center mb-2">
                        {typeof state.error === "string"
                            ? state.error
                            : "Ocorreu um erro. Verifique os dados e tente novamente."}
                    </div>
                )}
                <CardFooter className="flex justify-end">
                    <Button className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white" type="submit" >
                        <BookOpen className="size-4" />
                        Criar ENPS
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
};
