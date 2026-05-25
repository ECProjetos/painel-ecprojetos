from pathlib import Path
from datetime import datetime, date, timezone
import os
import openpyxl
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

PASTA_PLANILHAS = r"C:\Users\ecpro_dhl3wmn\OneDrive - EC (1)\EC - Controle de horários"


def hora_para_minutos(valor):
    if valor is None:
        return 0

    if hasattr(valor, "total_seconds"):
        return int(round(valor.total_seconds() / 60))

    if hasattr(valor, "hour") and hasattr(valor, "minute"):
        return valor.hour * 60 + valor.minute

    valor = str(valor).strip()

    if valor == "":
        return 0

    negativo = valor.startswith("-")
    valor = valor.replace("-", "")

    try:
        horas, minutos = valor.split(":")[:2]
        total = int(horas) * 60 + int(minutos)
        return -total if negativo else total
    except Exception:
        return 0


def pegar_nome_colaborador(wb):
    try:
        nome = wb["Cadastro_01"]["D11"].value
        return str(nome).strip() if nome else "NÃO IDENTIFICADO"
    except Exception:
        return "NÃO IDENTIFICADO"


def registrar_inicio(arquivos_encontrados):
    response = supabase.table("controle_importacao_excel").insert({
        "tipo": "banco_horas_excel",
        "status": "em_andamento",
        "arquivos_encontrados": arquivos_encontrados,
        "registros_importados": 0,
        "mensagem": "Importação iniciada."
    }).execute()

    return response.data[0]["id"]


def registrar_fim(importacao_id, status, registros_importados, mensagem):
    supabase.table("controle_importacao_excel").update({
        "status": status,
        "registros_importados": registros_importados,
        "mensagem": mensagem,
        "finalizado_em": datetime.now(timezone.utc).isoformat()
    }).eq("id", importacao_id).execute()


def processar_aba_mes(wb, nome_aba, colaborador_nome, arquivo_nome):
    try:
        aba = wb[nome_aba]
        mes = int(nome_aba)
    except Exception:
        return 0

    ano = datetime.now().year

    banco_mes_anterior = hora_para_minutos(aba["N5"].value)
    horas_somadas_banco = hora_para_minutos(aba["P5"].value)
    banco_horas_atual = hora_para_minutos(aba["R5"].value)

    horas_a_fazer = hora_para_minutos(aba["J5"].value)
    horas_feitas = hora_para_minutos(aba["L5"].value)

    registros_importados = 0

    print(f"Processando {colaborador_nome} | mês {mes:02d}")

    for linha in range(10, 41):
        data = aba[f"B{linha}"].value

        if not data:
            continue

        if isinstance(data, datetime):
            data = data.date()

        if not isinstance(data, date):
            continue

        # Evita bugs de datas 1904 e outros anos inválidos
        if data.year != ano:
            continue

        # Não importa dias futuros
        if data > date.today():
            continue

        payload = {
            "colaborador_nome": colaborador_nome,
            "arquivo_nome": arquivo_nome,
            "ano": ano,
            "mes": mes,
            "data": str(data),

            "classificacao": str(aba[f"D{linha}"].value) if aba[f"D{linha}"].value else None,
            "observacao": str(aba[f"L{linha}"].value) if aba[f"L{linha}"].value else None,

            "hora_inicio_1": str(aba[f"E{linha}"].value) if aba[f"E{linha}"].value else None,
            "hora_fim_1": str(aba[f"F{linha}"].value) if aba[f"F{linha}"].value else None,

            "hora_inicio_2": str(aba[f"G{linha}"].value) if aba[f"G{linha}"].value else None,
            "hora_fim_2": str(aba[f"H{linha}"].value) if aba[f"H{linha}"].value else None,

            "hora_inicio_3": str(aba[f"I{linha}"].value) if aba[f"I{linha}"].value else None,
            "hora_fim_3": str(aba[f"J{linha}"].value) if aba[f"J{linha}"].value else None,

            "horas_a_fazer_minutos": horas_a_fazer,
            "horas_feitas_minutos": horas_feitas,
            "saldo_dia_minutos": hora_para_minutos(aba[f"N{linha}"].value),

            "banco_mes_anterior_minutos": banco_mes_anterior,
            "horas_somadas_banco_minutos": horas_somadas_banco,
            "banco_horas_atual_minutos": banco_horas_atual,
        }

        supabase.table("ponto_excel_importado").upsert(
            payload,
            on_conflict="colaborador_nome,ano,mes,data"
        ).execute()

        registros_importados += 1

        if registros_importados % 10 == 0:
            print(f"  {registros_importados} registros importados...")

    return registros_importados


def main():
    arquivos = [
        arquivo
        for arquivo in Path(PASTA_PLANILHAS).glob("Horários 2026*.xlsx")
        if "Modelo" not in arquivo.name
    ]

    print(f"Arquivos encontrados: {len(arquivos)}")

    importacao_id = registrar_inicio(len(arquivos))
    total_registros = 0
    erros = []

    try:
        for arquivo in arquivos:
            print(f"\nArquivo: {arquivo.name}")

            try:
                wb = openpyxl.load_workbook(arquivo, data_only=True)
                colaborador_nome = pegar_nome_colaborador(wb)

                for aba_nome in wb.sheetnames:
                    if aba_nome.isdigit():
                        total_registros += processar_aba_mes(
                            wb,
                            aba_nome,
                            colaborador_nome,
                            arquivo.name
                        )

            except Exception as e:
                erros.append(f"{arquivo.name}: {str(e)}")
                print(f"ERRO: {arquivo.name} | {e}")

        if erros:
            registrar_fim(
                importacao_id,
                "finalizado_com_erros",
                total_registros,
                " | ".join(erros)
            )
        else:
            registrar_fim(
                importacao_id,
                "sucesso",
                total_registros,
                "Importação finalizada com sucesso."
            )

        print(f"\nTotal importado: {total_registros}")
        print("Importação finalizada.")

    except Exception as e:
        registrar_fim(
            importacao_id,
            "erro",
            total_registros,
            str(e)
        )
        print(f"ERRO GERAL: {e}")


if __name__ == "__main__":
    main()