import { Card } from "../ui/card";
import { Input } from "../ui/input";

export default function CadastroInventario() {

    return (
            <div className="w-full mt-10">
                <Card className="p-10 shadow-lg bg-white rounded-md">
                    <form className="flex flex-col space-y-10">
                        <h1 className="text-2xl font-semibold text-left">
                            Cadastro de Item
                        </h1>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nome do Item */}
                            <div className="flex flex-col">
                                <label htmlFor="nome" className="mb-1 font-medium text-sm">
                                    Nome do Item
                                </label>
                                <Input id="nome" name="nome" type="text" />
                            </div>

                            {/* Categoria */}
                            <div className="flex flex-col">
                                <label htmlFor="categoria" className="mb-1 font-medium text-sm">
                                    Categoria
                                </label>
                                <select
                                    id="categoria"
                                    name="categoria"
                                    className="border border-gray-300 rounded-md p-2"
                                >
                                    <option>Selecione...</option>
                                    <option value="eletronico">Eletrônico</option>
                                    <option value="moveis">Móveis</option>
                                    <option value="escritorio">Escritório</option>
                                </select>
                            </div>

                            {/* Valor Pago */}
                            <div className="flex flex-col">
                                <label htmlFor="valorPago" className="mb-1 font-medium text-sm">
                                    Valor Pago (R$)
                                </label>
                                <Input id="valorPago" name="valorPago" type="number" step="0.01" />
                            </div>

                            {/* Valor Atual */}
                            <div className="flex flex-col">
                                <label htmlFor="valorAtual" className="mb-1 font-medium text-sm">
                                    Valor Atual (R$)
                                </label>
                                <Input id="valorAtual" name="valorAtual" type="number" step="0.01" />
                            </div>

                            {/* Quantidade */}
                            <div className="flex flex-col">
                                <label htmlFor="quantidade" className="mb-1 font-medium text-sm">
                                    Quantidade
                                </label>
                                <Input id="quantidade" name="quantidade" type="number" min={0} />
                            </div>

                            {/* Data de Aquisição */}
                            <div className="flex flex-col">
                                <label htmlFor="dataAquisicao" className="mb-1 font-medium text-sm">
                                    Data de Aquisição
                                </label>
                                <Input id="dataAquisicao" name="dataAquisicao" type="date" />
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
                                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-green-500 transition font-medium flex items-center gap-2 w-full "
                            >
                                Cadastrar Item
                            </button>
                        </div>
                    </form>
                </Card>
            </div>
    );
}
