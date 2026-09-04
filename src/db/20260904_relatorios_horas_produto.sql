-- Relatórios Gerenciais - dimensão Produto
-- 04/09/2026
--
-- Inclui a identificação do produto nos apontamentos da view v_ponto.
-- O LEFT JOIN preserva os lançamentos históricos sem product_id.

CREATE OR REPLACE VIEW public.v_ponto AS
SELECT
    p.user_id,
    u.nome AS user_name,
    p.entry_date,
    p.entry_time,
    p.exit_time,
    p.created_at,
    p.updated_at,
    p.projeto,
    p.atividade,
    p.worked_time,
    a.name AS atividade_nome,
    pr.name AS projeto_nome,
    u.working_hours_per_day AS horas_a_fazer,
    d.name AS nome_departamento,
    d.id AS id_departamento,
    p.product_id,
    pp.name AS produto_nome,
    pp.code AS produto_codigo
FROM public.ponto p
JOIN public.users u
    ON u.id = p.user_id
JOIN public.activities a
    ON p.atividade = a.id
JOIN public.projects pr
    ON p.projeto = pr.id
JOIN public.departments d
    ON u.departamento_id = d.id
LEFT JOIN public.project_products pp
    ON pp.id = p.product_id;