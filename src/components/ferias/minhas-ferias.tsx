"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import {
  cancelarMinhaSolicitacaoFerias,
  criarMinhaSolicitacaoFerias,
  type FeriasPeriodoResumo,
  type FeriasStatus,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Colaborador = {
  id: string;
  nome: string;
  email: string | null;
  status: string;
  cargo: string | null;
  equipe: string | null;
  data_admissao: string | null;
};

type Solicitacao = {
  id: string;
  colaborador_id: string;
  colaborador_nome: string;
  equipe: string | null;
  cargo: string | null;
  data_inicio: string;
  data_fim: string;
  dias_corridos: number;
  tipo: string;
  status: FeriasStatus;
  observacao: string | null;
  motivo_reprovacao: string | null;
};

type Resumo = {
  total: number;
  pendentes: number;
  aprovadas: number;
  reprovadas: number;
  canceladas: number;
};

type MinhasFeriasProps = {
  colaborador: Colaborador;
  solicitacoes: Solicitacao[];
  resumo: Resumo;
  periodosDisponiveis: FeriasPeriodoResumo[];
};

type Formulario = {
  periodoAquisitivoId: string;
  dataInicio: string;
  dataFim: string;
  periodoAquisitivoInicio: string;
  periodoAquisitivoFim: string;
  diasVendidos: string;
  adiantamento13: boolean;
  observacao: string;
};

const formularioInicial: Formulario = {
  periodoAquisitivoId: "",
  dataInicio: "",
  dataFim: "",
  periodoAquisitivoInicio: "",
  periodoAquisitivoFim: "",
  diasVendidos: "0",
  adiantamento13: false,
  observacao: "",
};

const statusLabels: Record<FeriasStatus, string> = {
  pendente: "Pendente",
  aprovada: "Aprovada",
  reprovada: "Reprovada",
  cancelada: "Cancelada",
};

const statusClasses: Record<FeriasStatus, string> = {
  pendente: "border-amber-200 bg-amber-50 text-amber-700",
  aprovada: "border-emerald-200 bg-emerald-50 text-emerald-700",
  reprovada: "border-rose-200 bg-rose-50 text-rose-700",
  cancelada: "border-slate-200 bg-slate-50 text-slate-600",
};

