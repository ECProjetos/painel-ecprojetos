"use client";

import { useActionState } from "react";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { createEstoque } from "@/app/actions/estoque";

export default function CadastroInventario() {
  const initialState = { success: false, message: "" };

  const formReducer = async (state: typeof initialState, formData: FormData) => {
    return await createEstoque(state, formData); // a função deve retornar { success, message }
  };

  const [formState, formAction] = useActionState(formReducer, initialState);

  return (
    <div className="w-full mt-10">
      <Card className="p-10 shadow-lg bg-white rounded-md">
        <form className="flex flex-col space-y-10" action={formAction}>
          <h1 className="text-2xl font-semibold text-left">
            Cadastro de Item
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome do Item */}
            <div className="flex flex-col">
              <label htmlFor="nome" className="mb-1 font-medium text-sm">
                Nome do Item
              </label>
              <Input id="nome" name="nome" type="text" required />
            </div>

            {/* Categoria */}
            <div className="flex flex-col">
              <label htmlFor="categoria" className="mb-1 font-medium text-sm">
                Categoria
              </label>
              <select
                id="categoria"
                name="categoria"
                required
                className="border border-gray-300 rounded-md p-2"
              >
                <option value="">Selecione...</option>
                <option value="eletronico">Computadores</option>
                <option value="escritorio">Material de Escritório</option>
                <option value="campo">Equipamento de Campo</option>
                <option value="softwares">Softwares</option>
              </select>
            </div>

            {/* Valor Pago */}
            <div className="flex flex-col">
              <label htmlFor="valorPago" className="mb-1 font-medium text-sm">
                Valor Pago (R$)
              </label>
              <Input id="valorPago" name="valorPago" type="number" step="0.01" required />
            </div>

            {/* Valor Atual */}
            <div className="flex flex-col">
              <label htmlFor="valorAtual" className="mb-1 font-medium text-sm">
                Valor Atual (R$)
              </label>
              <Input id="valorAtual" name="valorAtual" type="number" step="0.01" required />
            </div>

            {/* Quantidade */}
            <div className="flex flex-col">
              <label htmlFor="quantidade" className="mb-1 font-medium text-sm">
                Quantidade
              </label>
              <Input id="quantidade" name="quantidade" type="number" min={0} required />
            </div>

            {/* Data de Aquisição */}
            <div className="flex flex-col">
              <label htmlFor="dataAquisicao" className="mb-1 font-medium text-sm">
                Data de Aquisição
              </label>
              <Input id="dataAquisicao" name="dataAquisicao" type="date" required />
            </div>
          </div>

          {/* Descrição */}
          <div className="flex flex-col">
            <label htmlFor="descricao" className="mb-1 font-medium text-sm">
              Descrição
            </label>
            <textarea
              id="descricao"
              name="descricao"
              placeholder="Detalhes adicionais sobre o item..."
              rows={4}
              className="border border-gray-300 rounded-md p-3 resize-none"
            />
          </div>

          {/* Botão */}
          <div className="flex justify-center text-center">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-green-500 transition font-medium flex items-center gap-2 w-full"
            >
              Cadastrar Item
            </button>
          </div>

          {/* Feedback */}
          {formState.message && (
            <p className={`text-center text-sm ${formState.success ? 'text-green-600' : 'text-red-600'}`}>
              {formState.message}
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}
