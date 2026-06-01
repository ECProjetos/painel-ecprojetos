import fs from "fs"
import path from "path"
import AdmZip from "adm-zip"
import XLSX from "xlsx"
import { createClient } from "@supabase/supabase-js"

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, "utf-8")

  for (const line of content.split("\n")) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith("#")) continue

    const index = trimmed.indexOf("=")

    if (index === -1) continue

    const key = trimmed.slice(0, index).trim()
    const value = trimmed
      .slice(index + 1)
      .trim()
      .replace(/^["']|["']$/g, "")

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"))
loadEnvFile(path.resolve(process.cwd(), ".env"))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Erro: confira NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local",
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const zipPath = path.resolve(process.cwd(), process.argv[2] ?? "Feedbacks.zip")
const dryRun = process.argv.includes("--dry-run")

if (!fs.existsSync(zipPath)) {
  console.error(`Arquivo ZIP não encontrado: ${zipPath}`)
  process.exit(1)
}

function cleanText(value) {
  if (value === null || value === undefined) return null

  const text = String(value)
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return text.length > 0 ? text : null
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00a0/g, " ")
    .toLowerCase()
    .trim()
}

function normalizeKey(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function excelSerialToIso(value) {
  if (value === null || value === undefined || value === "") return null

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString()
  }

  const number = Number(value)

  if (Number.isFinite(number) && number > 20000 && number < 70000) {
    const utcDays = Math.floor(number - 25569)
    const utcValue = utcDays * 86400
    const fractionalDay = number - Math.floor(number)
    const totalSeconds = Math.round(utcValue + fractionalDay * 86400)
    return new Date(totalSeconds * 1000).toISOString()
  }

  const parsed = new Date(String(value))

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString()
  }

  return null
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null

  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  const cleaned = cleanText(value)

  if (!cleaned) return null

  const normalized = cleaned.replace(",", ".")

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null

  const number = Number(normalized)

  return Number.isFinite(number) ? number : null
}

function findColumn(row, possibleNames) {
  const columns = Object.keys(row)

  for (const possibleName of possibleNames) {
    const possibleKey = normalizeKey(possibleName)

    const found = columns.find((column) => normalizeKey(column) === possibleKey)

    if (found) return found
  }

  return null
}

function getValue(row, possibleNames) {
  const column = findColumn(row, possibleNames)

  if (!column) return null

  return row[column]
}

function getCycleFromPath(filePath) {
  const normalized = filePath.replaceAll("\\", "/")

  const match = normalized.match(
    /Feedbacks\/(\d{4})\/(?:Feedback|Feddback)\s+(\d{2})\.(\d{2,4})/i,
  )

  if (!match) {
    return {
      nome: "Feedback Histórico",
      ano: null,
      mes: null,
      periodo: "Histórico",
    }
  }

  const anoPasta = Number(match[1])
  const mes = Number(match[2])
  const anoTexto = match[3]

  let ano = Number(anoTexto)

  if (anoTexto.length === 2) {
    ano = 2000 + ano
  }

  if (!Number.isFinite(ano)) {
    ano = anoPasta
  }

  return {
    nome: `Feedback ${String(mes).padStart(2, "0")}.${ano}`,
    ano,
    mes,
    periodo: `${String(mes).padStart(2, "0")}.${ano}`,
  }
}

function getFormInfo(filePath) {
  const lower = normalizeText(filePath)

  if (
    lower.includes("gestao operacional") ||
    lower.includes("gestão operacional")
  ) {
    return {
      tipo: "feedback_gestao_operacional",
      categoria: "feedback_tecnico_operacional",
      titulo: "Feedback Técnico e Operacional",
      confidencialidade: "anonimo",
    }
  }

  if (
    lower.includes("colaborador para gestor") ||
    lower.includes("colaborador para o gestor") ||
    lower.includes("colaborador para os gestores")
  ) {
    return {
      tipo: "feedback_colaborador_gestor",
      categoria: "feedback_colaborador_gestor",
      titulo: "Feedback do Colaborador para o Gestor",
      confidencialidade: "anonimo",
    }
  }

  if (
    lower.includes("gestor para colaborador") ||
    lower.includes("gestor para o colaborador") ||
    lower.includes("gestores para os colaboradores")
  ) {
    return {
      tipo: "feedback_gestor_colaborador",
      categoria: "feedback_gestor_colaborador",
      titulo: "Feedback do Gestor para o Colaborador",
      confidencialidade: "identificado",
    }
  }

  if (
    lower.includes("feedback geral") ||
    lower.includes("planilha feedback geral")
  ) {
    return {
      tipo: "feedback_geral",
      categoria: "feedback_geral_empresa",
      titulo: "Feedback Geral da Empresa",
      confidencialidade: "identificado",
    }
  }

  return {
    tipo: "feedback_outros",
    categoria: "outros",
    titulo: "Outros",
    confidencialidade: "identificado",
  }
}

