create index if not exists method_resources_step_id_idx
    on public.method_resources(step_id);

create index if not exists quiz_steps_method_step_id_idx
    on public.quiz_steps(method_step_id);

create index if not exists quiz_step_competencies_competence_id_idx
    on public.quiz_step_competencies(competence_id);

create index if not exists quiz_questions_competence_id_idx
    on public.quiz_questions(competence_id);

create index if not exists quiz_questions_dimension_item_id_idx
    on public.quiz_questions(dimension_item_id);

create index if not exists scorecard_criteria_dimension_item_id_idx
    on public.scorecard_criteria(dimension_item_id);
