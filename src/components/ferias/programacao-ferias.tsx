"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Pencil,
  Settings2,
  ShieldAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import {
  atualizarPeriodoAquisitivo,
  salvarConfiguracaoFerias,
  type FeriasAlerta,
  type FeriasPeriodoGozo,
  type FeriasPeriodoResumo,
  type FeriasSituacao,
} from "@/app/actions/ferias";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type ConfiguracaoFerias = {
  id: string;
  regime_contratacao: "clt" | "estagio" | "pj" | "outro";
  ativo_gestao_ferias: boolean;
  data_admissao_referencia: string | null;
  dias_direito_padrao: number;
  observacao: string | null;
};

type ColaboradorFerias = {
  id: string;
  nome: string;
  email: string | null;
  status: string;
  cargo: string | null;
  equipe: string | null;
  data_admissao: string | null;
  configuracao_ferias: ConfiguracaoFerias | null;
};

type ProgramacaoFeriasProps = {
  colaboradores: ColaboradorFerias[];
  programacao: FeriasPeriodoResumo[];
  alertas: FeriasAlerta[];
  podeEditar: boolean;
};

type ConfigForm = {
  colaboradorId: string;
  colaboradorNome: string;
  regimeContratacao: "clt" | "estagio" | "pj" | "outro";
  ativoGestaoFerias: boolean;
  dataAdmissaoReferencia: string;
  diasDireitoPadrao: string;
  observacao: string;
};

type PeriodoForm = {
  periodoId: string;
  colaboradorNome: string;
  aquisitivoInicio: string;
  aquisitivoFim: string;
  concessivoInicio: string;
  concessivoFim: string;
  diasDireito: string;
  motivoAjuste: string;
  observacao: string;
};

const situacaoLabels: Record<FeriasSituacao, string> = {
  regular: "Regular",
  atencao: "Atenção",
  urgente: "Urgente",
  vencido: "Vencido",
  concluido: "Concluído",
};

