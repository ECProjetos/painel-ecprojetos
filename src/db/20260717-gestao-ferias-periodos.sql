-- ============================================================
-- Gestão de Férias - períodos aquisitivos, saldos e vencimentos
-- Data: 17/07/2026
-- Seguro para execução repetida (idempotente)
-- ============================================================

begin;

create extension if not exists pgcrypto;

-- 1) Configuração dos colaboradores que participam da gestão de férias.
create table if not exists public.ferias_colaboradores_config (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null unique references public.users(id) on delete cascade,
  regime_contratacao text not null default 'clt',
  ativo_gestao_ferias boolean not null default true,
  data_admissao_referencia date,
  dias_direito_padrao integer not null default 30,
  observacao text,
  criado_por uuid references public.users(id) on delete set null,
  atualizado_por uuid references public.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint ferias_colaboradores_config_regime_check
    check (regime_contratacao in ('clt', 'estagio', 'pj', 'outro')),
  constraint ferias_colaboradores_config_dias_check
    check (dias_direito_padrao between 0 and 30)
);

comment on table public.ferias_colaboradores_config is
  'Define quais colaboradores entram na gestão de férias e a data de admissão usada como referência.';

-- 2) Cada período aquisitivo/concessivo do colaborador.
create table if not exists public.ferias_periodos_aquisitivos (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.users(id) on delete cascade,
  config_id uuid references public.ferias_colaboradores_config(id) on delete cascade,
  numero_periodo integer not null default 1,
  aquisitivo_inicio date not null,
  aquisitivo_fim date not null,
  concessivo_inicio date not null,
  concessivo_fim date not null,
  dias_direito integer not null default 30,
  ajuste_manual boolean not null default false,
  motivo_ajuste text,
  observacao text,
  criado_por uuid references public.users(id) on delete set null,
  atualizado_por uuid references public.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint ferias_periodos_datas_check
    check (
      aquisitivo_fim >= aquisitivo_inicio
      and concessivo_inicio > aquisitivo_fim
      and concessivo_fim >= concessivo_inicio
    ),
  constraint ferias_periodos_dias_check
    check (dias_direito between 0 and 30),
  constraint ferias_periodos_unico
    unique (colaborador_id, aquisitivo_inicio, aquisitivo_fim)
);

create index if not exists idx_ferias_periodos_colaborador
  on public.ferias_periodos_aquisitivos (colaborador_id);

create index if not exists idx_ferias_periodos_vencimento
  on public.ferias_periodos_aquisitivos (concessivo_fim);

-- 3) Histórico das alterações manuais nos períodos.
create table if not exists public.ferias_periodos_historico (
  id uuid primary key default gen_random_uuid(),
  periodo_id uuid references public.ferias_periodos_aquisitivos(id) on delete cascade,
  colaborador_id uuid references public.users(id) on delete cascade,
  acao text not null,
  dados_anteriores jsonb,
  dados_novos jsonb,
  observacao text,
  usuario_id uuid references public.users(id) on delete set null,
  criado_em timestamptz not null default now()
);

create index if not exists idx_ferias_periodos_historico_periodo
  on public.ferias_periodos_historico (periodo_id, criado_em desc);

-- 4) Compatibilidade com as solicitações já existentes.
alter table public.ferias_solicitacoes
  add column if not exists periodo_aquisitivo_id uuid
    references public.ferias_periodos_aquisitivos(id) on delete set null;

alter table public.ferias_solicitacoes
  add column if not exists origem text not null default 'individual';

alter table public.ferias_solicitacoes
  add column if not exists requer_analise_inicio boolean not null default false;

alter table public.ferias_solicitacoes
  add column if not exists periodo_aquisitivo_inicio date;

alter table public.ferias_solicitacoes
  add column if not exists periodo_aquisitivo_fim date;

alter table public.ferias_solicitacoes
  add column if not exists dias_vendidos integer not null default 0;

alter table public.ferias_solicitacoes
  add column if not exists adiantamento_13 boolean not null default false;

-- A data de retorno é mantida automaticamente como o dia seguinte ao último dia de férias.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'ferias_solicitacoes'
      and column_name = 'data_retorno'
  ) then
    alter table public.ferias_solicitacoes
      add column data_retorno date generated always as (data_fim + 1) stored;
  end if;
end $$;

create index if not exists idx_ferias_solicitacoes_periodo
  on public.ferias_solicitacoes (periodo_aquisitivo_id);

create index if not exists idx_ferias_solicitacoes_colaborador_status
  on public.ferias_solicitacoes (colaborador_id, status);

