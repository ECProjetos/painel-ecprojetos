import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf-8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");

    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Erro: confira NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const zipPath = path.resolve(process.cwd(), process.argv[2] ?? "Feedbacks.zip");

if (!fs.existsSync(zipPath)) {
  console.error(`Arquivo não encontrado: ${zipPath}`);
  process.exit(1);
}

function cleanText(value) {
  if (value === null || value === undefined) return null;

  const text = String(value)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 0 ? text : null;
}

function normalizeKey(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function findColumn(row, possibleNames) {
  const columns = Object.keys(row);

  for (const possibleName of possibleNames) {
    const possibleKey = normalizeKey(possibleName);

    const found = columns.find((column) => normalizeKey(column) === possibleKey);

    if (found) return found;
  }

  return null;
}

function getValue(row, possibleNames) {
  const column = findColumn(row, possibleNames);

  if (!column) return null;

  return cleanText(row[column]);
}

function parseDate(value) {
  const cleaned = cleanText(value);

  if (!cleaned) return null;

  const parsed = new Date(cleaned);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return null;
}

function parseNumber(value) {
  const cleaned = cleanText(value);

  if (!cleaned) return null;

  const normalized = cleaned.replace(",", ".");

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;

  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

function getCycleFromPath(filePath) {
  const match = filePath.match(/Feedbacks\/(\d{4})\/(?:Feedback|Feddback)\s+(\d{2})\.(\d{4})/i);

  if (!match) {
    return {
      nome: "Feedback Histórico",
      ano: null,
      mes: null,
      periodo: "Histórico",
    };
  }

  const yearFolder = Number(match[1]);
  const mes = Number(match[2]);
  const ano = Number(match[3] || yearFolder);

  return {
    nome: `Feedback ${String(mes).padStart(2, "0")}.${ano}`,
    ano,
    mes,
    periodo: `${String(mes).padStart(2, "0")}.${ano}`,
  };
}

function getFormType(filePath) {
  const lower = filePath
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (lower.includes("gestao operacional")) {
    return {
      tipo: "feedback_gestao_operacional",
      titulo: "Feedback Gestão Operacional",
      anonimo: true,
    };
  }

  if (lower.includes("colaborador para gestor") || lower.includes("colaborador para os gestores")) {
    return {
      tipo: "feedback_colaborador_gestor",
      titulo: "Feedback do Colaborador para o Gestor",
      anonimo: true,
    };
  }

  if (lower.includes("gestor para colaborador")) {
    return {
      tipo: "feedback_gestor_colaborador",
      titulo: "Feedback do Gestor para o Colaborador",
      anonimo: false,
    };
  }

  if (lower.includes("feedback geral")) {
    return {
      tipo: "feedback_geral",
      titulo: "Feedback Geral",
      anonimo: false,
    };
  }

  return {
    tipo: "feedback_outros",
    titulo: "Feedback Outros",
    anonimo: false,
  };
}

function shouldImportFile(filePath) {
  const lower = filePath.toLowerCase();

  if (!lower.endsWith(".xlsx")) return false;

  if (lower.includes("/indicadores do feedback/")) return false;

  if (lower.includes("agendamento colaboradores")) return false;

  if (lower.includes("~$")) return false;

  return true;
}

function getUsefulHeaders(rows) {
  const allHeaders = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row)))
  );

  return allHeaders.filter((header) => {
    const cleanedHeader = cleanText(header);

    if (!cleanedHeader) return false;

    const normalized = normalizeKey(cleanedHeader);

    if (normalized.startsWith("unnamed")) return false;
    if (normalized.startsWith("empty")) return false;
    if (normalized === "__empty") return false;

    return rows.some((row) => cleanText(row[header]) !== null);
  });
}

function isMetaColumn(header) {
  const key = normalizeKey(header);

  const meta = new Set([
    "id",
    "hora_de_inicio",
    "hora_de_conclusao",
    "email",
    "nome",
    "nome_do_colaborador",
    "media",
    "departamento",
    "carimbo_de_data_hora",
  ]);

  return meta.has(key);
}

async function getOrCreateCycle(cycleInfo) {
  const { data: existing, error: selectError } = await supabase
    .from("feedback_ciclos")
    .select("*")
    .eq("nome", cycleInfo.nome)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existing) return existing;

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
    .single();

  if (error) throw error;

  return data;
}

async function getExistingFormBySource(sourcePath) {
  const { data, error } = await supabase
    .from("feedback_formularios")
    .select("*")
    .eq("origem_arquivo", sourcePath)
    .maybeSingle();

  if (error) throw error;

  return data;
}

