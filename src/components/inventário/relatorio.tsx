"use client";

import { useEffect, useState } from "react";
import { getEstoqueData } from "@/app/actions/estoque";
import { InventoryItemView } from "@/types/estoque";
import{ CSVLink } from "react-csv"

export default function RelatorioEstoque() {
  const [dados, setDados] = useState<InventoryItemView[]>([]);

  useEffect(() => {
    async function fetchData() {
      const result = await getEstoqueData();
      setDados(result);
    }
    fetchData();
  }, []);

  const headers = [
    { label: "Nome", key: "nome" },
    { label: "Categoria", key: "categoria" },
    { label: "Quantidade", key: "quantidade" },
    { label: "Valor Pago", key: "valor_pago" },
    { label: "Valor Atual", key: "valor_atual" },
    { label: "Depreciação", key: "depreciacao" },
    { label: "Data Aquisição", key: "data_aquisicao" },
    { label: "Descrição", key: "descricao" },
  ];

  const csvData = dados.map((item) => ({
    ...item,
    valor_pago: `R$ ${item.valor_pago.toFixed(2)}`,
    valor_atual: `R$ ${item.valor_atual.toFixed(2)}`,
    depreciacao: `R$ ${(item.valor_pago - item.valor_atual).toFixed(2)}`,
  }));

  return (
    <section className="p-6 bg-white rounded-md shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">📋 Relatório Completo</h2>
        <CSVLink
          data={csvData}
          headers={headers}
          filename="relatorio-estoque.csv"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
        >
          📥 Exportar CSV
        </CSVLink>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-gray-200 rounded">
          <thead className="bg-gray-100">
            <tr>
              {headers.map((col) => (
                <th key={col.key} className="text-left p-2 border-b font-medium">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dados.map((item) => (
              <tr key={item.id}>
                <td className="p-2 border-b">{item.nome}</td>
                <td className="p-2 border-b">{item.categoria}</td>
                <td className="p-2 border-b">{item.quantidade}</td>
                <td className="p-2 border-b">R$ {item.valor_pago.toFixed(2)}</td>
                <td className="p-2 border-b">R$ {item.valor_atual.toFixed(2)}</td>
                <td className="p-2 border-b">R$ {(item.valor_pago - item.valor_atual).toFixed(2)}</td>
                <td className="p-2 border-b">{item.data_aquisicao}</td>
                <td className="p-2 border-b">{item.descricao || "-"}</td>
              </tr>
            ))}
            {dados.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-4 text-gray-500">
                  Nenhum item cadastrado ainda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