-- Restrições adicionadas apenas se ainda não existirem.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ferias_solicitacoes_origem_check'
  ) then
    alter table public.ferias_solicitacoes
      add constraint ferias_solicitacoes_origem_check
      check (origem in ('individual', 'coletiva', 'ajuste_historico'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'ferias_solicitacoes_dias_vendidos_check'
  ) then
    alter table public.ferias_solicitacoes
      add constraint ferias_solicitacoes_dias_vendidos_check
      check (dias_vendidos between 0 and 10);
  end if;
end $$;

-- 5) Atualização automática do campo atualizado_em.
create or replace function public.ferias_set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists trg_ferias_config_atualizado_em
  on public.ferias_colaboradores_config;
create trigger trg_ferias_config_atualizado_em
before update on public.ferias_colaboradores_config
for each row execute function public.ferias_set_atualizado_em();

drop trigger if exists trg_ferias_periodos_atualizado_em
  on public.ferias_periodos_aquisitivos;
create trigger trg_ferias_periodos_atualizado_em
before update on public.ferias_periodos_aquisitivos
for each row execute function public.ferias_set_atualizado_em();

-- 6) Auditoria automática de inclusão, alteração e exclusão de períodos.
create or replace function public.ferias_auditar_periodo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.ferias_periodos_historico (
      periodo_id, colaborador_id, acao, dados_novos, usuario_id
    ) values (
      new.id, new.colaborador_id, 'criado', to_jsonb(new), new.criado_por
    );
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.ferias_periodos_historico (
      periodo_id, colaborador_id, acao, dados_anteriores, dados_novos, usuario_id
    ) values (
      new.id,
      new.colaborador_id,
      case when new.ajuste_manual then 'ajuste_manual' else 'atualizado' end,
      to_jsonb(old),
      to_jsonb(new),
      new.atualizado_por
    );
    return new;
  else
    insert into public.ferias_periodos_historico (
      periodo_id, colaborador_id, acao, dados_anteriores, usuario_id
    ) values (
      old.id, old.colaborador_id, 'excluido', to_jsonb(old), old.atualizado_por
    );
    return old;
  end if;
end;
$$;

drop trigger if exists trg_ferias_auditar_periodo
  on public.ferias_periodos_aquisitivos;
create trigger trg_ferias_auditar_periodo
after insert or update or delete on public.ferias_periodos_aquisitivos
for each row execute function public.ferias_auditar_periodo();

