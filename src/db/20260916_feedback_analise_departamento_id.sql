begin;

-- ============================================================
-- Feedback Interno
-- Normalização histórica de departamentos e indicadores
-- Data: 2026-09-16
--
-- Objetivos:
-- 1. Comparar departamentos por departments.id, não pelo nome.
-- 2. Preservar os nomes históricos originais nas tabelas de respostas.
-- 3. Normalizar aliases antigos somente nas views analíticas.
-- 4. Normalizar a pergunta de pressão de trabalho.
-- 5. Tratar essa pergunta como indicador de sentido inverso.
-- ============================================================


-- ============================================================
-- 1. ALIASES HISTÓRICOS DE DEPARTAMENTOS
-- ============================================================

create table if not exists public.feedback_departamento_aliases (
    alias_normalizado text primary key,
    departamento_id integer not null
        references public.departments(id)
        on update cascade
        on delete restrict
);


insert into public.feedback_departamento_aliases (
    alias_normalizado,
    departamento_id
)
values

    -- Departamento de Economia
    ('departamento de economia', 1),
    ('economia', 1),
    ('operações e econômico', 1),

    -- Departamento de Engenharia
    ('departamento de engenharia', 2),
    ('engenharia', 2),
    ('engenharia consultiva e arquitetura', 2),
    ('engenharia construtiva e arquitetura', 2),
    ('engenenharia e sustentabilidade', 2),
    ('engenharia e sustentabilidade', 2),

    -- Meio Ambiente e Geoprocessamento
    ('departamento de meio ambiente e geoprocessamento', 3),
    ('meio ambiente', 3),
    ('meio ambiente e geoprocessamento', 3),
    ('sustentabilidade', 3),

    -- Departamento Administrativo
    ('departamento administrativo', 4),
    ('administrativo', 4),
    ('adm/finan/mkt', 4),
    ('adm/fin/rh', 4),
    ('adm/rh', 4),
    ('gestão adm/financeira/mkt', 4),

    -- Desenvolvimento de Software
    ('departamento de desenvolvimento de software', 5),
    ('desenvolvimento de software/ti', 5),
    ('ti', 5),

    -- Comercial
    ('departamento comercial', 6),
    ('comercial', 6),

    -- Financeiro
    ('departamento financeiro', 7),
    ('financeiro', 7),

    -- Presidência
    ('presidência', 9),

    -- Marketing
    ('departamento de marketing', 10),
    ('marketing', 10),

    -- Planejamento Estratégico
    ('departamento de planejamento estratégico', 11),
    ('planejamento estratégico', 11)

on conflict (alias_normalizado)
do update
set departamento_id = excluded.departamento_id;


-- ============================================================
-- 2. VIEW ANALÍTICA POR PERGUNTA
-- ============================================================

create or replace view public.vw_feedback_analise_perguntas_v2 as

with origem as (

    select
        c.id as ciclo_id,
        c.nome as ciclo_nome,
        c.ano,
        c.mes,
        c.periodo,
        c.status as ciclo_status,

        f.id as formulario_id,
        f.titulo as formulario_titulo,
        f.tipo as tipo_formulario,
        f.categoria,
        f.confidencialidade,

        r.id as resposta_id,
        r.departamento as departamento_original,

        i.id as item_id,
        i.ordem,
        i.pergunta,
        i.resposta_numero,

        case
            when f.categoria = 'feedback_gestor_colaborador'
                 and r.departamento is null
                then d_avaliado.id
            else alias_dep.departamento_id
        end as departamento_id

    from public.feedback_resposta_itens i

    join public.feedback_respostas r
        on r.id = i.resposta_id

    join public.feedback_formularios f
        on f.id = r.formulario_id

    join public.feedback_ciclos c
        on c.id = f.ciclo_id

    left join public.feedback_departamento_aliases alias_dep
        on alias_dep.alias_normalizado = lower(trim(r.departamento))

    left join public.users u_avaliado
        on u_avaliado.id = r.avaliado_user_id

    left join public.departments d_avaliado
        on d_avaliado.id = u_avaliado.departamento_id

    where
        c.status <> 'aberto'
        and i.resposta_numero is not null
),

normalizada as (

    select
        o.*,

        (
            coalesce(
                d.name,
                nullif(trim(o.departamento_original), ''),
                'Sem departamento'
            )
        )::character varying as departamento,

        case
            when o.pergunta ilike
                'Avalie o nível de pressão de trabalho e como ele afeta sua vida pessoal.%'
            then
                'Avalie o nível de pressão de trabalho e como ele afeta sua vida pessoal.'
            else
                o.pergunta
        end as pergunta_normalizada

    from origem o

    left join public.departments d
        on d.id = o.departamento_id
)