export default function MinhasFerias({
  colaborador,
  solicitacoes,
  resumo,
  periodosDisponiveis,
}: MinhasFeriasProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [form, setForm] = useState<Formulario>(formularioInicial);

  function atualizarForm<K extends keyof Formulario>(
    campo: K,
    valor: Formulario[K],
  ) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function criarSolicitacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        try {
          await criarMinhaSolicitacaoFerias({
            periodoAquisitivoId: form.periodoAquisitivoId || undefined,
            dataInicio: form.dataInicio,
            dataFim: form.dataFim,
            periodoAquisitivoInicio: form.periodoAquisitivoInicio || undefined,
            periodoAquisitivoFim: form.periodoAquisitivoFim || undefined,
            diasVendidos: Number(form.diasVendidos || 0),
            adiantamento13: form.adiantamento13,
            observacao: form.observacao || undefined,
          });

          toast.success("Solicitação de férias enviada para análise.");
          setForm(formularioInicial);
          setDialogAberto(false);
          router.refresh();
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Erro ao enviar a solicitação.",
          );
        }
      })();
    });
  }

  function cancelarSolicitacao(solicitacaoId: string) {
    const confirmado = window.confirm(
      "Tem certeza que deseja cancelar esta solicitação pendente?",
    );

    if (!confirmado) {
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          await cancelarMinhaSolicitacaoFerias(solicitacaoId);
          toast.success("Solicitação cancelada.");
          router.refresh();
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Erro ao cancelar a solicitação.",
          );
        }
      })();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Solicitação de Férias
          </h1>
          <p className="text-sm text-muted-foreground">
            Solicite suas férias e acompanhe somente os seus próprios pedidos.
          </p>
        </div>

        <Button onClick={() => setDialogAberto(true)}>
          <Plus className="h-4 w-4" />
          Nova solicitação
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-1 p-5">
          <p className="font-medium">{colaborador.nome}</p>
          <p className="text-sm text-muted-foreground">
            {colaborador.cargo ?? "Cargo não informado"}
          </p>
          <p className="text-sm text-muted-foreground">
            {colaborador.equipe ?? "Equipe não informada"}
          </p>
        </CardContent>
      </Card>

      {periodosDisponiveis.length > 0 && (
        <Card className="border-sky-200 bg-sky-50/60">
          <CardHeader>
            <CardTitle className="text-base">
              Saldo de férias disponível
            </CardTitle>
            <CardDescription>
              O saldo considera solicitações aprovadas e pendentes vinculadas
              aos períodos aquisitivos.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {periodosDisponiveis.map((periodo) => (
              <div
                key={periodo.periodo_id}
                className="rounded-lg border bg-background p-3"
              >
                <p className="font-medium">
                  {formatarData(periodo.aquisitivo_inicio)} a{" "}
                  {formatarData(periodo.aquisitivo_fim)}
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {periodo.saldo_apos_pendencias} dias
                </p>
                <p className="text-xs text-muted-foreground">
                  Prazo para concessão: {formatarData(periodo.concessivo_fim)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <ResumoCard
          title="Total"
          value={resumo.total}
          description="solicitações"
          icon={CalendarDays}
        />
        <ResumoCard
          title="Pendentes"
          value={resumo.pendentes}
          description="aguardando análise"
          icon={Clock3}
        />
        <ResumoCard
          title="Aprovadas"
          value={resumo.aprovadas}
          description="confirmadas"
          icon={CheckCircle2}
        />
        <ResumoCard
          title="Reprovadas"
          value={resumo.reprovadas}
          description="não aprovadas"
          icon={XCircle}
        />
        <ResumoCard
          title="Canceladas"
          value={resumo.canceladas}
          description="canceladas"
          icon={Ban}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Minhas solicitações</CardTitle>
          <CardDescription>
            Apenas as suas solicitações de férias são exibidas nesta tela.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {solicitacoes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Você ainda não possui solicitações de férias.
                    </TableCell>
                  </TableRow>
                ) : (
                  solicitacoes.map((solicitacao) => (
                    <TableRow key={solicitacao.id}>
                      <TableCell>
                        {formatarData(solicitacao.data_inicio)}
                      </TableCell>
                      <TableCell>
                        {formatarData(solicitacao.data_fim)}
                      </TableCell>
                      <TableCell>{solicitacao.dias_corridos}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusClasses[solicitacao.status]}
                        >
                          {statusLabels[solicitacao.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[360px] whitespace-normal">
                        {solicitacao.motivo_reprovacao ||
                          solicitacao.observacao ||
                          "Sem observação"}
                      </TableCell>
                      <TableCell className="text-right">
                        {solicitacao.status === "pendente" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => cancelarSolicitacao(solicitacao.id)}
                          >
                            Cancelar
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Sem ações
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

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova solicitação de férias</DialogTitle>
            <DialogDescription>
              A solicitação será vinculada automaticamente ao seu usuário.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={criarSolicitacao} className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Regras de início e fracionamento
              </div>
              <p className="mt-1">
                A contagem é feita em dias corridos. O início na sexta-feira é
                bloqueado; o início na quinta-feira ficará sujeito à análise
                antes da aprovação.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {periodosDisponiveis.length > 0 && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Período aquisitivo</Label>
                  <Select
                    value={form.periodoAquisitivoId}
                    onValueChange={(valor) =>
                      atualizarForm("periodoAquisitivoId", valor)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o período e o saldo" />
                    </SelectTrigger>
                    <SelectContent>
                      {periodosDisponiveis.map((periodo) => (
                        <SelectItem
                          key={periodo.periodo_id}
                          value={periodo.periodo_id}
                        >
                          {formatarData(periodo.aquisitivo_inicio)} a{" "}
                          {formatarData(periodo.aquisitivo_fim)} — saldo{" "}
                          {periodo.saldo_apos_pendencias} dias
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Data de início</Label>
                <Input
                  type="date"
                  value={form.dataInicio}
                  onChange={(event) =>
                    atualizarForm("dataInicio", event.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Data de fim</Label>
                <Input
                  type="date"
                  value={form.dataFim}
                  onChange={(event) =>
                    atualizarForm("dataFim", event.target.value)
                  }
                  required
                />
              </div>

              {periodosDisponiveis.length === 0 && (
                <>
                  <div className="space-y-2">
                    <Label>Início do período aquisitivo</Label>
                    <Input
                      type="date"
                      value={form.periodoAquisitivoInicio}
                      onChange={(event) =>
                        atualizarForm(
                          "periodoAquisitivoInicio",
                          event.target.value,
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fim do período aquisitivo</Label>
                    <Input
                      type="date"
                      value={form.periodoAquisitivoFim}
                      onChange={(event) =>
                        atualizarForm(
                          "periodoAquisitivoFim",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Dias vendidos</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={form.diasVendidos}
                  onChange={(event) =>
                    atualizarForm("diasVendidos", event.target.value)
                  }
                />
              </div>

              <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.adiantamento13}
                  onChange={(event) =>
                    atualizarForm("adiantamento13", event.target.checked)
                  }
                />
                Solicitar adiantamento de 13º
              </label>

              <div className="space-y-2 md:col-span-2">
                <Label>Observação</Label>
                <Textarea
                  value={form.observacao}
                  onChange={(event) =>
                    atualizarForm("observacao", event.target.value)
                  }
                  placeholder="Inclua uma observação, se necessário"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogAberto(false)}
              >
                Fechar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Enviando..." : "Enviar solicitação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ResumoCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function formatarData(data: string) {
  if (!data) {
    return "-";
  }

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}
