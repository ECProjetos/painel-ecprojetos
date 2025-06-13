import { useState, useEffect } from "react";
import { toast } from "sonner"; // Importando a lib de notificações
import { UseFormReturn } from "react-hook-form"; // Importação do tipo correto para integração com react-hook-form

interface UseCepLookupProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: UseFormReturn<any>; // Aceita qualquer formulário do react-hook-form
}

export function useCepLookup({ form }: UseCepLookupProps) {
    const [cep, setCep] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Função para buscar o endereço com o ViaCEP
    const fetchAddress = async (cep: string) => {
        if (cep.length !== 8 || isLoading) return;

        setIsLoading(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                toast.error("CEP inválido ou não encontrado");
            } else {
                form.setValue("endereco.logradouro", data.logradouro);
                form.setValue("endereco.cidade", data.localidade);
                form.setValue("endereco.estado", data.uf);
                form.setValue("endereco.complemento", data.complemento || "");
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
            toast.error("Erro ao buscar CEP");
        } finally {
            setIsLoading(false);
        }
    };

    // useEffect com debounce para evitar múltiplas requisições enquanto o usuário digita
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (cep.length === 8) {
                fetchAddress(cep);
            }
        }, 500);

        return () => clearTimeout(timeout); // Limpa o timeout se o usuário continuar digitando
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cep]); // Dependência: executa quando o `cep` muda

    return { cep, setCep, isLoading };
}
