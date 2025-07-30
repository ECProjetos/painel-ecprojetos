"use client";

import { useEffect, useState } from "react";
import { getEstoqueData } from "@/app/actions/estoque";
import { InventoryItemView } from "@/types/estoque";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#6366F1", "#8B5CF6"];

export default function EstoquePage() {
  const [estoque, setEstoque] = useState<InventoryItemView[]>([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");

  useEffect(() => {
    async function fetchData() {
      const data = await getEstoqueData();
      setEstoque(data);
    }
    fetchData();
  }, []);

  const filtrados = estoque.filter((item) => {
    const nomeMatch = item.nome.toLowerCase().includes(busca.toLowerCase());
    const categoriaMatch = categoria === "todas" || item.categoria === categoria;
    return nomeMatch && categoriaMatch;
  });

  const resumo = estoque[0] ?? {
    total_de_itens: 0,
    total_valor_investido: 0,
    total_valor_atual: 0,
    total_depreciacao: 0,
  };

  const porCategoria = filtrados.reduce((acc, item) => {
    if (!acc[item.categoria]) {
      acc[item.categoria] = { categoria: item.categoria, quantidade: 0, valor: 0 };
    }
    acc[item.categoria].quantidade += item.quantidade;
    acc[item.categoria].valor += item.valor_atual;
    return acc;
  }, {} as Record<string, { categoria: string; quantidade: number; valor: number }>);

  const dadosGrafico = Object.values(porCategoria);

  return (
    <main className="min-h-screen py-10 px-4 md:px-10">
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <ResumoCard titulo="Total de Itens" valor={resumo.total_de_itens.toString()} cor="bg-blue-600" icon="📦" />
        <ResumoCard titulo="Valor Investido" valor={`R$ ${resumo.total_valor_investido.toFixed(2)}`} cor="bg-green-600" icon="💰" />
        <ResumoCard titulo="Valor Atual" valor={`R$ ${resumo.total_valor_atual.toFixed(2)}`} cor="bg-purple-600" icon="📈" />
        <ResumoCard titulo="Depreciação" valor={`R$ ${resumo.total_depreciacao.toFixed(2)}`} cor="bg-red-600" icon="📉" />
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
              {Array.from(new Set(estoque.map((i) => i.categoria))).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
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

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Quadro titulo="📊 Itens por Categoria">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dadosGrafico}
                dataKey="quantidade"
                nameKey="categoria"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {dadosGrafico.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Quadro>
        <Quadro titulo="📈 Valor por Categoria">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoria" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="valor" fill="#6366F1" />
            </BarChart>
          </ResponsiveContainer>
        </Quadro>
      </div>

      {/* Lista de Itens */}
      <div className="bg-white p-6 rounded-md shadow-md">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          🧾 Itens em Estoque
          <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {filtrados.length}
          </span>
        </h2>
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <span className="text-4xl mb-4">🔍</span>
            <p className="text-gray-700 font-semibold">Nenhum item cadastrado</p>
            <p className="text-gray-500 text-sm mt-1">Tente ajustar os filtros ou cadastrar novos itens</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtrados.map((item) => (
              <div key={item.id} className="border rounded p-4 shadow-sm">
                <div className="flex justify-between">
                  <h3 className="text-lg font-bold">{item.nome}</h3>
                  <span className="text-sm text-gray-500">{item.categoria}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-sm">
                  <p><strong>Valor Pago:</strong> R$ {item.valor_pago.toFixed(2)}</p>
                  <p><strong>Valor Atual:</strong> R$ {item.valor_atual.toFixed(2)}</p>
                  <p><strong>Depreciação:</strong> R$ {(item.valor_pago - item.valor_atual).toFixed(2)}</p>
                  <p><strong>Quantidade:</strong> {item.quantidade}</p>
                  <p><strong>Aquisição:</strong> {item.data_aquisicao}</p>
                </div>
                {item.descricao && (
                  <p className="text-sm italic text-gray-600 mt-2">{item.descricao}</p>
                )}
              </div>
            ))}
          </div>
        )}
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

function Quadro({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-md shadow-md">
      <h2 className="font-semibold text-lg mb-4">{titulo}</h2>
      {children || <p className="text-gray-400 text-sm">Nenhum dado disponível</p>}
    </div>
  );
}