function shouldImportWorkbook(filePath) {
  const lower = normalizeText(filePath)

  if (!lower.endsWith(".xlsx")) return false
  if (lower.includes("~$")) return false

  if (lower.includes("agendamento")) return false
  if (lower.includes("indicadores do feedback")) return false
  if (lower.includes("indicadores")) return false

  const formInfo = getFormInfo(filePath)

  return formInfo.tipo !== "feedback_outros"
}

function isMetaColumn(header) {
  const key = normalizeKey(header)

  const meta = new Set([
    "id",
    "hora_de_inicio",
    "hora_de_conclusao",
    "email",
    "nome",
    "nome_do_colaborador",
    "media",
    "média",
    "departamento",
    "carimbo_de_data_hora",
  ])

  return meta.has(key)
}

function getUsefulHeaders(rows) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))

  return headers.filter((header) => {
    const cleaned = cleanText(header)

    if (!cleaned) return false

    const normalized = normalizeKey(cleaned)

    if (normalized.startsWith("unnamed")) return false
    if (normalized.startsWith("empty")) return false
    if (normalized === "__empty") return false

    return rows.some((row) => cleanText(row[header]) !== null)
  })
}

function getRespondente(row, formInfo) {
  if (formInfo.confidencialidade === "anonimo") {
    return {
      respondenteNome: null,
      respondenteEmail: null,
    }
  }

  const nome = cleanText(getValue(row, ["Nome"]))
  const email = cleanText(getValue(row, ["Email"]))

  return {
    respondenteNome: nome,
    respondenteEmail: email,
  }
}

function getAvaliado(row, formInfo) {
  if (formInfo.tipo === "feedback_gestor_colaborador") {
    return cleanText(
      getValue(row, ["Nome do Colaborador", "Nome do colaborador"]),
    )
  }

  if (formInfo.tipo === "feedback_geral") {
    return cleanText(getValue(row, ["Nome"]))
  }

  return null
}

async function getOrCreateCycle(cycleInfo) {
  const { data: existing, error: selectError } = await supabase
    .from("feedback_ciclos")
    .select("*")
    .eq("nome", cycleInfo.nome)
    .maybeSingle()

  if (selectError) throw selectError

  if (existing) return existing

  const { data, error } = await supabase
    .from("feedback_ciclos")
    .insert({
      nome: cycleInfo.nome,
      ano: cycleInfo.ano,
      mes: cycleInfo.mes,
      periodo: cycleInfo.periodo,
      status: "historico_importado",
    })
    .select("*")
    .single()

  if (error) throw error

  return data
}