-- 7) Gera os períodos anuais a partir da data de admissão de referência.
create or replace function public.ferias_gerar_periodos_colaborador(
  p_colaborador_id uuid,
  p_ate date default ((current_date + interval '24 months')::date),
  p_usuario_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_config public.ferias_colaboradores_config%rowtype;
  v_inicio date;
  v_aquisitivo_fim date;
  v_concessivo_inicio date;
  v_concessivo_fim date;
  v_numero integer := 1;
  v_inseridos integer := 0;
begin
  select *
    into v_config
  from public.ferias_colaboradores_config
  where colaborador_id = p_colaborador_id
    and ativo_gestao_ferias = true
    and regime_contratacao = 'clt';

  if not found or v_config.data_admissao_referencia is null then
    return 0;
  end if;

  v_inicio := v_config.data_admissao_referencia;

  while v_inicio <= p_ate loop
    v_aquisitivo_fim := (v_inicio + interval '1 year' - interval '1 day')::date;
    v_concessivo_inicio := (v_aquisitivo_fim + 1);
    v_concessivo_fim := (v_concessivo_inicio + interval '1 year' - interval '1 day')::date;

    insert into public.ferias_periodos_aquisitivos (
      colaborador_id,
      config_id,
      numero_periodo,
      aquisitivo_inicio,
      aquisitivo_fim,
      concessivo_inicio,
      concessivo_fim,
      dias_direito,
      criado_por,
      atualizado_por
    ) values (
      p_colaborador_id,
      v_config.id,
      v_numero,
      v_inicio,
      v_aquisitivo_fim,
      v_concessivo_inicio,
      v_concessivo_fim,
      v_config.dias_direito_padrao,
      p_usuario_id,
      p_usuario_id
    )
    on conflict (colaborador_id, aquisitivo_inicio, aquisitivo_fim)
    do update set
      config_id = excluded.config_id,
      numero_periodo = excluded.numero_periodo,
      atualizado_por = coalesce(excluded.atualizado_por, public.ferias_periodos_aquisitivos.atualizado_por);

    if found then
      v_inseridos := v_inseridos + 1;
    end if;

    v_inicio := (v_inicio + interval '1 year')::date;
    v_numero := v_numero + 1;
  end loop;

  return v_inseridos;
end;
$$;

-- 8) Visão consolidada usada pela “tabelona” de programação.
create or replace view public.vw_ferias_programacao as
with solicitacoes as (
  select
    s.periodo_aquisitivo_id,
    count(*) filter (
      where s.tipo = 'ferias'
        and s.status in ('pendente', 'aprovada')
    )::integer as quantidade_periodos_reservados,
    coalesce(sum(s.dias_corridos) filter (
      where s.tipo = 'ferias'
        and s.status = 'aprovada'
        and s.data_fim < current_date
    ), 0)::integer as dias_usufruidos,
    coalesce(sum(s.dias_corridos) filter (
      where s.tipo = 'ferias'
        and s.status = 'aprovada'
        and s.data_inicio <= current_date
        and s.data_fim >= current_date
    ), 0)::integer as dias_em_gozo,
    coalesce(sum(s.dias_corridos) filter (
      where s.tipo = 'ferias'
        and s.status = 'aprovada'
        and s.data_inicio > current_date
    ), 0)::integer as dias_programados,
    coalesce(sum(s.dias_corridos) filter (
      where s.tipo = 'ferias'
        and s.status = 'pendente'
    ), 0)::integer as dias_pendentes,
    coalesce(sum(s.dias_vendidos) filter (
      where s.tipo = 'ferias'
        and s.status in ('pendente', 'aprovada')
    ), 0)::integer as dias_vendidos,
    min(s.data_inicio) filter (
      where s.tipo = 'ferias'
        and s.status in ('pendente', 'aprovada')
    ) as primeiro_gozo,
    max(s.data_fim) filter (
      where s.tipo = 'ferias'
        and s.status in ('pendente', 'aprovada')
    ) as ultimo_gozo,
    bool_or(
      s.tipo = 'ferias'
      and s.status in ('pendente', 'aprovada')
      and s.origem = 'coletiva'
    ) as possui_ferias_coletivas
  from public.ferias_solicitacoes s
  where s.periodo_aquisitivo_id is not null
  group by s.periodo_aquisitivo_id
), base as (
  select
    p.id as periodo_id,
    p.colaborador_id,
    u.nome as colaborador_nome,
    u.data_admissao,
    c.regime_contratacao,
    c.ativo_gestao_ferias,
    p.numero_periodo,
    p.aquisitivo_inicio,
    p.aquisitivo_fim,
    p.concessivo_inicio,
    p.concessivo_fim,
    p.dias_direito,
    p.ajuste_manual,
    p.motivo_ajuste,
    p.observacao,
    coalesce(s.quantidade_periodos_reservados, 0) as quantidade_periodos_reservados,
    coalesce(s.dias_usufruidos, 0) as dias_usufruidos,
    coalesce(s.dias_em_gozo, 0) as dias_em_gozo,
    coalesce(s.dias_programados, 0) as dias_programados,
    coalesce(s.dias_pendentes, 0) as dias_pendentes,
    coalesce(s.dias_vendidos, 0) as dias_vendidos,
    s.primeiro_gozo,
    s.ultimo_gozo,
    coalesce(s.possui_ferias_coletivas, false) as possui_ferias_coletivas,
    greatest(
      p.dias_direito
      - coalesce(s.dias_usufruidos, 0)
      - coalesce(s.dias_em_gozo, 0)
      - coalesce(s.dias_programados, 0)
      - coalesce(s.dias_vendidos, 0),
      0
    )::integer as saldo_aprovado,
    greatest(
      p.dias_direito
      - coalesce(s.dias_usufruidos, 0)
      - coalesce(s.dias_em_gozo, 0)
      - coalesce(s.dias_programados, 0)
      - coalesce(s.dias_pendentes, 0)
      - coalesce(s.dias_vendidos, 0),
      0
    )::integer as saldo_apos_pendencias,
    (p.concessivo_fim - current_date)::integer as dias_para_vencer
  from public.ferias_periodos_aquisitivos p
  join public.users u on u.id = p.colaborador_id
  join public.ferias_colaboradores_config c on c.id = p.config_id
  left join solicitacoes s on s.periodo_aquisitivo_id = p.id
  where c.ativo_gestao_ferias = true
    and c.regime_contratacao = 'clt'
)
select
  base.*,
  case
    when base.saldo_aprovado <= 0 then 'concluido'
    when base.concessivo_fim < current_date then 'vencido'
    when base.dias_para_vencer <= 30 then 'urgente'
    when base.concessivo_fim <= (current_date + interval '2 months')::date then 'atencao'
    else 'regular'
  end as situacao
from base;

comment on view public.vw_ferias_programacao is
  'Consolida período aquisitivo, prazo concessivo, férias usufruídas/programadas e saldo.';

-- 9) RLS: o acesso normal deve ocorrer pelas Server Actions com service role.
alter table public.ferias_colaboradores_config enable row level security;
alter table public.ferias_periodos_aquisitivos enable row level security;
alter table public.ferias_periodos_historico enable row level security;

commit;

-- ============================================================
-- Após executar este arquivo:
-- 1. Cadastre os colaboradores CLT pela tela de Gestão de Férias.
-- 2. O sistema gerará automaticamente os períodos anuais.
-- ============================================================
