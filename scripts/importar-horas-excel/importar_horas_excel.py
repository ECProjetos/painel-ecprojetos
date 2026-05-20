from pathlib import Path
from datetime import datetime
import openpyxl
from supabase import create_client
from dotenv import load_dotenv
import os
from datetime import datetime, date

# =========================
# CONFIG
# =========================

load_dotenv(".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# CAMINHO DA PASTA DOS EXCEL
PASTA_PLANILHAS = r"PASTA_PLANILHAS = r"C:\Users\ecpro_dhl3wmn\OneDrive - EC (1)\EC - Controle de horários"

# =========================
# FUNÇÕES
# =========================

def hora_para_minutos(valor):
    """
    Converte:
    02:30 -> 150
    -01:20 -> -80
    """

    if valor is None:
        return 0

    valor = str(valor).strip()

    if valor == "":
        return 0

    negativo = valor.startswith("-")

    valor = valor.replace("-", "")

    try:
        partes = valor.split(":")
        horas = int(partes[0])
        minutos = int(partes[1])

        total = horas * 60 + minutos

        if negativo:
            total *= -1

        return total

    except:
        return 0


def pegar_nome_colaborador(wb):
    try:
        aba = wb["Cadastro_01"]
        return str(aba["D11"].value).strip()
    except:
        return "NÃO IDENTIFICADO"


def processar_aba_mes(wb, nome_aba, colaborador_nome, arquivo_nome):

    try:
        aba = wb[nome_aba]
    except:
        return

    try:
        mes = int(nome_aba)
    except:
        return

    ano = datetime.now().year

    banco_mes_anterior = hora_para_minutos(aba["N5"].value)
    horas_somadas_banco = hora_para_minutos(aba["P5"].value)
    banco_horas_atual = hora_para_minutos(aba["R5"].value)

    horas_a_fazer = hora_para_minutos(aba["J5"].value)
    horas_feitas = hora_para_minutos(aba["L5"].value)

    for linha in range(10, 41):

        data = aba[f"B{linha}"].value

        classificacao = aba[f"D{linha}"].value
        observacao = aba[f"L{linha}"].value

        hora_inicio_1 = aba[f"E{linha}"].value
        hora_fim_1 = aba[f"F{linha}"].value

        hora_inicio_2 = aba[f"G{linha}"].value
        hora_fim_2 = aba[f"H{linha}"].value

        hora_inicio_3 = aba[f"I{linha}"].value
        hora_fim_3 = aba[f"J{linha}"].value

        saldo_dia = hora_para_minutos(aba[f"N{linha}"].value)

        payload = {
            "colaborador_nome": colaborador_nome,
            "arquivo_nome": arquivo_nome,
            "ano": ano,
            "mes": mes,
            "data": str(data),

            "classificacao": str(classificacao) if classificacao else None,
            "observacao": str(observacao) if observacao else None,

            "hora_inicio_1": str(hora_inicio_1) if hora_inicio_1 else None,
            "hora_fim_1": str(hora_fim_1) if hora_fim_1 else None,

            "hora_inicio_2": str(hora_inicio_2) if hora_inicio_2 else None,
            "hora_fim_2": str(hora_fim_2) if hora_fim_2 else None,

            "hora_inicio_3": str(hora_inicio_3) if hora_inicio_3 else None,
            "hora_fim_3": str(hora_fim_3) if hora_fim_3 else None,

            "horas_a_fazer_minutos": horas_a_fazer,
            "horas_feitas_minutos": horas_feitas,
            "saldo_dia_minutos": saldo_dia,

            "banco_mes_anterior_minutos": banco_mes_anterior,
            "horas_somadas_banco_minutos": horas_somadas_banco,
            "banco_horas_atual_minutos": banco_horas_atual,
        }

        (
            supabase
            .table("ponto_excel_importado")
            .upsert(
                payload,
                on_conflict="colaborador_nome,ano,mes,data"
            )
            .execute()
        )

        print(f"Importado: {colaborador_nome} | {data}")


# =========================
# EXECUÇÃO
# =========================

arquivos = [
    arquivo
    for arquivo in Path(PASTA_PLANILHAS).glob("Horários 2026*.xlsx")
    if "Modelo" not in arquivo.name
]

print(f"Arquivos encontrados: {len(arquivos)}")

total_linhas_encontradas = 0

for arquivo in arquivos:
    print(f"\nProcessando: {arquivo.name}")

    try:
        wb = openpyxl.load_workbook(arquivo, data_only=True)
        colaborador_nome = pegar_nome_colaborador(wb)

        print(f"Colaborador: {colaborador_nome}")
        print(f"Abas: {wb.sheetnames}")

        for aba_nome in wb.sheetnames:
            if aba_nome.isdigit():
                aba = wb[aba_nome]

                datas_na_aba = 0

                for linha in range(10, 41):
                    data = aba[f"B{linha}"].value
                    if data:
                        datas_na_aba += 1

                print(f"Aba {aba_nome}: {datas_na_aba} datas encontradas")

                total_linhas_encontradas += datas_na_aba

                processar_aba_mes(
                    wb,
                    aba_nome,
                    colaborador_nome,
                    arquivo.name
                )

    except Exception as e:
        print(f"ERRO: {arquivo.name}")
        print(e)

print(f"\nTotal de linhas com data encontradas: {total_linhas_encontradas}")
print("\nFINALIZADO")