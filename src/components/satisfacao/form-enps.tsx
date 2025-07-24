"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { criarEnps } from "@/app/actions/satisfacao/criar-enps";
import { useActionState } from "react";

export default function CriarEnpsForm() {
    const [state, formAction] = useActionState(criarEnps, undefined);
    


    return (
        <Card className="w-full max-w-4xl flex jutify-center mx-auto mt-40 mb-10">
            <form action={formAction}>
                <CardHeader>
                    <CardTitle className="text-xl">Criar ENPS</CardTitle>
                    <CardDescription>
                        Preencha os detalhes do formulário ENPS.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex container mx-auto p-4 flex-col gap-6">
                        <div className="flex flex-col gap-2 max-w-2xl">
                            <label htmlFor="ano" className="text-lg font-semibold">
                                Ano:
                            </label>
                            <Input
                                className="placeholder:text-gray-400"
                                placeholder="Insira o ano de referencia"
                                id="ano"
                                name="ano"
                                onChange={e => {
                                    e.target.value = e.target.value
                                        .toLowerCase()
                                        .replace(/\s+/g, "-");
                                }}
                            />
                        </div>
                        <div className="flex flex-col gap-2 max-w-2xl">
                            <label htmlFor="periodo" className="text-lg font-semibold">
                                Periodo:
                            </label>
                            <Input
                                className="placeholder:text-gray-400"
                                placeholder="Insira o periodo"
                                id="periodo"
                                name="periodo"
                                onChange={e => {
                                    e.target.value = e.target.value
                                        .toLowerCase()
                                        .replace(/\s+/g, "-");
                                }}
                            />
                        </div>
                    </div>
                </CardContent>
                
                {state?.success && (
                    <div className="text-green-600 text-center mb-2">
                        Cadastro realizado com sucesso!{" "}
                        
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
