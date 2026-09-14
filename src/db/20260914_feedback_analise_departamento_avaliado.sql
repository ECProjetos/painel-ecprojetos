begin;

create or replace view public.vw_feedback_analise_perguntas as

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

    case
        when f.categoria = 'feedback_gestor_colaborador' then
            coalesce(
                r.departamento,
                d_avaliado.name,
                'Sem departamento'
            )
        else
            coalesce(
                r.departamento,
                'Sem departamento'
            )
    end as departamento,

    i.ordem,
    i.pergunta,

    count(distinct r.id) as total_respostas,

    count(i.id)
        filter (where i.resposta_numero is not null)
        as total_notas,

    round(
        avg(i.resposta_numero)
            filter (where i.resposta_numero is not null),
        2
    ) as media_pergunta,

    min(i.resposta_numero)
        filter (where i.resposta_numero is not null)
        as menor_nota,

    max(i.resposta_numero)
        filter (where i.resposta_numero is not null)
        as maior_nota

from public.feedback_resposta_itens i

join public.feedback_respostas r
    on r.id = i.resposta_id

join public.feedback_formularios f
    on f.id = r.formulario_id

join public.feedback_ciclos c
    on c.id = f.ciclo_id

left join public.users u_avaliado
    on u_avaliado.id = r.avaliado_user_id

left join public.departments d_avaliado
    on d_avaliado.id = u_avaliado.departamento_id

where
    c.status <> 'aberto'
    and i.resposta_numero is not null

group by
    c.id,
    c.nome,
    c.ano,
    c.mes,
    c.periodo,
    c.status,

    f.id,
    f.titulo,
    f.tipo,
    f.categoria,
    f.confidencialidade,

    case
        when f.categoria = 'feedback_gestor_colaborador' then
            coalesce(
                r.departamento,
                d_avaliado.name,
                'Sem departamento'
            )
        else
            coalesce(
                r.departamento,
                'Sem departamento'
            )
    end,

    i.ordem,
    i.pergunta;

commit;