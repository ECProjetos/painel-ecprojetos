"use client";

import { useEffect, useState } from "react";
import {
  getHabilidadesPorDepartamento,
  salvarAvaliacaoHabilidades,
} from "@/app/actions/avaliacao-habilidades";

type Habilidade = {
  id: string;
  nome: string;
  tipo: "hard" | "soft";
  nivel_1: string | null;
  nivel_2: string | null;
  nivel_3: string | null;
  nivel_4: string | null;
  nivel_5: string | null;
};

type Props = {
  colaboradorId: string;
  avaliadorId: string;
  departamento: string;
  periodo:string;
};

export function AvaliacaoHabilidadesForm({
  colaboradorId,
  avaliadorId,
  departamento,
  periodo,
}: Props) {
  const [habilidades, setHabilidades] = useState<Habilidade[]>([]);
  const [loading, setLoading] = useState(true);

  const [respostas, setRespostas] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    async function load() {
      try {
        const data =
          await getHabilidadesPorDepartamento(departamento);

        setHabilidades(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [departamento]);

  async function handleSubmit() {
    try {
      await salvarAvaliacaoHabilidades({
        colaborador_id: colaboradorId,
        avaliador_id: avaliadorId,
        periodo,
        respostas: Object.entries(respostas).map(
          ([habilidade_id, nota]) => ({
            habilidade_id,
            nota,
          })
        ),
      });

      alert("Avaliação salva com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar avaliação");
    }
  }

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-8">
      {["hard", "soft"].map((tipo) => (
        <div key={tipo}>
          <h2 className="text-xl font-bold mb-4">
            {tipo === "hard"
              ? "Hard Skills"
              : "Soft Skills"}
          </h2>

          <div className="space-y-4">
            {habilidades
              .filter((h) => h.tipo === tipo)
              .map((habilidade) => (
                <div
                  key={habilidade.id}
                  className="border rounded-xl p-4"
                >
                  <div className="font-medium mb-3">
                    {habilidade.nome}
                  </div>

                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((nota) => (
                      <button
                        key={nota}
                        type="button"
                        onClick={() =>
                          setRespostas((prev) => ({
                            ...prev,
                            [habilidade.id]: nota,
                          }))
                        }
                        className={`w-10 h-10 rounded-lg border ${
                          respostas[habilidade.id] === nota
                            ? "bg-blue-600 text-white"
                            : "bg-white"
                        }`}
                      >
                        {nota}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl"
      >
        Salvar Avaliação
      </button>
    </div>
  );
}