-- 1. Cria o tipo ENUM para roles (se ainda não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('COLABORADOR', 'GESTOR', 'DIRETOR');
  END IF;
END
$$;

-- 2. Tabela de Cargos
CREATE TABLE IF NOT EXISTS cargos (
  id   SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE
);

-- 3. Insere os cargos iniciais
INSERT INTO cargos (nome) VALUES
  ('Estagiário'),
  ('Assistente de projetos I'),
  ('Assistente de projetos II'),
  ('Consultor de projetos I'),
  ('Consultor de projetos II'),
  ('Consultor de projetos III'),
  ('Consultor de projetos IV'),
  ('Consultor de projetos V'),
  ('Consultor de projetos VI'),
  ('Consultor de projetos VII'),
  ('Consultor de projetos VIII'),
  ('Diretor')
ON CONFLICT (nome) DO NOTHING;

-- 4. Tabela de Departamentos
CREATE TABLE IF NOT EXISTS departments (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- 5. Insere os departamentos iniciais
INSERT INTO departments (name) VALUES
  ('Departamento de Economia'),
  ('Departamento de Engenharia'),
  ('Departamento de Meio Ambiente e Geoprocessamento'),
  ('Departamento Administrativo/RH/Financeiro'),
  ('Departamento de TI'),
  ('Departamento Comercial'),
  ('Departamento de Marketing')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.users (
  id                       UUID                    NOT NULL PRIMARY KEY
    REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at               TIMESTAMPTZ,
  name                     VARCHAR(100)            NOT NULL,
  email                    VARCHAR(150)            NOT NULL UNIQUE,
  role                     user_role               NOT NULL DEFAULT 'COLABORADOR',
  cargo_id                 INTEGER                 REFERENCES cargos(id),
  status                   VARCHAR(20)             NOT NULL DEFAULT 'active',
  working_hours_per_day    INTEGER                 NOT NULL DEFAULT 8,
  banco_horas_anterior     NUMERIC(7,2)            NOT NULL DEFAULT 0,
  banco_horas_atual        NUMERIC(7,2)            NOT NULL DEFAULT 0
);


-- 7. Associação Usuário ↔ Departamento (visibilidade)
CREATE TABLE IF NOT EXISTS user_departments (
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, department_id)
);

-- 8. Tabela de Projetos (vinculados a departamento)
CREATE TABLE IF NOT EXISTS projects (
  id              SERIAL       PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  code            VARCHAR(50)  UNIQUE,
  estimated_hours INTEGER,
  description     TEXT,
  department_id   INTEGER      NOT NULL REFERENCES departments(id) ON DELETE SET NULL
);

-- 9. Tabela de Atividades (vinculadas a departamento)
CREATE TABLE IF NOT EXISTS activities (
  id             SERIAL       PRIMARY KEY,
  name           VARCHAR(150) NOT NULL,
  description    TEXT,
  department_id  INTEGER      NOT NULL REFERENCES departments(id) ON DELETE CASCADE
);

-- 10. Registro de Ponto (Time Entries)
CREATE TABLE IF NOT EXISTS time_entries (
  id           SERIAL       PRIMARY KEY,
  user_id      UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_date   DATE         NOT NULL,
  period       SMALLINT     NOT NULL CHECK (period IN (1,2,3)),
  entry_time   TIME,
  exit_time    TIME,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 11. Alocação de Horas (Time Allocations)
CREATE TABLE IF NOT EXISTS time_allocations (
  id              SERIAL       PRIMARY KEY,
  user_id         UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id      INTEGER      NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  activity_id     INTEGER      NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  allocation_date DATE         NOT NULL,
  hours           NUMERIC(5,2) NOT NULL,
  comment         TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 12. Inconsistências
CREATE TABLE IF NOT EXISTS inconsistencies (
  id                 SERIAL       PRIMARY KEY,
  user_id            UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inconsistency_date DATE         NOT NULL,
  type               VARCHAR(50)  NOT NULL,
  justification      TEXT,
  status             VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 13. Eventos de Calendário
CREATE TABLE IF NOT EXISTS calendar_events (
  id          SERIAL       PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  event_date  DATE         NOT NULL,
  type        VARCHAR(50)  NOT NULL,
  description TEXT
);

-- 14. Associação Evento ↔ Departamento
CREATE TABLE IF NOT EXISTS event_departments (
  event_id      INTEGER NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  department_id INTEGER NOT NULL REFERENCES departments(id)    ON DELETE CASCADE,
  PRIMARY KEY (event_id, department_id)
);


