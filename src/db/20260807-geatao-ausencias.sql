-- ============================================================
-- Gestão de Ausências - Day-off e Folga de Banco de Horas
-- Data: 07/08/2026
-- Objetivo: evoluir o fluxo atual de férias sem migrar os dados existentes.
-- Seguro para execução repetida (idempotente).
-- ============================================================

begin;

-- 1) A tabela atual de solicitações já funciona como agenda de ausência.
-- Acrescentamos apenas os dados necessários para períodos parciais e banco de horas.
alter table public.ferias_solicitacoes
  add column if not exists periodo_dia text not null default 'integral';

alter table public.ferias_solicitacoes
  add column if not exists horas_solicitadas numeric(8,2);

alter table public.ferias_solicitacoes
  add column if not exists saldo_banco_horas_snapshot numeric(8,2);

-- 2) Validação do período da ausência.
alter table public.ferias_solicitacoes
  drop constraint if exists ferias_solicitacoes_periodo_dia_check;

alter table public.ferias_solicitacoes
  add constraint ferias_solicitacoes_periodo_dia_check
  check (periodo_dia in ('integral', 'manha', 'tarde'));

alter table public.ferias_solicitacoes
  drop constraint if exists ferias_solicitacoes_horas_solicitadas_check;

alter table public.ferias_solicitacoes
  add constraint ferias_solicitacoes_horas_solicitadas_check
  check (horas_solicitadas is null or horas_solicitadas > 0);

-- 3) Amplia o CHECK de tipo. O bloco também cobre bancos em que a
-- constraint antiga recebeu um nome diferente do padrão.
do $$
declare
  constraint_tipo record;
begin
  for constraint_tipo in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'ferias_solicitacoes'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%tipo%'
      and pg_get_constraintdef(c.oid) ilike '%ferias%'
  loop
    execute format(
      'alter table public.ferias_solicitacoes drop constraint %I',
      constraint_tipo.conname
    );
  end loop;
end $$;

alter table public.ferias_solicitacoes
  add constraint ferias_solicitacoes_tipo_check
  check (
    tipo in (
      'ferias',
      'ausencia',
      'atestado',
      'day_off',
      'folga_banco_horas',
      'licenca'
    )
  );

-- 4) Índices para calendário, filtros e análise de conflitos.
create index if not exists idx_ferias_solicitacoes_tipo_status_periodo
  on public.ferias_solicitacoes (tipo, status, data_inicio, data_fim);

create index if not exists idx_ferias_solicitacoes_equipe_periodo
  on public.ferias_solicitacoes (equipe, data_inicio, data_fim)
  where status in ('pendente', 'aprovada');

-- 5) Não criamos uma nova tabela/view de ausências neste MVP.
-- ferias_solicitacoes já é o agregado transacional usado pelo sistema e recebe o
-- campo "tipo". Manter uma única fonte reduz risco de divergência e migração.

commit;