const situacaoClasses: Record<FeriasSituacao, string> = {
  regular: "border-sky-200 bg-sky-50 text-sky-700",
  atencao: "border-amber-200 bg-amber-50 text-amber-700",
  urgente: "border-orange-200 bg-orange-50 text-orange-700",
  vencido: "border-rose-200 bg-rose-50 text-rose-700",
  concluido: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const gozoSituacaoLabels: Record<
  FeriasPeriodoGozo["situacao_gozo"],
  string
> = {
  usufruido: "Usufruído",
  em_gozo: "Em gozo",
  programado: "Programado",
  pendente: "Pendente",
};

const gozoSituacaoClasses: Record<
  FeriasPeriodoGozo["situacao_gozo"],
  string
> = {
  usufruido: "border-zinc-200 bg-zinc-50 text-zinc-700",
  em_gozo: "border-sky-200 bg-sky-50 text-sky-700",
  programado: "border-indigo-200 bg-indigo-50 text-indigo-700",
  pendente: "border-amber-200 bg-amber-50 text-amber-700",
};

const configInicial: ConfigForm = {
  colaboradorId: "",
  colaboradorNome: "",
  regimeContratacao: "clt",
  ativoGestaoFerias: true,
  dataAdmissaoReferencia: "",
  diasDireitoPadrao: "30",
  observacao: "",
};

const periodoInicial: PeriodoForm = {
  periodoId: "",
  colaboradorNome: "",
  aquisitivoInicio: "",
  aquisitivoFim: "",
  concessivoInicio: "",
  concessivoFim: "",
  diasDireito: "30",
  motivoAjuste: "",
  observacao: "",
};

export default function ProgramacaoFerias({
  colaboradores,
  programacao,
  alertas,
  podeEditar,
}: ProgramacaoFeriasProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busca, setBusca] = useState("");
  const [configAberta, setConfigAberta] = useState(false);
  const [periodoAberto, setPeriodoAberto] = useState(false);
  const [configForm, setConfigForm] = useState<ConfigForm>(configInicial);
  const [periodoForm, setPeriodoForm] = useState<PeriodoForm>(periodoInicial);

  const programacaoFiltrada = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    if (!termo) {
      return programacao;
    }

    return programacao.filter((periodo) =>
      periodo.colaborador_nome.toLocaleLowerCase("pt-BR").includes(termo),
    );
  }, [busca, programacao]);

  const configurados = colaboradores.filter(
    (colaborador) => colaborador.configuracao_ferias?.ativo_gestao_ferias,
  ).length;

  function abrirConfiguracao(colaborador: ColaboradorFerias) {
    const configuracao = colaborador.configuracao_ferias;

    setConfigForm({
      colaboradorId: colaborador.id,
      colaboradorNome: colaborador.nome,
      regimeContratacao: configuracao?.regime_contratacao ?? "clt",
      ativoGestaoFerias: configuracao?.ativo_gestao_ferias ?? true,
      dataAdmissaoReferencia:
        configuracao?.data_admissao_referencia ??
        colaborador.data_admissao ??
        "",
      diasDireitoPadrao: String(configuracao?.dias_direito_padrao ?? 30),
      observacao: configuracao?.observacao ?? "",
    });
    setConfigAberta(true);
  }

  function abrirPeriodo(periodo: FeriasPeriodoResumo) {
    setPeriodoForm({
      periodoId: periodo.periodo_id,
      colaboradorNome: periodo.colaborador_nome,
      aquisitivoInicio: periodo.aquisitivo_inicio,
      aquisitivoFim: periodo.aquisitivo_fim,
      concessivoInicio: periodo.concessivo_inicio,
      concessivoFim: periodo.concessivo_fim,
      diasDireito: String(periodo.dias_direito),
      motivoAjuste: "",
      observacao: periodo.observacao ?? "",
    });
    setPeriodoAberto(true);
  }

  function salvarConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        try {
          await salvarConfiguracaoFerias({
            colaboradorId: configForm.colaboradorId,
            regimeContratacao: configForm.regimeContratacao,
            ativoGestaoFerias: configForm.ativoGestaoFerias,
            dataAdmissaoReferencia:
              configForm.dataAdmissaoReferencia || undefined,
            diasDireitoPadrao: Number(configForm.diasDireitoPadrao || 30),
            observacao: configForm.observacao || undefined,
          });

          toast.success("Configuração de férias salva.");
          setConfigAberta(false);
          router.refresh();
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Erro ao salvar a configuração.",
          );
        }
      })();
    });
  }

  function salvarPeriodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        try {
          await atualizarPeriodoAquisitivo({
            periodoId: periodoForm.periodoId,
            aquisitivoInicio: periodoForm.aquisitivoInicio,
            aquisitivoFim: periodoForm.aquisitivoFim,
            concessivoInicio: periodoForm.concessivoInicio,
            concessivoFim: periodoForm.concessivoFim,
            diasDireito: Number(periodoForm.diasDireito || 30),
            motivoAjuste: periodoForm.motivoAjuste,
            observacao: periodoForm.observacao || undefined,
          });

          toast.success("Período aquisitivo atualizado.");
          setPeriodoAberto(false);
          router.refresh();
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Erro ao atualizar o período.",
          );
        }
      })();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <IndicadorCard
          titulo="Colaboradores configurados"
          valor={configurados}
          descricao="com gestão de férias ativa"
          icon={Users}
        />
        <IndicadorCard
          titulo="Períodos acompanhados"
          valor={programacao.length}
          descricao="aquisitivos e concessivos"
          icon={CalendarClock}
        />
        <IndicadorCard
          titulo="Alertas de vencimento"
          valor={alertas.length}
          descricao="faltando até 60 dias ou vencidos"
          icon={ShieldAlert}
        />
        <IndicadorCard
          titulo="Períodos concluídos"
          valor={
            programacao.filter((item) => item.situacao === "concluido").length
          }
          descricao="sem saldo pendente"
          icon={CheckCircle2}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alertas de vencimento</CardTitle>
          <CardDescription>
            Períodos com saldo disponível e prazo de concessão próximo ou já
            vencido.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alertas.length === 0 ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              Não há períodos com vencimento nos próximos 60 dias.
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {alertas.map((alerta) => (
                <div
                  key={alerta.periodo_id}
                  className="rounded-xl border border-amber-200 bg-amber-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-amber-950">
                        {alerta.colaborador_nome}
                      </p>
                      <p className="text-sm text-amber-800">
                        Período {formatarData(alerta.aquisitivo_inicio)} a{" "}
                        {formatarData(alerta.aquisitivo_fim)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={situacaoClasses[alerta.situacao]}
                    >
                      {situacaoLabels[alerta.situacao]}
                    </Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-amber-900">
                    <p>
                      <strong>Saldo:</strong> {alerta.saldo_aprovado} dias
                    </p>
                    <p>
                      <strong>Data-limite:</strong>{" "}
                      {formatarData(alerta.concessivo_fim)}
                    </p>
                    <p>
                      <strong>Usufruídos:</strong> {alerta.dias_usufruidos} dias
                    </p>
                    <p>
                      <strong>Programados:</strong> {alerta.dias_programados}{" "}
                      dias
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <CardTitle>Configuração dos colaboradores</CardTitle>
              <CardDescription>
                {podeEditar
                  ? "Marcieli e Juliana podem definir quem é CLT e ajustar a data de admissão usada no cálculo."
                  : "Consulta dos colaboradores e das configurações de férias cadastradas pelo RH."}
              </CardDescription>
            </div>
            <Input
              className="w-full lg:max-w-xs"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar colaborador"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[360px] overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Admissão</TableHead>
                  <TableHead>Regime</TableHead>
                  <TableHead>Gestão ativa</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colaboradores
                  .filter((colaborador) =>
                    colaborador.nome
                      .toLocaleLowerCase("pt-BR")
                      .includes(busca.trim().toLocaleLowerCase("pt-BR")),
                  )
                  .map((colaborador) => (
                    <TableRow key={colaborador.id}>
                      <TableCell>
                        <p className="font-medium">{colaborador.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {colaborador.equipe ?? "Equipe não informada"}
                        </p>
                      </TableCell>
                      <TableCell>
                        {formatarData(
                          colaborador.configuracao_ferias
                            ?.data_admissao_referencia ??
                            colaborador.data_admissao,
                        )}
                      </TableCell>
                      <TableCell>
                        {colaborador.configuracao_ferias?.regime_contratacao ??
                          "Não configurado"}
                      </TableCell>
                      <TableCell>
                        {colaborador.configuracao_ferias
                          ?.ativo_gestao_ferias ? (
                          <Badge className="bg-emerald-600">Ativa</Badge>
                        ) : (
                          <Badge variant="secondary">Inativa</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {podeEditar ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirConfiguracao(colaborador)}
                          >
                            <Settings2 className="h-4 w-4" />
                            Configurar
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Somente leitura
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programação consolidada de férias</CardTitle>
          <CardDescription>
            As datas e quantidades abaixo são calculadas automaticamente a
            partir das solicitações de férias aprovadas e pendentes no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[2100px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Admissão</TableHead>
                  <TableHead>Período aquisitivo</TableHead>
                  <TableHead>Prazo para concessão</TableHead>
                  <TableHead className="text-center">Dias de direito</TableHead>
                  <TableHead>Períodos aprovados para gozo</TableHead>
                  <TableHead className="text-center">Dias usufruídos</TableHead>
                  <TableHead className="text-center">Dias programados</TableHead>
                  <TableHead className="text-center">Dias pendentes</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Proximidade do vencimento</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programacaoFiltrada.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={14}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhum período aquisitivo foi gerado. Configure ao menos
                      um colaborador CLT acima.
                    </TableCell>
                  </TableRow>
                ) : (
                  programacaoFiltrada.map((periodo) => (
                    <TableRow key={periodo.periodo_id} className="align-top">
                      <TableCell className="min-w-48">
                        <p className="font-medium">
                          {periodo.colaborador_nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {periodo.numero_periodo}º período
                        </p>
                      </TableCell>
                      <TableCell>
                        {formatarData(periodo.data_admissao)}
                      </TableCell>
                      <TableCell className="min-w-52">
                        {formatarData(periodo.aquisitivo_inicio)} a{" "}
                        {formatarData(periodo.aquisitivo_fim)}
                      </TableCell>
                      <TableCell className="min-w-52">
                        {formatarData(periodo.concessivo_inicio)} a{" "}
                        {formatarData(periodo.concessivo_fim)}
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {periodo.dias_direito}
                      </TableCell>
                      <TableCell className="min-w-[330px]">
                        <PeriodosAprovadosCell
                          periodos={periodo.periodos_aprovados ?? []}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {periodo.dias_usufruidos}
                      </TableCell>
                      <TableCell className="text-center">
                        <p className="font-medium">{periodo.dias_programados}</p>
                        {periodo.dias_em_gozo > 0 ? (
                          <p className="text-xs text-sky-700">
                            {periodo.dias_em_gozo} em gozo
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-center">
                        <p>{periodo.dias_pendentes}</p>
                        {(periodo.periodos_pendentes ?? []).length > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            {(periodo.periodos_pendentes ?? []).length} solicitação(ões)
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="min-w-36">
                        <p className="font-semibold">
                          {periodo.saldo_aprovado} dias
                        </p>
                        {periodo.dias_pendentes > 0 ||
                        periodo.dias_vendidos_pendentes > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Projetado: {periodo.saldo_apos_pendencias} dias
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="min-w-48">
                        {formatarProximidade(periodo)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={situacaoClasses[periodo.situacao]}
                        >
                          {situacaoLabels[periodo.situacao]}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-64">
                        <ObservacoesPeriodo periodo={periodo} />
                      </TableCell>
                      <TableCell className="text-right">
                        {podeEditar ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => abrirPeriodo(periodo)}
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Somente leitura
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={configAberta} onOpenChange={setConfigAberta}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Configurar gestão de férias</DialogTitle>
            <DialogDescription>{configForm.colaboradorNome}</DialogDescription>
          </DialogHeader>

          <form onSubmit={salvarConfig} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Regime de contratação</Label>
                <Select
                  value={configForm.regimeContratacao}
                  onValueChange={(valor) =>
                    setConfigForm((atual) => ({
                      ...atual,
                      regimeContratacao:
                        valor as ConfigForm["regimeContratacao"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clt">CLT</SelectItem>
                    <SelectItem value="estagio">Estágio</SelectItem>
                    <SelectItem value="pj">PJ</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data de admissão de referência</Label>
                <Input
                  type="date"
                  value={configForm.dataAdmissaoReferencia}
                  onChange={(event) =>
                    setConfigForm((atual) => ({
                      ...atual,
                      dataAdmissaoReferencia: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Dias de direito padrão</Label>
                <Input
                  type="number"
                  min={0}
                  max={30}
                  value={configForm.diasDireitoPadrao}
                  onChange={(event) =>
                    setConfigForm((atual) => ({
                      ...atual,
                      diasDireitoPadrao: event.target.value,
                    }))
                  }
                />
              </div>

              <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={configForm.ativoGestaoFerias}
                  onChange={(event) =>
                    setConfigForm((atual) => ({
                      ...atual,
                      ativoGestaoFerias: event.target.checked,
                    }))
                  }
                />
                Incluir na gestão de férias
              </label>

              <div className="space-y-2 md:col-span-2">
                <Label>Observação</Label>
                <Textarea
                  value={configForm.observacao}
                  onChange={(event) =>
                    setConfigForm((atual) => ({
                      ...atual,
                      observacao: event.target.value,
                    }))
                  }
                  placeholder="Exceções ou informações relevantes"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfigAberta(false)}
              >
                Fechar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar configuração"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={periodoAberto} onOpenChange={setPeriodoAberto}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar período aquisitivo</DialogTitle>
            <DialogDescription>{periodoForm.colaboradorNome}</DialogDescription>
          </DialogHeader>

          <form onSubmit={salvarPeriodo} className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Alteração excepcional
              </div>
              <p className="mt-1">
                O motivo é obrigatório e a alteração ficará registrada no
                histórico.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <CampoData
                label="Início aquisitivo"
                value={periodoForm.aquisitivoInicio}
                onChange={(valor) =>
                  setPeriodoForm((atual) => ({
                    ...atual,
                    aquisitivoInicio: valor,
                  }))
                }
              />
              <CampoData
                label="Fim aquisitivo"
                value={periodoForm.aquisitivoFim}
                onChange={(valor) =>
                  setPeriodoForm((atual) => ({
                    ...atual,
                    aquisitivoFim: valor,
                  }))
                }
              />
              <CampoData
                label="Início concessivo"
                value={periodoForm.concessivoInicio}
                onChange={(valor) =>
                  setPeriodoForm((atual) => ({
                    ...atual,
                    concessivoInicio: valor,
                  }))
                }
              />
              <CampoData
                label="Fim concessivo/data-limite"
                value={periodoForm.concessivoFim}
                onChange={(valor) =>
                  setPeriodoForm((atual) => ({
                    ...atual,
                    concessivoFim: valor,
                  }))
                }
              />

              <div className="space-y-2">
                <Label>Dias de direito</Label>
                <Input
                  type="number"
                  min={0}
                  max={30}
                  value={periodoForm.diasDireito}
                  onChange={(event) =>
                    setPeriodoForm((atual) => ({
                      ...atual,
                      diasDireito: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Motivo da alteração</Label>
                <Input
                  value={periodoForm.motivoAjuste}
                  onChange={(event) =>
                    setPeriodoForm((atual) => ({
                      ...atual,
                      motivoAjuste: event.target.value,
                    }))
                  }
                  required
                  placeholder="Explique por que o período foi alterado"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Observação</Label>
                <Textarea
                  value={periodoForm.observacao}
                  onChange={(event) =>
                    setPeriodoForm((atual) => ({
                      ...atual,
                      observacao: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPeriodoAberto(false)}
              >
                Fechar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar alteração"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PeriodosAprovadosCell({
  periodos,
}: {
  periodos: FeriasPeriodoGozo[];
}) {
  if (!periodos?.length) {
    return <span className="text-sm text-muted-foreground">Nenhum</span>;
  }

  return (
    <div className="space-y-2">
      {periodos.map((periodo) => (
        <div key={periodo.id} className="rounded-md border px-2.5 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">
              {formatarData(periodo.data_inicio)} a{" "}
              {formatarData(periodo.data_fim)}
            </span>
            <Badge variant="secondary">{periodo.dias_corridos} dias</Badge>
            <Badge
              variant="outline"
              className={gozoSituacaoClasses[periodo.situacao_gozo]}
            >
              {gozoSituacaoLabels[periodo.situacao_gozo]}
            </Badge>
            {periodo.origem === "coletiva" ? (
              <Badge variant="outline">Coletivas</Badge>
            ) : null}
          </div>
          {periodo.observacao ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {periodo.observacao}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ObservacoesPeriodo({
  periodo,
}: {
  periodo: FeriasPeriodoResumo;
}) {
  const possuiObservacao = Boolean(
    periodo.observacao ||
      periodo.motivo_ajuste ||
      periodo.solicitacoes_sem_vinculo > 0,
  );

  if (!possuiObservacao) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  return (
    <div className="space-y-1 text-sm">
      {periodo.observacao ? <p>{periodo.observacao}</p> : null}
      {periodo.motivo_ajuste ? (
        <p className="text-xs text-muted-foreground">
          Ajuste: {periodo.motivo_ajuste}
        </p>
      ) : null}
      {periodo.solicitacoes_sem_vinculo > 0 ? (
        <p className="flex items-start gap-1 text-xs font-medium text-amber-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {periodo.solicitacoes_sem_vinculo} solicitação(ões) de férias ainda
          sem vínculo com um período aquisitivo.
        </p>
      ) : null}
    </div>
  );
}

function formatarProximidade(periodo: FeriasPeriodoResumo) {
  if (periodo.situacao === "concluido") {
    return "Concluído";
  }

  if (periodo.dias_para_vencer < 0) {
    const dias = Math.abs(periodo.dias_para_vencer);
    return `Vencido há ${dias} dia${dias === 1 ? "" : "s"}`;
  }

  if (periodo.dias_para_vencer === 0) {
    return "Vence hoje";
  }

  return `Vence em ${periodo.dias_para_vencer} dias`;
}

function IndicadorCard({
  titulo,
  valor,
  descricao,
  icon: Icon,
}: {
  titulo: string;
  valor: number;
  descricao: string;
  icon: typeof Users;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{titulo}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{valor}</div>
        <p className="text-xs text-muted-foreground">{descricao}</p>
      </CardContent>
    </Card>
  );
}

function CampoData({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </div>
  );
}

function formatarData(data: string | null | undefined) {
  if (!data) {
    return "-";
  }

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}
