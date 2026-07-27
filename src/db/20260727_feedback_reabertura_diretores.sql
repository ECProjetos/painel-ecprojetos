begin;

alter table public.feedback_ciclos
  add column if not exists acesso_respostas text
  not null
  default 'todos';

alter table public.feedback_ciclos
  drop constraint if exists feedback_ciclos_acesso_respostas_check;

alter table public.feedback_ciclos
  add constraint feedback_ciclos_acesso_respostas_check
  check (acesso_respostas in ('todos', 'diretores'));

comment on column public.feedback_ciclos.acesso_respostas is
  'Define quem pode responder durante a abertura do ciclo: todos ou somente diretores.';

commit;
