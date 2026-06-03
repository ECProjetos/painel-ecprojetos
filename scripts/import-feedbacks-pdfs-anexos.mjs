import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
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
  console.error(
    "Erro: confira NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const zipPath = path.resolve(process.cwd(), process.argv[2] ?? "Feedbacks pdfd.zip");
const bucketName = "feedbacks-internos";
const dryRun = process.argv.includes("--dry-run");

if (!fs.existsSync(zipPath)) {
  console.error(`Arquivo ZIP não encontrado: ${zipPath}`);
  process.exit(1);
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00a0/g, " ")
    .toLowerCase()
    .trim();
}

function safePathPart(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getCycleFromPath(filePath) {
  const normalized = filePath.replaceAll("\\", "/");

  const match = normalized.match(
    /Feedbacks\/(\d{4})\/(?:Feedback|Feddback)\s+(\d{2})\.(\d{2,4})/i
  );

  if (!match) {
    return {
      nome: "Feedback Histórico",
      ano: null,
      mes: null,
      periodo: "Histórico",
    };
  }

  const anoPasta = Number(match[1]);
  const mes = Number(match[2]);
  const anoTexto = match[3];

  let ano = Number(anoTexto);

  if (anoTexto.length === 2) {
    ano = 2000 + ano;
  }

  if (!Number.isFinite(ano)) {
    ano = anoPasta;
  }

  return {
    nome: `Feedback ${String(mes).padStart(2, "0")}.${ano}`,
    ano,
    mes,
    periodo: `${String(mes).padStart(2, "0")}.${ano}`,
  };
}

function getFormInfo(filePath) {
  const lower = normalizeText(filePath);

  if (lower.includes("tecnico") || lower.includes("operacional")) {
    return {
      tipo: "feedback_gestao_operacional",
      categoria: "feedback_tecnico_operacional",
      titulo: "Feedback Técnico e Operacional",
      confidencialidade: "anonimo",
    };
  }

  if (
    lower.includes("colaborador para o gestor") ||
    lower.includes("colaborador para gestor") ||
    lower.includes("colaborador para os gestores")
  ) {
    return {
      tipo: "feedback_colaborador_gestor",
      categoria: "feedback_colaborador_gestor",
      titulo: "Feedback do Colaborador para o Gestor",
      confidencialidade: "anonimo",
    };
  }

  if (
    lower.includes("gestor para colaborador") ||
    lower.includes("gestor para o colaborador") ||
    lower.includes("gestores para os colaboradores") ||
    lower.includes("gestor para o colaboador")
  ) {
    return {
      tipo: "feedback_gestor_colaborador",
      categoria: "feedback_gestor_colaborador",
      titulo: "Feedback do Gestor para o Colaborador",
      confidencialidade: "identificado",
    };
  }

  if (lower.includes("feedback geral")) {
    return {
      tipo: "feedback_geral",
      categoria: "feedback_geral_empresa",
      titulo: "Feedback Geral da Empresa",
      confidencialidade: "identificado",
    };
  }

  return {
    tipo: "feedback_outros",
    categoria: "outros",
    titulo: "Outros",
    confidencialidade: "identificado",
  };
}

async function getCycle(cycleInfo) {
  const { data, error } = await supabase
    .from("feedback_ciclos")
    .select("*")
    .eq("nome", cycleInfo.nome)
    .maybeSingle();

  if (error) throw error;

  if (data) return data;

  const { data: created, error: insertError } = await supabase
    .from("feedback_ciclos")
    .insert({
      nome: cycleInfo.nome,
      ano: cycleInfo.ano,
      mes: cycleInfo.mes,
      periodo: cycleInfo.periodo,
      status: "historico_pdf",
    })
    .select("*")
    .single();

  if (insertError) throw insertError;

  return created;
}

async function getFormulario(cicloId, formInfo, origemBase) {
  const { data: existing, error } = await supabase
    .from("feedback_formularios")
    .select("*")
    .eq("ciclo_id", cicloId)
    .eq("tipo", formInfo.tipo)
    .maybeSingle();

  if (error) throw error;

  if (existing) return existing;

  const { data, error: insertError } = await supabase
    .from("feedback_formularios")
    .insert({
      ciclo_id: cicloId,
      tipo: formInfo.tipo,
      titulo: formInfo.titulo,
      categoria: formInfo.categoria,
      confidencialidade: formInfo.confidencialidade,
      origem_arquivo: origemBase,
    })
    .select("*")
    .single();

  if (insertError) throw insertError;

  return data;
}

async function anexoAlreadyExists(origemArquivo) {
  const { data, error } = await supabase
    .from("feedback_anexos")
    .select("id")
    .eq("origem_arquivo", origemArquivo)
    .maybeSingle();

  if (error) throw error;

  return Boolean(data);
}

async function main() {
  const zip = new AdmZip(zipPath);

  const pdfFiles = zip
    .getEntries()
    .filter((entry) => !entry.isDirectory)
    .map((entry) => entry.entryName)
    .filter((name) => name.toLowerCase().endsWith(".pdf"));

  console.log("");
  console.log(`PDFs encontrados: ${pdfFiles.length}`);

  let uploaded = 0;
  let ignored = 0;

  for (const filePath of pdfFiles) {
    const cycleInfo = getCycleFromPath(filePath);
    const formInfo = getFormInfo(filePath);

    const originalFileName = path.basename(filePath);
    const storagePath = [
      "historico",
      safePathPart(cycleInfo.nome),
      safePathPart(formInfo.categoria),
      safePathPart(originalFileName),
    ].join("/");

    console.log("");
    console.log(`Arquivo: ${filePath}`);
    console.log(`Ciclo: ${cycleInfo.nome}`);
    console.log(`Tipo: ${formInfo.titulo}`);
    console.log(`Storage: ${storagePath}`);

    if (dryRun) {
      continue;
    }

    const exists = await anexoAlreadyExists(filePath);

    if (exists) {
      console.log("Ignorado, anexo já cadastrado.");
      ignored++;
      continue;
    }

    const buffer = zip.readFile(filePath);

    if (!buffer) {
      console.log("Não foi possível ler o PDF.");
      ignored++;
      continue;
    }

    const cycle = await getCycle(cycleInfo);
    const formulario = await getFormulario(cycle.id, formInfo, filePath);

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { error: insertError } = await supabase
      .from("feedback_anexos")
      .insert({
        ciclo_id: cycle.id,
        formulario_id: formulario.id,
        resposta_id: null,
        tipo: "pdf_historico",
        nome_arquivo: originalFileName,
        storage_path: storagePath,
        origem_arquivo: filePath,
      });

    if (insertError) {
      throw insertError;
    }

    uploaded++;
  }

  console.log("");
  console.log(dryRun ? "Validação finalizada." : "Importação finalizada.");
  console.log(`PDFs enviados: ${uploaded}`);
  console.log(`PDFs ignorados: ${ignored}`);
}

main();