async function importWorkbook(zip, filePath) {
  const buffer = zip.readFile(filePath)

  if (!buffer) {
    console.log(`Não foi possível ler: ${filePath}`)
    return {
      imported: false,
      respostas: 0,
      itens: 0,
    }
  }

  const cycleInfo = getCycleFromPath(filePath)
  const formInfo = getFormInfo(filePath)

  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: false,
  })

  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: null,
    raw: true,
    blankrows: false,
  })

  const validRows = rows.filter((row) => {
    const hasValue = Object.values(row).some(
      (value) => cleanText(value) !== null,
    )

    if (!hasValue) return false

    const nome = cleanText(getValue(row, ["Nome"]))
    const email = cleanText(getValue(row, ["Email"]))
    const departamento = cleanText(getValue(row, ["Departamento"]))

    const isHeaderRow =
      nome === "Nome" || email === "Email" || departamento === "Departamento"

    return !isHeaderRow
  })

  const usefulHeaders = getUsefulHeaders(validRows)
  const questionHeaders = usefulHeaders.filter(
    (header) => !isMetaColumn(header),
  )

  if (dryRun) {
    console.log("")
    console.log(`Arquivo: ${filePath}`)
    console.log(`Ciclo: ${cycleInfo.nome}`)
    console.log(`Tipo: ${formInfo.titulo}`)
    console.log(`Confidencialidade: ${formInfo.confidencialidade}`)
    console.log(`Linhas válidas: ${validRows.length}`)
    console.log(`Perguntas: ${questionHeaders.length}`)
    console.log("Primeiras perguntas:")
    for (const header of questionHeaders.slice(0, 5)) {
      console.log(`- ${cleanText(header)}`)
    }

    const firstRow = validRows[0]

    if (firstRow) {
      console.log("Primeira resposta:")
      for (const header of questionHeaders.slice(0, 5)) {
        console.log(`- ${cleanText(header)} => ${cleanText(firstRow[header])}`)
      }
    }

    return {
      imported: false,
      respostas: validRows.length,
      itens: validRows.length * questionHeaders.length,
    }
  }

  const { data: existingForm, error: existingFormError } = await supabase
    .from("feedback_formularios")
    .select("id")
    .eq("origem_arquivo", filePath)
    .maybeSingle()

  if (existingFormError) throw existingFormError

  if (existingForm) {
    console.log(`Ignorado, já importado: ${filePath}`)
    return {
      imported: false,
      respostas: 0,
      itens: 0,
    }
  }

  const cycle = await getOrCreateCycle(cycleInfo)

  const { data: form, error: formError } = await supabase
    .from("feedback_formularios")
    .insert({
      ciclo_id: cycle.id,
      tipo: formInfo.tipo,
      titulo: formInfo.titulo,
      categoria: formInfo.categoria,
      confidencialidade: formInfo.confidencialidade,
      origem_arquivo: filePath,
    })
    .select("*")
    .single()

  if (formError) throw formError

  const perguntas = []

  for (let index = 0; index < questionHeaders.length; index++) {
    const header = questionHeaders[index]

    const { data: pergunta, error: perguntaError } = await supabase
      .from("feedback_perguntas")
      .insert({
        formulario_id: form.id,
        ordem: index + 1,
        chave: normalizeKey(header),
        pergunta: cleanText(header),
        tipo_resposta: "misto",
      })
      .select("*")
      .single()

    if (perguntaError) throw perguntaError

    perguntas.push({
      header,
      pergunta,
      ordem: index + 1,
    })
  }

  let respostasCount = 0
  let itensCount = 0

  for (const row of validRows) {
    const respostaOriginalId =
      cleanText(getValue(row, ["ID"])) ??
      cleanText(getValue(row, ["Carimbo de data/hora"]))

    const dataInicio = excelSerialToIso(
      getValue(row, ["Hora de início", "Carimbo de data/hora"]),
    )

    const dataConclusao = excelSerialToIso(
      getValue(row, ["Hora de conclusão", "Carimbo de data/hora"]),
    )

    const departamento = cleanText(
      getValue(row, ["Departamento", "Departamento "]),
    )

    const { respondenteNome, respondenteEmail } = getRespondente(row, formInfo)
    const avaliadoNome = getAvaliado(row, formInfo)

    const { data: resposta, error: respostaError } = await supabase
      .from("feedback_respostas")
      .insert({
        formulario_id: form.id,
        resposta_original_id: respostaOriginalId,
        data_inicio: dataInicio,
        data_conclusao: dataConclusao,
        respondente_nome: respondenteNome,
        respondente_email: respondenteEmail,
        avaliado_nome: avaliadoNome,
        departamento,
        anonimo: formInfo.confidencialidade === "anonimo",
        origem_arquivo: filePath,
      })
      .select("*")
      .single()

    if (respostaError) throw respostaError

    respostasCount++

    const itens = perguntas
      .map(({ header, pergunta, ordem }) => {
        const rawValue = row[header]
        const respostaTexto = cleanText(rawValue)
        const respostaNumero = parseNumber(rawValue)

        if (respostaTexto === null && respostaNumero === null) {
          return null
        }

        return {
          resposta_id: resposta.id,
          pergunta_id: pergunta.id,
          ordem,
          pergunta: pergunta.pergunta,
          resposta_texto: respostaTexto,
          resposta_numero: respostaNumero,
        }
      })
      .filter(Boolean)

    if (itens.length > 0) {
      const { error: itensError } = await supabase
        .from("feedback_resposta_itens")
        .insert(itens)

      if (itensError) throw itensError

      itensCount += itens.length
    }
  }

  console.log(`Importado: ${filePath}`)
  console.log(`  Respostas: ${respostasCount}`)
  console.log(`  Itens: ${itensCount}`)

  return {
    imported: true,
    respostas: respostasCount,
    itens: itensCount,
  }
}

async function main() {
  const zip = new AdmZip(zipPath)

  const files = zip
    .getEntries()
    .map((entry) => entry.entryName)
    .filter(shouldImportWorkbook)

  console.log("")
  console.log(`Arquivos Excel oficiais encontrados: ${files.length}`)

  for (const file of files) {
    console.log(`- ${file}`)
  }

  let totalArquivos = 0
  let totalRespostas = 0
  let totalItens = 0

  for (const file of files) {
    try {
      const result = await importWorkbook(zip, file)

      if (result.imported) {
        totalArquivos++
      }

      totalRespostas += result.respostas
      totalItens += result.itens
    } catch (error) {
      console.error("")
      console.error(`Erro ao importar ${file}`)
      console.error(error)
      process.exit(1)
    }
  }

  console.log("")
  console.log(dryRun ? "Validação finalizada." : "Importação finalizada.")
  console.log(`Arquivos importados: ${totalArquivos}`)
  console.log(`Respostas processadas: ${totalRespostas}`)
  console.log(`Itens processados: ${totalItens}`)
}

main()
