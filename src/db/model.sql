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
  user_id integer NOT NULL,
  inconsistency_date date NOT NULL,
  type character varying NOT NULL,
  justification text,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT inconsistencies_pkey PRIMARY KEY (id),
  CONSTRAINT inconsistencies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  updated_at timestamp with time zone,
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  role USER-DEFINED NOT NULL DEFAULT 'COLABORADOR'::user_role,
  cargo_id integer,
  status character varying NOT NULL DEFAULT 'active'::character varying,
  working_hours_per_day integer NOT NULL DEFAULT 8,
  banco_horas_anterior numeric NOT NULL DEFAULT 0,
  banco_horas_atual numeric NOT NULL DEFAULT 0,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
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
CREATE TABLE public.time_allocations (
  id integer NOT NULL DEFAULT nextval('time_allocations_id_seq'::regclass),
  user_id integer NOT NULL,
  project_id integer NOT NULL,
  activity_id integer NOT NULL,
  allocation_date date NOT NULL,
  hours numeric NOT NULL,
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT time_allocations_pkey PRIMARY KEY (id),
  CONSTRAINT time_allocations_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id),
  CONSTRAINT time_allocations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT time_allocations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.time_entries (
  id integer NOT NULL DEFAULT nextval('time_entries_id_seq'::regclass),
  user_id integer NOT NULL,
  entry_date date NOT NULL,
  period smallint NOT NULL CHECK (period = ANY (ARRAY[1, 2, 3])),
  entry_time time without time zone,
  exit_time time without time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT time_entries_pkey PRIMARY KEY (id),
  CONSTRAINT time_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_departments (
  user_id integer NOT NULL,
  department_id integer NOT NULL,
  CONSTRAINT user_departments_pkey PRIMARY KEY (user_id, department_id),
  CONSTRAINT user_departments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id),
  CONSTRAINT user_departments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  role USER-DEFINED NOT NULL DEFAULT 'COLABORADOR'::user_role,
  cargo_id integer,
  status character varying NOT NULL DEFAULT 'active'::character varying,
  working_hours_per_day integer NOT NULL DEFAULT 8,
  banco_horas_anterior numeric NOT NULL DEFAULT 0,
  banco_horas_atual numeric NOT NULL DEFAULT 0,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id)
);