"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import {
  createIndicadorDesempenho,
  getColaboradoresIndicadoresBySetor,
  getProjetosIndicadores,
  getSetoresIndicadores,
} from "@/app/actions/indicadores"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { toast } from "sonner"

type Setor = {
  id: string
  nome: string
}

type Projeto = {
  id: string | number
  code: string
  name: string
  status?: string | null
}

type Colaborador = {
  id: string
  nome: string
  departamento_nome?: string | null
  status?: string | null
}

type IndicadoresFormValues = {
  setor_id: string
  colaborador_id: string
  projeto_id: string
  codigo_projeto: string
  entrega_avaliada: string
  data_entrega: string
  data_revisao: string
  ies_aprovado_primeira: string
  ip_no_prazo: string
  clareza_estrutura: string
  profundidade_rigor: string
  alinhamento_demanda: string
  forma_profissionalismo: string
  pontos_fortes: string
  pontos_fracos: string
  comentario_geral: string
}

const opcoesNotas = [
  { value: "1", titulo: "1", descricao: "Não atendeu" },
  { value: "2", titulo: "2", descricao: "Atendeu parcialmente" },
  { value: "3", titulo: "3", descricao: "Atendeu" },
  { value: "4", titulo: "4", descricao: "Atendeu plenamente" },
  { value: "5", titulo: "5", descricao: "Excedeu expectativas" },
]

const opcoesBinarias = [
  { value: "true", titulo: "Sim" },
  { value: "false", titulo: "Não" },
]

type CampoNotaProps = {
  titulo: string
  descricao: string
  value: string
  onChange: (value: string) => void
  error?: string
  name: string
}

