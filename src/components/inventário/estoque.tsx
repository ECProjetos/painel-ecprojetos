import { useState } from "react";

export default function Estoque() {
    const [categoria, setCategoria] = useState("todas");
    const [busca, setBusca] = useState("");

    return (
        <main className="min-h-screen py-8">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <ResumoCard titulo="Total de Itens" valor="0" cor="bg-blue-600" icon="📦" />
                <ResumoCard titulo="Valor Investido" valor="R$ 0,00" cor="bg-green-600" icon="💰" />
                <ResumoCard titulo="Valor Atual" valor="R$ 0,00" cor="bg-purple-600" icon="📈" />
                <ResumoCard titulo="Depreciação" valor="R$ 0,00" cor="bg-red-600" icon="📉" />
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-md shadow-md flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
                <div className="flex-1 w-full">
                    <label className="text-sm font-medium text-gray-700">🔍 Buscar Item</label>
                    <input
                        type="text"
                        placeholder="Digite o nome do item..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                    />
                </div>

                <div className="flex items-end gap-4 w-full md:w-auto">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700">📁 Categoria</label>
                        <select
                            className="border border-gray-300 rounded-md p-2"
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                        >
                            <option value="todas">Todas as categorias</option>
                            <option value="eletronico">Eletrônico</option>
                            <option value="moveis">Móveis</option>
                        </select>
                    </div>
                    <button
                        className="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800"
                        onClick={() => {
                            setBusca("");
                            setCategoria("todas");
                        }}
                    >
                        Limpar
                    </button>
                </div>
            </div>

            {/* Seções de Dados */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Quadro titulo="📊 Itens por Categoria" />
                <Quadro titulo="📈 Valor por Categoria" />
            </div>

            <div className="bg-white p-6 rounded-md shadow-md">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    🧾 Itens em Estoque
                    <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">0</span>
                </h2>
                <div className="flex flex-col items-center justify-center text-center py-12">
                    <span className="text-4xl mb-4">🔍</span>
                    <p className="text-gray-700 font-semibold">Nenhum item cadastrado</p>
                    <p className="text-gray-500 text-sm mt-1">Tente ajustar os filtros ou cadastrar novos itens</p>
                </div>
            </div>
        </main>
    );
}

// Componentes auxiliares

function ResumoCard({ titulo, valor, cor, icon }: { titulo: string; valor: string; cor: string; icon: string }) {
    return (
        <div className={`${cor} text-white p-4 rounded-lg shadow-md flex items-center justify-between`}>
            <div>
                <p className="text-sm">{titulo}</p>
                <h2 className="text-xl font-bold">{valor}</h2>
            </div>
            <span className="text-3xl">{icon}</span>
        </div>
    );
}

function Quadro({ titulo }: { titulo: string }) {
    return (
        <div className="bg-white p-6 rounded-md shadow-md">
            <h2 className="font-semibold text-lg mb-4">{titulo}</h2>
            <p className="text-gray-400 text-sm">Nenhum dado disponível</p>
        </div>
    );
}
