"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "../ui/card";
import { Input } from "@/components/ui/input";
import { savePonto } from "@/app/actions/inicio/send-form-ponto";
import { getAtividadesByProjectId } from "@/app/actions/inicio/get-atividades";
import {
  activitiesArraySchema,
  ActivitiesType,
} from "@/types/inicio/atividades";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  projectsArraySchema,
  ProjectsType,
} from "@/types/inicio/projetos";
import { getProjetos } from "@/app/actions/inicio/get-projetos";
import { getUserSession } from "@/app/(auth)/actions";
import Loading from "@/app/loading";
import { nestedPontoType } from "@/types/inicio/ponto";
import { deletePonto } from "@/app/actions/inicio/get-ponto";
import { ComboboxSelect } from "../ui/combobox-select";

const initialState = { success: false, error: null as string | null };

export default function PontoForm() {
  const formRef = useRef<HTMLFormElement | null>(null);

  const [state, formAction, isPending] = useActionState(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (_prev: any, formData: FormData) => {
      return await savePonto(formData);
    },
    initialState
  );

  const [userId, setUserId] = useState<string | null>(null);
  const [atividades, setAtividades] = useState<ActivitiesType>([]);
  const [projetos, setProjetos] = useState<ProjectsType>([]);
  const [selectedProjetoId, setSelectedProjetoId] = useState<string>(""); // <- id em string
  const [selectedAtividade, setSelectedAtividade] = useState<string>("");
  const [periodos, setPeriodos] = useState<nestedPontoType[]>([]);
  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState<string>(today);

  // Buscar períodos do dia
  useEffect(() => {
    if (!userId || !date) return;

    const fetchPeriodos = async () => {
      try {
        const res = await fetch("/api/ponto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, entry_date: date }),
        });
        if (!res.ok) throw new Error("Erro ao buscar dados do ponto");
        const data = await res.json();
        setPeriodos(data);
      } catch (err) {
        console.error("Erro ao buscar períodos:", err);
      }
    };

    fetchPeriodos();
  }, [userId, date, state]);

  // Usuário
  useEffect(() => {
    const fetchUser = async () => {
      const session = await getUserSession();
      setUserId(session?.user.id || null);
    };
    fetchUser();
  }, []);

  // Projetos
  useEffect(() => {
    const fetchProjetos = async () => {
      const projetos = await getProjetos();
      const parsed = projectsArraySchema.safeParse(projetos);
      if (parsed.success) setProjetos(parsed.data);
      else setProjetos([]);
    };
    fetchProjetos();
  }, []);

  // Atividades por projeto (dispara quando o projeto muda)
  useEffect(() => {
    const fetchAtividades = async () => {
      if (!selectedProjetoId) {
        setAtividades([]);
        return;
      }
      try {
        const atividades = await getAtividadesByProjectId({
          project_id: selectedProjetoId,
        });
        const parsed = activitiesArraySchema.safeParse(atividades);
        setAtividades(parsed.success ? parsed.data : []);
      } catch (e) {
        console.error("Erro ao buscar atividades do projeto:", e);
        setAtividades([]);
      }
    };

    // ao trocar de projeto, limpa atividade selecionada
    setSelectedAtividade("");
    fetchAtividades();
  }, [selectedProjetoId]);

  // Reset após salvar
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setSelectedProjetoId("");
      setSelectedAtividade("");
      setAtividades([]);
    }
  }, [state.success]);

  if (!userId) return <Loading />;

  return (
    <Card className="h-[70vh] mx-6 overflow-y-auto ">
      <div className="grid grid-cols-2">
        <div className="h-full bg-[#fafbfc] m-4">
          <form ref={formRef} action={formAction} className="space-y-6 m-5">
            <div>
              <label className="block mb-5 font-medium">Data</label>
              <Input
                name="entry_date"
                className="bg-white"
                type="date"
                defaultValue={today}
                max={today}
                required
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-5 font-medium">Hora de Entrada</label>
                <Input name="entry_time" className="bg-white" type="time" required />
              </div>
              <div>
                <label className="block mb-5 font-medium">Hora de Saída</label>
                <Input name="exit_time" className="bg-white" type="time" required />
              </div>
            </div>

            <div>
              <label className="block mb-5 font-medium">Projeto</label>
              {/* hidden para garantir envio no FormData */}
              <input type="hidden" name="projeto" value={selectedProjetoId} />
              <Select
                value={selectedProjetoId}
                onValueChange={setSelectedProjetoId}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projetos && projetos.length > 0 ? (
                    projetos.map((projeto) => (
                      <SelectItem key={projeto.id} value={projeto.id.toString()}>
                        {projeto.code} - {projeto.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-gray-400">Nenhum projeto encontrado</div>
                  )}
                </SelectContent>
              </Select>

              <label className="block mb-5 mt-5 font-medium">Atividade</label>
              <ComboboxSelect
                name="atividade"
                className="w-full"
                value={selectedAtividade}
                onValueChange={setSelectedAtividade}
                placeholder={
                  selectedProjetoId
                    ? "Selecione uma atividade"
                    : "Selecione um projeto primeiro"
                }
                emptyText={
                  selectedProjetoId
                    ? "Nenhuma atividade encontrada"
                    : "Selecione um projeto"
                }
                items={(atividades ?? []).map((a) => ({
                  value: a.id.toString(),
                  label: a.name,
                }))}
                disabled={!selectedProjetoId}
              />
            </div>

            <input type="hidden" name="user_id" value={userId ?? ""} />

            <Button
              type="submit"
              className="w-full mt-10 py-1"
              disabled={isPending || !selectedProjetoId || !selectedAtividade}
            >
              {isPending ? "Salvando..." : "Registrar Ponto"}
            </Button>
          </form>

          {state.success && (
            <p className="text-green-600 mt-2 mx-10">Ponto registrado com sucesso!</p>
          )}
          {state.error && (
            <p className="text-red-600 mt-2 mx-10">{state.error}</p>
          )}
        </div>

        <PeriodosDoDia periodos={periodos} setPeriodos={setPeriodos} />
      </div>
    </Card>
  );
}

type Props = {
  periodos: nestedPontoType[];
  setPeriodos: React.Dispatch<React.SetStateAction<nestedPontoType[]>>;
};

function formatTime(time: string): string {
  return time.slice(0, 5); // hh:mm:ss → hh:mm
}

function calcularDuracao(entry: string, exit: string): string {
  const [eh, em] = entry.split(":").map(Number);
  const [xh, xm] = exit.split(":").map(Number);
  let totalMin = xh * 60 + xm - (eh * 60 + em);
  if (totalMin < 0) totalMin = 0;
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;
  return `${horas}h ${minutos}min`;
}

export function PeriodosDoDia({ periodos, setPeriodos }: Props) {
  const totalMinutos = periodos.reduce((acc, p) => {
    const [eh, em] = p.entry_time.split(":").map(Number);
    const [xh, xm] = p.exit_time.split(":").map(Number);
    return acc + (xh * 60 + xm - (eh * 60 + em));
  }, 0);

  const totalHoras = Math.floor(totalMinutos / 60);
  const totalMin = totalMinutos % 60;

  const handleDelete = async (ponto: nestedPontoType) => {
    await deletePonto({
      payload: {
        user_id: ponto.user_id,
        entry_date: ponto.entry_date,
        entry_time: ponto.entry_time,
      },
    });
    setPeriodos(periodos.filter((item) => item.entry_time !== ponto.entry_time));
  };

  return (
    <div className=" h-full bg-[#fafbfc] m-4 p-10">
      <h3 className="text-lg font-semibold mb-4">Períodos do Dia Selecionado</h3>
      <div className="space-y-4 ">
        {periodos.map((p) => (
          <div
            key={`${p.user_id}-${p.entry_date}-${p.entry_time}`}
            className="border-l-4 border-blue-500 bg-white p-3 rounded-md shadow-sm flex justify-between items-start"
          >
            <div>
              <p className="font-medium text-sm text-gray-800">Você</p>
              <p className="text-sm text-gray-600">
                {formatTime(p.entry_time)} - {formatTime(p.exit_time)} (
                {calcularDuracao(p.entry_time, p.exit_time)})
              </p>
              <p className="text-sm text-gray-500">
                {p.projeto?.name || "Sem projeto"} • {p.atividade?.name || "Sem atividade"}
              </p>
            </div>
            <button
              className="text-red-500 hover:text-red-700 text-sm font-bold"
              aria-label="Remover período"
              onClick={() => handleDelete(p)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 text-right text-sm text-gray-700 font-semibold">
        Total do dia: {totalHoras}h {totalMin}min
      </div>
    </div>
  );
}