async function importWorkbook(zip, filePath) {
  const existingForm = await getExistingFormBySource(filePath);

  if (existingForm) {
    console.log(`Ignorado, já importado: ${filePath}`);
    return {
      imported: false,
      respostas: 0,
      itens: 0,
    };
  }

  const buffer = zip.readFile(filePath);

  if (!buffer) {
    console.log(`Não foi possível ler: ${filePath}`);
    return {
      imported: false,
      respostas: 0,
      itens: 0,
    };
  }

  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
  });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: null,
    raw: false,
  });

  const validRows = rows.filter((row) => {
    return Object.values(row).some((value) => cleanText(value) !== null);
  });

  if (validRows.length === 0) {
    console.log(`Sem linhas úteis: ${filePath}`);
    return {
      imported: false,
      respostas: 0,
      itens: 0,
    };
  }

  const usefulHeaders = getUsefulHeaders(validRows);
  const questionHeaders = usefulHeaders.filter((header) => !isMetaColumn(header));

  if (questionHeaders.length === 0) {
    console.log(`Sem perguntas úteis: ${filePath}`);
    return {
      imported: false,
      respostas: 0,
      itens: 0,
    };
  }

  const cycleInfo = getCycleFromPath(filePath);
  const formInfo = getFormType(filePath);

  const cycle = await getOrCreateCycle(cycleInfo);

  const { data: form, error: formError } = await supabase
    .from("feedback_formularios")
    .insert({
      ciclo_id: cycle.id,
      tipo: formInfo.tipo,
      titulo: formInfo.titulo,
      origem_arquivo: filePath,
    })
    .select("*")
    .single();

  if (formError) throw formError;

  const perguntas = [];

  for (let index = 0; index < questionHeaders.length; index++) {
    const header = questionHeaders[index];

    const { data: pergunta, error: perguntaError } = await supabase
      .from("feedback_perguntas")
      .insert({
        formulario_id: form.id,
        ordem: index + 1,
        chave: normalizeKey(header),
        pergunta: cleanText(header),
        tipo_resposta: "texto",
      })
      .select("*")
      .single();

    if (perguntaError) throw perguntaError;

    perguntas.push({
      header,
      pergunta,
      ordem: index + 1,
    });
  }

  let respostasCount = 0;
  let itensCount = 0;

  for (const row of validRows) {
    const respostaOriginalId = getValue(row, ["ID"]);
    const dataInicio = parseDate(getValue(row, ["Hora de início", "Carimbo de data/hora"]));
    const dataConclusao = parseDate(getValue(row, ["Hora de conclusão", "Carimbo de data/hora"]));

    const nome = getValue(row, ["Nome"]);
    const email = getValue(row, ["Email"]);
    const departamento = getValue(row, ["Departamento", "Departamento "]);
    const nomeColaborador = getValue(row, ["Nome do Colaborador", "Nome do colaborador"]);

    const anonimo = formInfo.anonimo;

    const respondenteNome = anonimo ? null : nome;
    const respondenteEmail = anonimo ? null : email;

    let avaliadoNome = null;

    if (formInfo.tipo === "feedback_gestor_colaborador") {
      avaliadoNome = nomeColaborador;
    }

    if (formInfo.tipo === "feedback_geral") {
      avaliadoNome = nome;
    }

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
        anonimo,
        origem_arquivo: filePath,
      })
      .select("*")
      .single();

    if (respostaError) throw respostaError;

    respostasCount++;

    const itens = perguntas
      .map(({ header, pergunta, ordem }) => {
        const respostaTexto = cleanText(row[header]);
        const respostaNumero = parseNumber(row[header]);

        if (respostaTexto === null) return null;

        return {
          resposta_id: resposta.id,
          pergunta_id: pergunta.id,
          ordem,
          pergunta: pergunta.pergunta,
          resposta_texto: respostaTexto,
          resposta_numero: respostaNumero,
        };
      })
      .filter(Boolean);

    if (itens.length > 0) {
      const { error: itensError } = await supabase
        .from("feedback_resposta_itens")
        .insert(itens);

      if (itensError) throw itensError;

      itensCount += itens.length;
    }
  }

  console.log(`Importado: ${filePath}`);
  console.log(`  Respostas: ${respostasCount}`);
  console.log(`  Itens: ${itensCount}`);

  return {
    imported: true,
    respostas: respostasCount,
    itens: itensCount,
  };
}

async function main() {
  const zip = new AdmZip(zipPath);

  const files = zip
    .getEntries()
    .map((entry) => entry.entryName)
    .filter(shouldImportFile);

  console.log(`Arquivos Excel encontrados para importação: ${files.length}`);

  let totalRespostas = 0;
  let totalItens = 0;
  let totalArquivos = 0;

  for (const file of files) {
    try {
      const result = await importWorkbook(zip, file);

      if (result.imported) {
        totalArquivos++;
        totalRespostas += result.respostas;
        totalItens += result.itens;
      }
    } catch (error) {
      console.error(`Erro ao importar ${file}`);
      console.error(error);
      process.exit(1);
    }
  }

  console.log("");
  console.log("Importação finalizada.");
  console.log(`Arquivos importados: ${totalArquivos}`);
  console.log(`Respostas importadas: ${totalRespostas}`);
  console.log(`Itens importados: ${totalItens}`);
}

main();