select
    ciclo_id,
    ciclo_nome,
    ano,
    mes,
    periodo,
    ciclo_status,

    formulario_id,
    formulario_titulo,
    tipo_formulario,
    categoria,
    confidencialidade,

    departamento,

    ordem,
    pergunta_normalizada as pergunta,

    count(distinct resposta_id) as total_respostas,

    count(item_id)
        filter (where resposta_numero is not null)
        as total_notas,

    round(
        avg(resposta_numero)
            filter (where resposta_numero is not null),
        2
    ) as media_pergunta,

    min(resposta_numero)
        filter (where resposta_numero is not null)
        as menor_nota,

    max(resposta_numero)
        filter (where resposta_numero is not null)
        as maior_nota,

    departamento_id

from normalizada

group by
    ciclo_id,
    ciclo_nome,
    ano,
    mes,
    periodo,
    ciclo_status,

    formulario_id,
    formulario_titulo,
    tipo_formulario,
    categoria,
    confidencialidade,

    departamento_id,
    departamento,

    ordem,
    pergunta_normalizada;


-- ============================================================
-- 3. VIEW EXECUTIVA V2
-- ============================================================

create or replace view public.vw_feedback_analise_executiva_v2 as

with base_raw as (

    select
        p.categoria,
        p.formulario_titulo,
        p.confidencialidade,
        p.ordem,
        p.pergunta,
        p.ciclo_id,
        p.ciclo_nome,
        p.ano,
        p.mes,
        p.periodo,

        case
            when grouping(p.departamento_id) = 1
             and grouping(p.departamento) = 1
                then 8
            else p.departamento_id
        end as departamento_id,

        case
            when grouping(p.departamento_id) = 1
             and grouping(p.departamento) = 1
                then 'Todos'::text::character varying
            else p.departamento
        end as departamento,

        sum(p.total_respostas) as total_respostas,
        sum(p.total_notas) as total_notas,
        round(avg(p.media_pergunta), 2) as media_atual,
        max(p.maior_nota) as maior_nota

    from public.vw_feedback_analise_perguntas_v2 p

    where p.media_pergunta is not null

    group by grouping sets (

        (
            p.categoria,
            p.formulario_titulo,
            p.confidencialidade,
            p.ordem,
            p.pergunta,
            p.ciclo_id,
            p.ciclo_nome,
            p.ano,
            p.mes,
            p.periodo
        ),

        (
            p.departamento_id,
            p.departamento,
            p.categoria,
            p.formulario_titulo,
            p.confidencialidade,
            p.ordem,
            p.pergunta,
            p.ciclo_id,
            p.ciclo_nome,
            p.ano,
            p.mes,
            p.periodo
        )
    )
),

base_norm as (

    select
        base_raw.*,

        case
            when base_raw.departamento_id is not null
                then 'id:' || base_raw.departamento_id::text
            else
                'texto:' || lower(trim(base_raw.departamento))
        end as departamento_chave,

        case
            when base_raw.maior_nota > 5
              or base_raw.pergunta ilike '%recomendar%'
              or base_raw.pergunta ilike '%probabilidade%'
                then 'escala_1_10'
            else
                'escala_1_5'
        end as escala,

        case

            -- Indicador invertido:
            -- 1 = melhor situação
            -- 5 = pior situação
            when base_raw.pergunta =
                'Avalie o nível de pressão de trabalho e como ele afeta sua vida pessoal.'
            then
                round(
                    ((6.0 - base_raw.media_atual) / 5.0) * 100,
                    2
                )

            when base_raw.maior_nota > 5
              or base_raw.pergunta ilike '%recomendar%'
              or base_raw.pergunta ilike '%probabilidade%'
            then
                round(
                    base_raw.media_atual / 10.0 * 100,
                    2
                )

            else
                round(
                    base_raw.media_atual / 5.0 * 100,
                    2
                )
        end as media_atual_100

    from base_raw
),

comparativo as (

    select
        base_norm.*,

        lag(base_norm.media_atual) over (
            partition by
                base_norm.departamento_chave,
                base_norm.categoria,
                base_norm.pergunta
            order by
                base_norm.ano,
                base_norm.mes
        ) as media_anterior,

        lag(base_norm.media_atual_100) over (
            partition by
                base_norm.departamento_chave,
                base_norm.categoria,
                base_norm.pergunta
            order by
                base_norm.ano,
                base_norm.mes
        ) as media_anterior_100,

        lag(base_norm.ciclo_nome) over (
            partition by
                base_norm.departamento_chave,
                base_norm.categoria,
                base_norm.pergunta
            order by
                base_norm.ano,
                base_norm.mes
        ) as ciclo_anterior

    from base_norm
),