function CampoNota({
  titulo,
  descricao,
  value,
  onChange,
  error,
  name,
}: CampoNotaProps) {
  return (
    <div className="rounded-2xl border bg-background p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold">{titulo}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="grid grid-cols-1 gap-3 md:grid-cols-5"
      >
        {opcoesNotas.map((opcao) => {
          const id = `${name}-${opcao.value}`

          return (
            <label
              key={opcao.value}
              htmlFor={id}
              className="flex min-h-[88px] cursor-pointer flex-col items-start justify-between rounded-xl border p-4 transition hover:bg-muted/40"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value={opcao.value} id={id} />
                <span className="font-semibold">{opcao.titulo}</span>
              </div>

              <span className="text-sm text-muted-foreground">
                {opcao.descricao}
              </span>
            </label>
          )
        })}
      </RadioGroup>

      {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
    </div>
  )
}

type CampoBinarioProps = {
  titulo: string
  descricao: string
  value: string
  onChange: (value: string) => void
  error?: string
  name: string
}

function CampoBinario({
  titulo,
  descricao,
  value,
  onChange,
  error,
  name,
}: CampoBinarioProps) {
  return (
    <div className="rounded-2xl border bg-background p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-semibold">{titulo}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="grid grid-cols-1 gap-3 md:grid-cols-2"
      >
        {opcoesBinarias.map((opcao) => {
          const id = `${name}-${opcao.value}`

          return (
            <label
              key={opcao.value}
              htmlFor={id}
              className="flex min-h-[72px] cursor-pointer items-center gap-3 rounded-xl border p-4 transition hover:bg-muted/40"
            >
              <RadioGroupItem value={opcao.value} id={id} />
              <span className="font-medium">{opcao.titulo}</span>
            </label>
          )
        })}
      </RadioGroup>

      {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
    </div>
  )
}

export default function IndicadoresForm() {
  const [openProjeto, setOpenProjeto] = useState(false)
  const [setores, setSetores] = useState<Setor[]>([])
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [isPending, startTransition] = useTransition()
  const [isLoadingFiltros, setIsLoadingFiltros] = useState(true)

  const [formData, setFormData] = useState<IndicadoresFormValues>({
    setor_id: "",
    colaborador_id: "",
    projeto_id: "",
    codigo_projeto: "",
    entrega_avaliada: "",
    data_entrega: "",
    data_revisao: "",
    ies_aprovado_primeira: "",
    ip_no_prazo: "",
    clareza_estrutura: "",
    profundidade_rigor: "",
    alinhamento_demanda: "",
    forma_profissionalismo: "",
    pontos_fortes: "",
    pontos_fracos: "",
    comentario_geral: "",
  })

  const [errors, setErrors] = useState<
    Partial<Record<keyof IndicadoresFormValues, string>>
  >({})

  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoadingFiltros(true)

        const [setoresData, projetosData] = await Promise.all([
          getSetoresIndicadores(),
          getProjetosIndicadores(),
        ])

        setSetores(setoresData ?? [])
        setProjetos(projetosData ?? [])
      } catch (error) {
        console.error(error)
        toast.error("Não foi possível carregar os filtros do formulário.")
      } finally {
        setIsLoadingFiltros(false)
      }
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    async function loadColaboradoresBySetor() {
      try {
        if (!formData.setor_id) {
          setColaboradores([])
          return
        }

        const data = await getColaboradoresIndicadoresBySetor(formData.setor_id)
        setColaboradores(data ?? [])
      } catch (error) {
        console.error(error)
        toast.error("Não foi possível carregar os colaboradores do setor.")
      }
    }

    loadColaboradoresBySetor()
  }, [formData.setor_id])

  const projetoSelecionado = useMemo(() => {
    return projetos.find((item) => String(item.id) === formData.projeto_id)
  }, [projetos, formData.projeto_id])

  const updateField = <K extends keyof IndicadoresFormValues>(
    field: K,
    value: IndicadoresFormValues[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }))
  }

  function handleSetorChange(value: string) {
    setFormData((prev) => ({
      ...prev,
      setor_id: value,
      colaborador_id: "",
    }))

    setErrors((prev) => ({
      ...prev,
      setor_id: "",
      colaborador_id: "",
    }))
  }

  function handleColaboradorChange(value: string) {
    setFormData((prev) => ({
      ...prev,
      colaborador_id: value,
    }))

    setErrors((prev) => ({
      ...prev,
      colaborador_id: "",
    }))
  }

  function handleProjetoChange(value: string) {
    const projeto = projetos.find((item) => String(item.id) === value)

    setFormData((prev) => ({
      ...prev,
      projeto_id: value,
      codigo_projeto: projeto?.code ?? "",
    }))

    setErrors((prev) => ({
      ...prev,
      projeto_id: "",
      codigo_projeto: "",
    }))
  }

  function validateForm() {
    const newErrors: Partial<Record<keyof IndicadoresFormValues, string>> = {}

    if (!formData.setor_id) {
      newErrors.setor_id = "Selecione o setor."
    }

    if (!formData.colaborador_id) {
      newErrors.colaborador_id = "Selecione o colaborador."
    }

    if (!formData.projeto_id) {
      newErrors.projeto_id = "Selecione o projeto."
    }

    if (!formData.codigo_projeto.trim()) {
      newErrors.codigo_projeto = "Selecione o projeto."
    }

    if (!formData.entrega_avaliada.trim()) {
      newErrors.entrega_avaliada = "Informe a entrega avaliada."
    }

    if (!formData.data_entrega) {
      newErrors.data_entrega = "Informe a data de entrega."
    }

    if (!formData.data_revisao) {
      newErrors.data_revisao = "Informe a data de revisão."
    }

    if (!formData.ies_aprovado_primeira) {
      newErrors.ies_aprovado_primeira = "Selecione Sim ou Não."
    }

    if (!formData.ip_no_prazo) {
      newErrors.ip_no_prazo = "Selecione Sim ou Não."
    }

    if (!formData.clareza_estrutura) {
      newErrors.clareza_estrutura = "Selecione uma nota."
    }

    if (!formData.profundidade_rigor) {
      newErrors.profundidade_rigor = "Selecione uma nota."
    }

    if (!formData.alinhamento_demanda) {
      newErrors.alinhamento_demanda = "Selecione uma nota."
    }

    if (!formData.forma_profissionalismo) {
      newErrors.forma_profissionalismo = "Selecione uma nota."
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Preencha os campos obrigatórios.")
      return
    }

    startTransition(async () => {
      try {
        await createIndicadorDesempenho({
          colaborador_id: formData.colaborador_id,
          codigo_projeto: formData.codigo_projeto,
          entrega_avaliada: formData.entrega_avaliada,
          data_entrega: formData.data_entrega,
          data_revisao: formData.data_revisao,
          ies_aprovado_primeira: formData.ies_aprovado_primeira === "true",
          ip_no_prazo: formData.ip_no_prazo === "true",
          clareza_estrutura: Number(formData.clareza_estrutura),
          profundidade_rigor: Number(formData.profundidade_rigor),
          alinhamento_demanda: Number(formData.alinhamento_demanda),
          forma_profissionalismo: Number(formData.forma_profissionalismo),
          pontos_fortes: formData.pontos_fortes,
          pontos_fracos: formData.pontos_fracos,
          comentario_geral: formData.comentario_geral,
        })

        toast.success("Avaliação salva com sucesso.")

        setFormData({
          setor_id: "",
          colaborador_id: "",
          projeto_id: "",
          codigo_projeto: "",
          entrega_avaliada: "",
          data_entrega: "",
          data_revisao: "",
          ies_aprovado_primeira: "",
          ip_no_prazo: "",
          clareza_estrutura: "",
          profundidade_rigor: "",
          alinhamento_demanda: "",
          forma_profissionalismo: "",
          pontos_fortes: "",
          pontos_fracos: "",
          comentario_geral: "",
        })

        setColaboradores([])
        setErrors({})
      } catch (error) {
        console.error(error)
        toast.error("Erro ao salvar avaliação.")
      }
    })
  }

  return (
    <div className="w-full pb-8">
      <Card className="rounded-2xl border bg-card p-4 shadow-sm md:p-6">
        <div className="mb-8 border-b pb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Indicadores de Desempenho
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Avaliação de produtos técnicos em formato de múltipla escolha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-2xl border bg-card p-5 md:p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Informações gerais</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Selecione o setor, o colaborador e o projeto da avaliação.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="setor_id">Equipe / setor</Label>
                <select
                  id="setor_id"
                  value={formData.setor_id}
                  onChange={(e) => handleSetorChange(e.target.value)}
                  disabled={isLoadingFiltros}
                  className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                >
                  <option value="">
                    {isLoadingFiltros
                      ? "Carregando setores..."
                      : "Selecione o setor"}
                  </option>
                  {setores.map((setor) => (
                    <option key={setor.id} value={setor.id}>
                      {setor.nome}
                    </option>
                  ))}
                </select>
                {errors.setor_id ? (
                  <p className="text-sm text-red-500">{errors.setor_id}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="colaborador_id">Colaborador avaliado</Label>
                <select
                  id="colaborador_id"
                  value={formData.colaborador_id}
                  onChange={(e) => handleColaboradorChange(e.target.value)}
                  disabled={!formData.setor_id}
                  className="flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:bg-muted"
                >
                  <option value="">
                    {!formData.setor_id
                      ? "Selecione primeiro o setor"
                      : "Selecione o colaborador"}
                  </option>
                  {colaboradores.map((colaborador) => (
                    <option key={colaborador.id} value={colaborador.id}>
                      {colaborador.nome}
                    </option>
                  ))}
                </select>
                {errors.colaborador_id ? (
                  <p className="text-sm text-red-500">
                    {errors.colaborador_id}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="projeto_id">Projeto</Label>

                <Popover open={openProjeto} onOpenChange={setOpenProjeto}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={openProjeto}
                      disabled={isLoadingFiltros}
                      className="h-11 w-full justify-between rounded-xl px-3 font-normal"
                    >
                      {formData.projeto_id
                        ? `${projetoSelecionado?.code ?? ""} - ${projetoSelecionado?.name ?? ""}`
                        : isLoadingFiltros
                          ? "Carregando projetos..."
                          : "Selecione o projeto"}

                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar projeto por código ou nome..." />
                      <CommandList>
                        <CommandEmpty>Nenhum projeto encontrado.</CommandEmpty>
                        <CommandGroup>
                          {projetos.map((projeto) => (
                            <CommandItem
                              key={String(projeto.id)}
                              value={`${projeto.code} ${projeto.name}`}
                              onSelect={() => {
                                handleProjetoChange(String(projeto.id))
                                setOpenProjeto(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.projeto_id === String(projeto.id)
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {projeto.code} - {projeto.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {errors.projeto_id ? (
                  <p className="text-sm text-red-500">{errors.projeto_id}</p>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="codigo_projeto">Código do projeto</Label>
                <Input
                  id="codigo_projeto"
                  value={projetoSelecionado?.code ?? formData.codigo_projeto}
                  readOnly
                  className="h-11 rounded-xl bg-muted/40"
                />
                {errors.codigo_projeto ? (
                  <p className="text-sm text-red-500">
                    {errors.codigo_projeto}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="entrega_avaliada">
                  Entrega avaliada{" "}
                  <span className="text-muted-foreground fonr-normal">
                    (conforme nomeada no Planner)
                  </span>
                </Label>
                <Input
                  id="entrega_avaliada"
                  placeholder="Ex.: Relatório técnico, memorial, planilha, mapa, apresentação..."
                  value={formData.entrega_avaliada}
                  onChange={(e) =>
                    updateField("entrega_avaliada", e.target.value)
                  }
                  className="h-11 rounded-xl"
                />
                {errors.entrega_avaliada ? (
                  <p className="text-sm text-red-500">
                    {errors.entrega_avaliada}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-5 md:col-span-2 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="data_entrega">Data de entrega</Label>
                  <Input
                    id="data_entrega"
                    type="date"
                    value={formData.data_entrega}
                    onChange={(e) =>
                      updateField("data_entrega", e.target.value)
                    }
                    className="h-11 rounded-xl"
                  />
                  {errors.data_entrega ? (
                    <p className="text-sm text-red-500">
                      {errors.data_entrega}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_revisao">Data de revisão</Label>
                  <Input
                    id="data_revisao"
                    type="date"
                    value={formData.data_revisao}
                    onChange={(e) =>
                      updateField("data_revisao", e.target.value)
                    }
                    className="h-11 rounded-xl"
                  />
                  {errors.data_revisao ? (
                    <p className="text-sm text-red-500">
                      {errors.data_revisao}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold">Indicadores binários</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Marque Sim ou Não para esforço e prazo.
              </p>
            </div>

            <CampoBinario
              name="ies_aprovado_primeira"
              titulo="IES • A entrega foi aprovada na primeira submissão?"
              descricao="Considere se a entrega foi aprovada sem retrabalho significativo."
              value={formData.ies_aprovado_primeira}
              onChange={(value) => updateField("ies_aprovado_primeira", value)}
              error={errors.ies_aprovado_primeira}
            />

            <CampoBinario
              name="ip_no_prazo"
              titulo="IP • A entrega foi concluída dentro do prazo combinado?"
              descricao="Use o prazo efetivamente combinado para a entrega avaliada."
              value={formData.ip_no_prazo}
              onChange={(value) => updateField("ip_no_prazo", value)}
              error={errors.ip_no_prazo}
            />
          </section>

          <section className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold">Critérios de avaliação</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Escolha uma nota para cada critério.
              </p>
            </div>

            <CampoNota
              name="clareza_estrutura"
              titulo="1. Clareza e Estrutura"
              descricao="O documento é bem organizado, lógico e de fácil compreensão?"
              value={formData.clareza_estrutura}
              onChange={(value) => updateField("clareza_estrutura", value)}
              error={errors.clareza_estrutura}
            />

            <CampoNota
              name="profundidade_rigor"
              titulo="2. Profundidade e Rigor"
              descricao="A análise foi precisa, com dados confiáveis e sem erros conceituais?"
              value={formData.profundidade_rigor}
              onChange={(value) => updateField("profundidade_rigor", value)}
              error={errors.profundidade_rigor}
            />

            <CampoNota
              name="alinhamento_demanda"
              titulo="3. Alinhamento à Demanda do Cliente"
              descricao="O produto entregue atende ao que foi previsto e gera valor para o cliente?"
              value={formData.alinhamento_demanda}
              onChange={(value) => updateField("alinhamento_demanda", value)}
              error={errors.alinhamento_demanda}
            />

            <CampoNota
              name="forma_profissionalismo"
              titulo="4. Forma e Profissionalismo"
              descricao="Formatação, gramática e apresentação estão no nível esperado?"
              value={formData.forma_profissionalismo}
              onChange={(value) => updateField("forma_profissionalismo", value)}
              error={errors.forma_profissionalismo}
            />
          </section>

          <section className="rounded-2xl border bg-card p-5 md:p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Comentários</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Registre observações complementares da avaliação.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="pontos_fortes">Pontos fortes</Label>
                <Textarea
                  id="pontos_fortes"
                  placeholder="Descreva os pontos fortes observados"
                  className="min-h-28 rounded-xl"
                  value={formData.pontos_fortes}
                  onChange={(e) => updateField("pontos_fortes", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pontos_fracos">Pontos fracos</Label>
                <Textarea
                  id="pontos_fracos"
                  placeholder="Descreva os pontos de melhoria"
                  className="min-h-28 rounded-xl"
                  value={formData.pontos_fracos}
                  onChange={(e) => updateField("pontos_fracos", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comentario_geral">Comentário geral</Label>
                <Textarea
                  id="comentario_geral"
                  placeholder="Observações adicionais"
                  className="min-h-28 rounded-xl"
                  value={formData.comentario_geral}
                  onChange={(e) =>
                    updateField("comentario_geral", e.target.value)
                  }
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 min-w-44 rounded-xl px-6"
            >
              {isPending ? "Salvando..." : "Salvar avaliação"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}