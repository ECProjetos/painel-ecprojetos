"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  PortfolioFormInput,
  PortfolioProjectDetails,
  PortfolioTag,
  savePortfolioProject,
} from "@/app/actions/portfolio"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type PortfolioFormProps = {
  project: PortfolioProjectDetails
  tags: PortfolioTag[]
}

function numberToInput(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return ""
  }

  return String(value)
}

export function PortfolioForm({ project, tags }: PortfolioFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const portfolio = project.portfolio

  const [form, setForm] = useState({
    executive_summary: portfolio?.executive_summary ?? "",
    challenge: portfolio?.challenge ?? "",
    solution: portfolio?.solution ?? "",
    results: portfolio?.results ?? "",
    quantitative_results: portfolio?.quantitative_results ?? "",
    associated_investment: numberToInput(portfolio?.associated_investment),
    capex: numberToInput(portfolio?.capex),
    currency: portfolio?.currency ?? "BRL",
    completion_date: portfolio?.completion_date ?? "",
    notes: portfolio?.notes ?? "",
    allow_external_export: portfolio?.allow_external_export ?? false,
    show_values_in_pdf: portfolio?.show_values_in_pdf ?? false,

    tag_ids: project.tag_ids,
  })

  function updateField(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function toggleTag(tagId: number) {
    setForm((current) => ({
      ...current,

      tag_ids: current.tag_ids.includes(tagId)
        ? current.tag_ids.filter((id) => id !== tagId)
        : [...current.tag_ids, tagId],
    }))
  }

  const assuntoTags = tags.filter((tag) => tag.category === "assunto")

  const setorTags = tags.filter((tag) => tag.category === "setor")
  function parseOptionalNumber(value: string) {
    const normalized = value.trim().replace(",", ".")

    if (normalized === "") {
      return null
    }

    const number = Number(normalized)

    if (Number.isNaN(number)) {
      return null
    }

    return number
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const data: PortfolioFormInput = {
      executive_summary: form.executive_summary,
      challenge: form.challenge,
      solution: form.solution,
      results: form.results,
      quantitative_results: form.quantitative_results,
      associated_investment: parseOptionalNumber(form.associated_investment),
      capex: parseOptionalNumber(form.capex),
      currency: form.currency,
      completion_date: form.completion_date,
      notes: form.notes,
      allow_external_export: form.allow_external_export,
      show_values_in_pdf: form.show_values_in_pdf,

      tag_ids: form.tag_ids,
    }

    startTransition(async () => {
      try {
        await savePortfolioProject(project.id, data)

        toast.success(
          project.portfolio
            ? "Portfólio atualizado com sucesso."
            : "Projeto adicionado ao portfólio com sucesso.",
        )

        router.push("/portfolio")
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível salvar o portfólio.",
        )
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* IDENTIFICAÇÃO DO PROJETO */}
      <section className="space-y-4 rounded-xl border p-5">
        <div>
          <h2 className="text-lg font-semibold">Informações do projeto</h2>

          <p className="text-sm text-muted-foreground">
            Estes dados vêm do cadastro original do projeto.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Código</Label>

            <Input value={project.code ?? ""} disabled />
          </div>

          <div className="space-y-2">
            <Label>Nome do projeto</Label>

            <Input value={project.name} disabled />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Descrição</Label>

            <Textarea
              value={project.description ?? ""}
              disabled
              className="min-h-[90px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Horas estimadas</Label>

            <Input
              value={
                project.estimated_hours === null
                  ? ""
                  : String(project.estimated_hours)
              }
              disabled
            />
          </div>
        </div>
      </section>

      {/* CONTEÚDO DO CASE */}
      <section className="space-y-5 rounded-xl border p-5">
        <div>
          <h2 className="text-lg font-semibold">Case do projeto</h2>

          <p className="text-sm text-muted-foreground">
            Registre as informações que serão utilizadas na apresentação do
            projeto no portfólio.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="executive_summary">Resumo executivo</Label>

          <Textarea
            id="executive_summary"
            className="min-h-[110px]"
            placeholder="Apresente de forma resumida o projeto, seu contexto e sua relevância."
            value={form.executive_summary}
            onChange={(event) =>
              updateField("executive_summary", event.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="challenge">Desafio / contexto</Label>

          <Textarea
            id="challenge"
            className="min-h-[130px]"
            placeholder="Qual era o problema, desafio ou necessidade do cliente?"
            value={form.challenge}
            onChange={(event) => updateField("challenge", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="solution">Solução desenvolvida</Label>

          <Textarea
            id="solution"
            className="min-h-[130px]"
            placeholder="Descreva a abordagem, estudos, análises ou soluções desenvolvidas pela EC Projetos."
            value={form.solution}
            onChange={(event) => updateField("solution", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="results">Resultados alcançados</Label>

          <Textarea
            id="results"
            className="min-h-[130px]"
            placeholder="Descreva os principais resultados e benefícios alcançados."
            value={form.results}
            onChange={(event) => updateField("results", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantitative_results">Resultados quantitativos</Label>

          <Textarea
            id="quantitative_results"
            className="min-h-[100px]"
            placeholder="Ex.: redução de custos, capacidade projetada, volume movimentado, demanda estimada ou outros números relevantes."
            value={form.quantitative_results}
            onChange={(event) =>
              updateField("quantitative_results", event.target.value)
            }
          />
        </div>
      </section>

      <section className="space-y-6 rounded-xl border p-5">
        <div>
          <h2 className="text-lg font-semibold">Classificação do projeto</h2>

          <p className="text-sm text-muted-foreground">
            Selecione os assuntos e setores relacionados ao projeto. Essas
            informações serão utilizadas para pesquisa e filtros do Portfólio.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Assuntos</Label>

            <p className="mt-1 text-xs text-muted-foreground">
              Um projeto pode possuir vários assuntos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {assuntoTags.map((tag) => {
              const selected = form.tag_ids.includes(tag.id)

              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={
                    selected
                      ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors"
                      : "rounded-full border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
                  }
                >
                  {tag.name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Setores</Label>

            <p className="mt-1 text-xs text-muted-foreground">
              Selecione os setores em que o projeto está inserido.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {setorTags.map((tag) => {
              const selected = form.tag_ids.includes(tag.id)

              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={
                    selected
                      ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-colors"
                      : "rounded-full border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
                  }
                >
                  {tag.name}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* INVESTIMENTOS */}
      <section className="space-y-5 rounded-xl border p-5">
        <div>
          <h2 className="text-lg font-semibold">Dados do empreendimento</h2>

          <p className="text-sm text-muted-foreground">
            Valores associados ao empreendimento ou projeto desenvolvido.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="completion_date">Data de conclusão</Label>

            <Input
              id="completion_date"
              type="date"
              value={form.completion_date}
              onChange={(event) =>
                updateField("completion_date", event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Moeda</Label>

            <select
              id="currency"
              value={form.currency}
              onChange={(event) => updateField("currency", event.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="BRL">BRL — Real</option>
              <option value="USD">USD — Dólar</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="associated_investment">
              Investimento associado
            </Label>

            <Input
              id="associated_investment"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex.: 150000000"
              value={form.associated_investment}
              onChange={(event) =>
                updateField("associated_investment", event.target.value)
              }
            />

            <p className="text-xs text-muted-foreground">
              Valor do empreendimento associado ao case, quando aplicável.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capex">CAPEX</Label>

            <Input
              id="capex"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex.: 85000000"
              value={form.capex}
              onChange={(event) => updateField("capex", event.target.value)}
            />
          </div>
        </div>
      </section>

      {/* PUBLICAÇÃO */}
      <section className="space-y-5 rounded-xl border p-5">
        <div>
          <h2 className="text-lg font-semibold">Publicação e observações</h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Observações internas</Label>

          <Textarea
            id="notes"
            className="min-h-[100px]"
            placeholder="Informações complementares ou observações internas."
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
          />
        </div>

        <div className="space-y-4 rounded-lg bg-muted/40 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={form.allow_external_export}
              onChange={(event) =>
                updateField("allow_external_export", event.target.checked)
              }
            />

            <div>
              <p className="text-sm font-medium">Permitir exportação externa</p>

              <p className="text-xs text-muted-foreground">
                Indica que o conteúdo poderá futuramente ser utilizado em
                materiais comerciais externos.
              </p>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={form.show_values_in_pdf}
              onChange={(event) =>
                updateField("show_values_in_pdf", event.target.checked)
              }
            />

            <div>
              <p className="text-sm font-medium">
                Exibir valores financeiros no PDF
              </p>

              <p className="text-xs text-muted-foreground">
                Define se investimento e CAPEX poderão aparecer na futura
                exportação do projeto.
              </p>
            </div>
          </label>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => router.push("/portfolio")}
        >
          Cancelar
        </Button>

        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Salvando..."
            : portfolio
              ? "Salvar alterações"
              : "Salvar no Portfólio"}
        </Button>
      </div>
    </form>
  )
}
