-- =========================================================
-- RÓTULOS INICIAIS DO PORTFÓLIO
-- =========================================================

insert into public.portfolio_tags
    (name, category, sort_order)
values
    ('Simulação', 'assunto', 10),
    ('Modelagem', 'assunto', 20),
    ('Estudo de Demanda', 'assunto', 30),
    ('Estudo de Mercado', 'assunto', 40),
    ('Viabilidade', 'assunto', 50),
    ('Geoprocessamento', 'assunto', 60),
    ('Projeto Conceitual', 'assunto', 70),
    ('Estudo Ambiental', 'assunto', 80),
    ('Planejamento', 'assunto', 90),

    ('Portuário', 'setor', 10),
    ('Rodoviário', 'setor', 20),
    ('Ferroviário', 'setor', 30),
    ('Aeroportuário', 'setor', 40),
    ('Logística', 'setor', 50),
    ('Industrial', 'setor', 60)

on conflict (name, category) do nothing;