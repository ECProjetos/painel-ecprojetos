-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activities (
  id integer NOT NULL DEFAULT nextval('activities_id_seq'::regclass),
  name character varying NOT NULL,
  description text,
  department_id integer NOT NULL,
  CONSTRAINT activities_pkey PRIMARY KEY (id),
  CONSTRAINT activities_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id)
);
CREATE TABLE public.calendar_events (
  id integer NOT NULL DEFAULT nextval('calendar_events_id_seq'::regclass),
  title character varying NOT NULL,
  event_date date NOT NULL,
  type character varying NOT NULL,
  description text,
  CONSTRAINT calendar_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cargos (
  id integer NOT NULL DEFAULT nextval('cargos_id_seq'::regclass),
  nome character varying NOT NULL UNIQUE,
  CONSTRAINT cargos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.departments (
  id integer NOT NULL DEFAULT nextval('departments_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  CONSTRAINT departments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.event_departments (
  event_id integer NOT NULL,
  department_id integer NOT NULL,
  CONSTRAINT event_departments_pkey PRIMARY KEY (event_id, department_id),
  CONSTRAINT event_departments_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.calendar_events(id),
  CONSTRAINT event_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id)
);
CREATE TABLE public.inconsistencies (
  id integer NOT NULL DEFAULT nextval('inconsistencies_id_seq'::regclass),
  user_id uuid NOT NULL,
  inconsistency_date date NOT NULL,
  type character varying NOT NULL,
  justification text,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT inconsistencies_pkey PRIMARY KEY (id),
  CONSTRAINT inconsistencies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.projects (
  id integer NOT NULL DEFAULT nextval('projects_id_seq'::regclass),
  name character varying NOT NULL,
  code character varying UNIQUE,
  estimated_hours integer,
  description text,
  department_id integer NOT NULL,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id)
);
CREATE TABLE public.soft_skills_assessment (
  id integer NOT NULL DEFAULT nextval('soft_skills_assessment_id_seq'::regclass),
  colaborador_id uuid NOT NULL,
  evaluator_id uuid NOT NULL,
  comunicacao text NOT NULL,
  trabalho_em_equipe text NOT NULL,
  proatividade text NOT NULL,
  resolucao_de_problemas text NOT NULL,
  organizacao_de_tempo text NOT NULL,
  pensamento_critico text NOT NULL,
  capricho text NOT NULL,
  encarar_desafios text NOT NULL,
  postura_profissional text NOT NULL,
  gentileza_e_educacao text NOT NULL,
  engajamento_missao_visao text NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT soft_skills_assessment_pkey PRIMARY KEY (id),
  CONSTRAINT fk_user FOREIGN KEY (colaborador_id) REFERENCES public.users(id),
  CONSTRAINT fk_evaluator FOREIGN KEY (evaluator_id) REFERENCES public.users(id)
);
CREATE TABLE public.time_allocations (
  id integer NOT NULL DEFAULT nextval('time_allocations_id_seq'::regclass),
  user_id uuid NOT NULL,
  project_id integer NOT NULL,
  activity_id integer NOT NULL,
  allocation_date date NOT NULL,
  hours numeric NOT NULL,
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT time_allocations_pkey PRIMARY KEY (id),
  CONSTRAINT time_allocations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT time_allocations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT time_allocations_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id)
);
CREATE TABLE public.time_entries (
  user_id uuid NOT NULL,
  entry_date date NOT NULL,
  period smallint NOT NULL CHECK (period = ANY (ARRAY[1, 2, 3])),
  entry_time time without time zone,
  exit_time time without time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT time_entries_pkey PRIMARY KEY (user_id, entry_date, period)
);
CREATE TABLE public.user_departments (
  user_id uuid NOT NULL,
  department_id integer NOT NULL,
  CONSTRAINT user_departments_pkey PRIMARY KEY (user_id, department_id),
  CONSTRAINT user_departments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  role USER-DEFINED NOT NULL DEFAULT 'COLABORADOR'::user_role,
  cargo_id integer,
  status character varying NOT NULL DEFAULT 'active'::character varying,
  working_hours_per_day integer NOT NULL DEFAULT 8,
  banco_horas_anterior numeric NOT NULL DEFAULT 0,
  banco_horas_atual numeric NOT NULL DEFAULT 0,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT users_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id)
);