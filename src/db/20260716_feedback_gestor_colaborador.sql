begin;

alter table public.feedback_respostas
  add column if not exists avaliado_user_id uuid
  references public.users(id)
  on delete set null;

create index if not exists idx_feedback_respostas_avaliado_user_id
  on public.feedback_respostas(avaliado_user_id);

create unique index if not exists ux_feedback_gestor_avaliado_por_ciclo
  on public.feedback_respostas(
    formulario_id,
    respondente_user_id,
    avaliado_user_id
  )
  where avaliado_user_id is not null;

do $$
declare
  v_ciclo_id uuid := '8e4f8e2c-1b4f-4783-9b3b-0fed9fb229a3';
  v_formulario_id uuid;
  v_total_respostas integer;
begin
  select id
    into v_formulario_id
  from public.feedback_formularios
  where ciclo_id = v_ciclo_id
    and categoria = 'feedback_gestor_colaborador'
  limit 1;

  if v_formulario_id is null then
    insert into public.feedback_formularios (
      ciclo_id,
      tipo,
      titulo,
      categoria,
      confidencialidade,
      publico_alvo,
      instrucoes,
      status,
      ordem
    )
    values (
      v_ciclo_id,
      'feedback_gestor_colaborador',
      'Feedback do Gestor para o Colaborador',
      'feedback_gestor_colaborador',
      'identificado',
      'gestor',
      'Formulário identificado para avaliação do desempenho e desenvolvimento do colaborador pelo gestor.',
      'aberto',
      4
    )
    returning id into v_formulario_id;
  else
    update public.feedback_formularios
    set
      tipo = 'feedback_gestor_colaborador',
      titulo = 'Feedback do Gestor para o Colaborador',
      categoria = 'feedback_gestor_colaborador',
      confidencialidade = 'identificado',
      publico_alvo = 'gestor',
      instrucoes = 'Formulário identificado para avaliação do desempenho e desenvolvimento do colaborador pelo gestor.',
      status = 'aberto',
      ordem = 4
    where id = v_formulario_id;
  end if;

  select count(*)
    into v_total_respostas
  from public.feedback_respostas
  where formulario_id = v_formulario_id;

  if v_total_respostas > 0 then
    raise notice
      'O formulário já possui % resposta(s). As perguntas existentes foram mantidas.',
      v_total_respostas;
  else
    delete from public.feedback_perguntas
    where formulario_id = v_formulario_id;

    insert into public.feedback_perguntas (
    formulario_id,
    ordem,
    chave,
    pergunta,
    tipo_resposta
  )
  values
    (
      v_formulario_id,
      1,
      'cumprimento_metas_responsabilidades',
      'Cumprimento de Metas e Responsabilidades: O colaborador demonstrou um bom desempenho em relação ao cumprimento de metas e responsabilidades durante este período?',
      'escala_1_5'
    ),
    (
      v_formulario_id,
      2,
      'habilidades_tecnicas_conhecimento',
      'Habilidades Técnicas e Conhecimento: Como você avalia as habilidades técnicas e o conhecimento do colaborador relacionados ao seu cargo?',
      'escala_1_5'
    ),
    (
      v_formulario_id,
      3,
      'trabalho_equipe_colaboracao',
      'Trabalho em Equipe e Colaboração: Como o colaborador contribui para o trabalho em equipe e a colaboração dentro da equipe?',
      'escala_1_5'
    ),
    (
      v_formulario_id,
      4,
      'comportamento_profissional_etico',
      'Comportamento e Atitude: O colaborador demonstra um comportamento profissional e ético no ambiente de trabalho?',
      'escala_1_5'
    ),
    (
      v_formulario_id,
      5,
      'atitude_trabalho_colegas',
      'Comportamento e Atitude: Como você avalia a atitude do colaborador em relação ao trabalho e aos colegas de equipe?',
      'escala_1_5'
    ),
    (
      v_formulario_id,
      6,
      'comunicacao_verbal_escrita',
      'Comunicação e Feedback: Como é a comunicação do colaborador, tanto verbal quanto escrita?',
      'escala_1_5'
    ),
    (
      v_formulario_id,
      7,
      'receptividade_feedbacks',
      'Comunicação e Feedback: O colaborador é receptivo a feedbacks e sugestões de melhoria?',
      'escala_1_5'
    ),
    (
      v_formulario_id,
      8,
      'iniciativa_proatividade',
      'Iniciativa e Proatividade: O colaborador demonstra iniciativa e proatividade na realização de suas tarefas?',
      'escala_1_5'
    ),
    (
      v_formulario_id,
      9,
      'contribuicao_alem_responsabilidades',
      'Iniciativa e Proatividade: O colaborador busca oportunidades para contribuir além das suas responsabilidades básicas?',
      'escala_1_5'
    ),
    (
      v_formulario_id,
      10,
      'principais_pontos_fortes',
      'Pontos Fortes e Áreas de Melhoria: Quais são os principais pontos fortes do colaborador?',
      'texto'
    ),
    (
      v_formulario_id,
      11,
      'areas_especificas_melhoria',
      'Pontos Fortes e Áreas de Melhoria: Existem áreas específicas em que o colaborador poderia melhorar?',
      'texto'
    ),
    (
      v_formulario_id,
      12,
      'potencial_crescimento_desenvolvimento',
      'Desenvolvimento Profissional: Como você vê o potencial de crescimento e desenvolvimento profissional do colaborador?',
      'escala_1_5'
    ),
    (
      v_formulario_id,
      13,
      'feedback_adicional',
      'Feedback Adicional: Existe algo mais que você gostaria de destacar sobre o desempenho ou as contribuições do colaborador?',
      'texto'
    );
  end if;
end
$$;

commit;
