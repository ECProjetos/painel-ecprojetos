-- Evolução do Portfólio
-- Substitui o uso de "Investimento associado" por "Demanda projetada".
-- O campo associated_investment é mantido temporariamente como legado
-- para permitir rollback e preservar os dados históricos existentes.

alter table public.project_portfolio
    add column if not exists projected_demand numeric(18,2),
    add column if not exists projected_demand_unit text;

alter table public.project_portfolio
    drop constraint if exists project_portfolio_projected_demand_nonnegative;

alter table public.project_portfolio
    add constraint project_portfolio_projected_demand_nonnegative
    check (
        projected_demand is null
        or projected_demand >= 0
    );

alter table public.project_portfolio
    drop constraint if exists project_portfolio_projected_demand_unit_check;

alter table public.project_portfolio
    add constraint project_portfolio_projected_demand_unit_check
    check (
        (
            projected_demand is null
            and projected_demand_unit is null
        )
        or
        (
            projected_demand is not null
            and projected_demand_unit in ('TEU', 't')
        )
    );

create index if not exists idx_project_portfolio_projected_demand
    on public.project_portfolio(projected_demand);

comment on column public.project_portfolio.projected_demand
    is 'Demanda projetada do projeto. A unidade é definida em projected_demand_unit.';

comment on column public.project_portfolio.projected_demand_unit
    is 'Unidade da demanda projetada: TEU ou t.';

comment on column public.project_portfolio.associated_investment
    is 'Campo legado. Não utilizar em novos registros do Portfólio.';