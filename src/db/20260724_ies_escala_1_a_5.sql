create or replace view public.vw_indicadores_colaborador_trimestre_v3 as
with ies_por_periodo as (
  select
    colaborador_id,

    extract(year from data_entrega)::integer as ano,

    ceil(
      extract(month from data_entrega)::numeric / 3
    )::integer as trimestre,

    count(*)::integer as total_registros,

    count(*) filter (
      where data_entrega >= date '2026-08-01'
    )::integer as total_nova_regra,

    count(ies_nota) filter (
      where data_entrega >= date '2026-08-01'
    )::integer as total_notas_nova_regra,

    avg(
      case
        -- Entregas de agosto de 2026 em diante:
        -- escala de 1 a 5 convertida para 20 a 100.
        when data_entrega >= date '2026-08-01'
          then ies_nota::numeric * 20::numeric

        -- Entregas anteriores a agosto:
        -- preserva a lógica binária antiga.
        when ies_aprovado_primeira is true
          then 100::numeric

        else 0::numeric
      end
    ) as ies_calculado

  from public.indicadores_desempenho

  where data_entrega is not null

  group by
    colaborador_id,
    extract(year from data_entrega)::integer,
    ceil(extract(month from data_entrega)::numeric / 3)::integer
),

calculado as (
  select
    base.colaborador_id,
    base.colaborador_nome,
    base.equipe,
    base.ano,
    base.trimestre,
    base.total_entregas,

    case
      -- Recalcula somente quando o período possuir registros da nova regra
      -- e todos eles tiverem recebido uma nota de 1 a 5.
      when ies.total_nova_regra > 0
        and ies.total_nova_regra = ies.total_notas_nova_regra
      then round(ies.ies_calculado, 2)

      -- Períodos totalmente anteriores a agosto continuam exatamente
      -- com o IES calculado pela view antiga.
      else base.ies::numeric
    end as ies,

    base.ip::numeric as ip,
    base.iq::numeric as iq,
    base.iev::numeric as iev,
    base.idi::numeric as idi_anterior,

    (
      ies.total_nova_regra > 0
      and ies.total_nova_regra = ies.total_notas_nova_regra
    ) as recalcula_idi

  from public.vw_indicadores_colaborador_trimestre base

  left join ies_por_periodo ies
    on ies.colaborador_id = base.colaborador_id
   and ies.ano = base.ano
   and ies.trimestre = base.trimestre
)

select
  colaborador_id,
  colaborador_nome,
  equipe,
  ano,
  trimestre,
  total_entregas,

  round(ies, 2) as ies,
  round(ip, 2) as ip,
  round(iq, 2) as iq,
  round(iev, 2) as iev,

  case
    when recalcula_idi then round(
      ies * 0.20::numeric
      + ip * 0.20::numeric
      + iq * 0.40::numeric
      + iev * 0.20::numeric,
      2
    )

    else round(idi_anterior, 2)
  end as idi

from calculado;