calculado as (

    select
        comparativo.*,

        round(
            comparativo.media_atual -
            comparativo.media_anterior,
            2
        ) as variacao_media,

        round(
            comparativo.media_atual_100 -
            comparativo.media_anterior_100,
            2
        ) as variacao_100,

        case
            when comparativo.media_atual_100 >= 90 then 'Excelente'
            when comparativo.media_atual_100 >= 80 then 'Bom'
            when comparativo.media_atual_100 >= 70 then 'Atenção'
            else 'Crítico'
        end as classificacao_atual,

        case
            when comparativo.media_anterior_100 is null
                then 'Sem comparação'

            when (
                comparativo.media_atual_100 -
                comparativo.media_anterior_100
            ) >= 2
                then 'Melhorou'

            when (
                comparativo.media_atual_100 -
                comparativo.media_anterior_100
            ) <= -2
                then 'Piorou'

            else
                'Estável'
        end as tendencia

    from comparativo
)

select
    calculado.ciclo_id,
    calculado.ciclo_nome,
    calculado.ano,
    calculado.mes,
    calculado.periodo,
    calculado.formulario_titulo,
    calculado.categoria,
    calculado.confidencialidade,
    calculado.ordem,
    calculado.pergunta,
    calculado.escala,
    calculado.total_respostas,
    calculado.total_notas,
    calculado.media_atual,
    calculado.media_anterior,

    calculado.media_atual
        as media_pergunta,

    calculado.media_anterior
        as media_ciclo_anterior,

    calculado.media_atual_100,
    calculado.media_anterior_100,
    calculado.variacao_media,
    calculado.variacao_100,
    calculado.ciclo_anterior,
    calculado.classificacao_atual,
    calculado.tendencia,

    case
        when calculado.classificacao_atual = 'Crítico'
            then 'Alta'

        when calculado.classificacao_atual = 'Atenção'
         and calculado.tendencia = 'Piorou'
            then 'Alta'

        when calculado.classificacao_atual = 'Atenção'
            then 'Média'

        when calculado.classificacao_atual = 'Bom'
         and calculado.tendencia = 'Piorou'
            then 'Média'

        else
            'Baixa'
    end as prioridade,

    case
        when calculado.classificacao_atual = 'Crítico'
            then
                'Criar plano de ação prioritário para este indicador.'

        when calculado.classificacao_atual = 'Atenção'
         and calculado.tendencia = 'Piorou'
            then
                'Tratar como ponto de atenção imediato, pois o indicador está baixo e em queda.'

        when calculado.classificacao_atual = 'Atenção'
            then
                'Monitorar e avaliar ações de melhoria no próximo ciclo.'

        when calculado.classificacao_atual = 'Bom'
         and calculado.tendencia = 'Piorou'
            then
                'Monitorar a queda para evitar perda de desempenho no próximo ciclo.'

        when calculado.classificacao_atual = 'Excelente'
         and calculado.tendencia = 'Melhorou'
            then
                'Manter as práticas atuais e usar como referência positiva.'

        else
            'Manter acompanhamento nos próximos ciclos.'
    end as recomendacao,

    calculado.departamento,
    calculado.departamento_id

from calculado;


-- ============================================================
-- 4. VIEWS OFICIAIS CONSUMIDAS PELA APLICAÇÃO
-- ============================================================

create or replace view public.vw_feedback_analise_perguntas as

select
    ciclo_id,
    ciclo_nome,
    ano,
    mes,
    periodo,
    ciclo_status,
    formulario_id,
    formulario_titulo,
    tipo_formulario,
    categoria,
    confidencialidade,
    departamento::text as departamento,
    ordem,
    pergunta,
    total_respostas,
    total_notas,
    media_pergunta,
    menor_nota,
    maior_nota,
    departamento_id

from public.vw_feedback_analise_perguntas_v2;


create or replace view public.vw_feedback_analise_executiva as

select
    ciclo_id,
    ciclo_nome,
    ano,
    mes,
    periodo,
    formulario_titulo,
    categoria,
    confidencialidade,
    ordem,
    pergunta,
    escala,
    total_respostas,
    total_notas,
    media_atual,
    media_anterior,
    media_pergunta,
    media_ciclo_anterior,
    media_atual_100,
    media_anterior_100,
    variacao_media,
    variacao_100,
    ciclo_anterior,
    classificacao_atual,
    tendencia,
    prioridade,
    recomendacao,
    departamento::text as departamento,
    departamento_id

from public.vw_feedback_analise_executiva_v2;


commit;