-- Content lifecycle invariants live in PostgreSQL as well as in the application.
-- Row locks serialize publication and archival operations that share dependencies.

create or replace function private.raise_content_lifecycle_conflict(message text)
returns void
language plpgsql
set search_path = ''
as $$
begin
    raise exception using
        errcode = 'P0001',
        message = 'CONTENT_LIFECYCLE_CONFLICT: ' || message;
end;
$$;

create or replace function private.assert_no_published_content_dependants(
    entity_kind text,
    entity_id text
)
returns void
language plpgsql
set search_path = ''
as $$
declare
    has_dependants boolean := false;
begin
    case entity_kind
        when 'coach' then
            select exists(
                select 1 from public.scenarios
                where coach_id = entity_id::uuid and status = 'published'::public.content_status
            ) into has_dependants;
        when 'persona' then
            select exists(
                select 1 from public.scenarios
                where persona_id = entity_id::uuid and status = 'published'::public.content_status
            ) into has_dependants;
        when 'method' then
            select exists(
                select 1 from public.scenarios
                where method_id = entity_id::uuid and status = 'published'::public.content_status
                union all
                select 1 from public.quizzes
                where method_id = entity_id::uuid and status = 'published'::public.content_status
                union all
                select 1 from public.scorecards
                where method_id = entity_id::uuid and status = 'published'::public.content_status
            ) into has_dependants;
        when 'quiz' then
            select exists(
                select 1
                from public.scenario_quizzes sq
                join public.scenarios s on s.id = sq.scenario_id
                where sq.quiz_id = entity_id::uuid
                  and s.status = 'published'::public.content_status
                union all
                select 1
                from public.quizzes q
                join public.methods m on m.id = q.method_id
                where q.id = entity_id::uuid
                  and q.quiz_kind = 'method_knowledge'
                  and m.status = 'published'::public.content_status
            ) into has_dependants;
        when 'scorecard' then
            select exists(
                select 1 from public.scenarios
                where scorecard_id = entity_id::uuid and status = 'published'::public.content_status
            ) into has_dependants;
        when 'skill' then
            select exists(
                select 1
                from public.quiz_step_competencies qsc
                join public.quiz_steps qs on qs.id = qsc.step_id
                join public.quizzes q on q.id = qs.quiz_id
                where qsc.competence_id = entity_id
                  and q.status = 'published'::public.content_status
                union all
                select 1
                from public.quiz_questions qq
                join public.quiz_steps qs on qs.id = qq.step_id
                join public.quizzes q on q.id = qs.quiz_id
                where qq.competence_id = entity_id
                  and q.status = 'published'::public.content_status
                union all
                select 1
                from public.scorecard_criteria sc
                join public.scorecard_steps ss on ss.id = sc.scorecard_step_id
                join public.scorecards s on s.id = ss.scorecard_id
                where sc.skill_id = entity_id
                  and s.status = 'published'::public.content_status
            ) into has_dependants;
        else
            has_dependants := false;
    end case;

    if has_dependants then
        perform private.raise_content_lifecycle_conflict(
            'Ce contenu est utilisé par au moins un contenu publié.'
        );
    end if;
end;
$$;

create or replace function private.enforce_content_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    old_status public.content_status := (to_jsonb(old)->>'status')::public.content_status;
    new_status public.content_status := (to_jsonb(new)->>'status')::public.content_status;
begin
    if old_status = 'archived'::public.content_status
       and new_status <> 'archived'::public.content_status then
        perform private.raise_content_lifecycle_conflict(
            'La restauration d’un contenu archivé n’est pas disponible. Dupliquez-le pour créer un brouillon.'
        );
    end if;

    if old_status is distinct from new_status
       and new_status <> 'published'::public.content_status then
        perform private.assert_no_published_content_dependants(tg_argv[0], (to_jsonb(new)->>'id'));
    end if;

    return new;
end;
$$;

create or replace function private.enforce_published_parent_dependencies()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    dependency_status public.content_status;
    dependency_active boolean;
begin
    if new.status <> 'published'::public.content_status then
        return new;
    end if;

    if tg_table_name = 'scenarios' then
        select status into dependency_status
        from public.personas where id = new.persona_id for key share;
        if not found or dependency_status <> 'published'::public.content_status then
            perform private.raise_content_lifecycle_conflict('Le persona associé doit être publié.');
        end if;

        if new.coach_id is not null then
            select status into dependency_status
            from public.coaches where id = new.coach_id for key share;
            if not found or dependency_status <> 'published'::public.content_status then
                perform private.raise_content_lifecycle_conflict('Le coach associé doit être publié.');
            end if;
        end if;

        if new.method_id is not null then
            select status, is_active into dependency_status, dependency_active
            from public.methods where id = new.method_id for key share;
            if not found or dependency_status <> 'published'::public.content_status or not dependency_active then
                perform private.raise_content_lifecycle_conflict('La méthode associée doit être publiée et active.');
            end if;
        end if;

        if new.scorecard_id is not null then
            select status, is_active into dependency_status, dependency_active
            from public.scorecards where id = new.scorecard_id for key share;
            if not found or dependency_status <> 'published'::public.content_status or not dependency_active then
                perform private.raise_content_lifecycle_conflict('La scorecard associée doit être publiée et active.');
            end if;
        end if;
    elsif tg_table_name = 'quizzes' and new.method_id is not null then
        select status, is_active into dependency_status, dependency_active
        from public.methods where id = new.method_id for key share;
        if not found or dependency_status <> 'published'::public.content_status or not dependency_active then
            perform private.raise_content_lifecycle_conflict('La méthode associée doit être publiée et active.');
        end if;
    elsif tg_table_name = 'scorecards' then
        select status, is_active into dependency_status, dependency_active
        from public.methods where id = new.method_id for key share;
        if not found or dependency_status <> 'published'::public.content_status or not dependency_active then
            perform private.raise_content_lifecycle_conflict('La méthode associée doit être publiée et active.');
        end if;
    end if;

    return new;
end;
$$;

create or replace function private.enforce_quiz_step_dependency()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    quiz_status public.content_status;
    quiz_method_id uuid;
    step_method_id uuid;
    method_status public.content_status;
    method_active boolean;
begin
    select status, method_id into quiz_status, quiz_method_id
    from public.quizzes where id = new.quiz_id;

    if quiz_status <> 'published'::public.content_status or new.method_step_id is null then
        return new;
    end if;

    select ms.method_id, m.status, m.is_active
    into step_method_id, method_status, method_active
    from public.method_steps ms
    join public.methods m on m.id = ms.method_id
    where ms.id = new.method_step_id
    for key share of ms, m;

    if not found or step_method_id is distinct from quiz_method_id
       or method_status <> 'published'::public.content_status or not method_active then
        perform private.raise_content_lifecycle_conflict(
            'Une étape du quiz ne correspond pas à la méthode publiée sélectionnée.'
        );
    end if;

    return new;
end;
$$;

create or replace function private.assert_published_skill_dependency(skill_id text)
returns void
language plpgsql
set search_path = ''
as $$
declare
    dependency_status public.content_status;
    dependency_active boolean;
begin
    select status, is_active into dependency_status, dependency_active
    from public.skills where id = skill_id for key share;
    if not found or dependency_status <> 'published'::public.content_status or not dependency_active then
        perform private.raise_content_lifecycle_conflict('La compétence associée doit être publiée et active.');
    end if;
end;
$$;

create or replace function private.assert_active_dimension_item_dependency(item_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
    dependency_active boolean;
begin
    select is_active into dependency_active
    from public.skill_dimension_items where id = item_id for key share;
    if not found or not dependency_active then
        perform private.raise_content_lifecycle_conflict('L’item de compétence associé doit être actif.');
    end if;
end;
$$;

create or replace function private.enforce_quiz_competency_dependency()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    parent_status public.content_status;
begin
    select q.status into parent_status
    from public.quiz_steps qs join public.quizzes q on q.id = qs.quiz_id
    where qs.id = new.step_id;
    if parent_status = 'published'::public.content_status then
        perform private.assert_published_skill_dependency(new.competence_id);
    end if;
    return new;
end;
$$;

create or replace function private.enforce_quiz_question_dependencies()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    parent_status public.content_status;
begin
    select q.status into parent_status
    from public.quiz_steps qs join public.quizzes q on q.id = qs.quiz_id
    where qs.id = new.step_id;
    if parent_status = 'published'::public.content_status then
        if new.competence_id is not null then
            perform private.assert_published_skill_dependency(new.competence_id);
        end if;
        if new.dimension_item_id is not null then
            perform private.assert_active_dimension_item_dependency(new.dimension_item_id);
        end if;
    end if;
    return new;
end;
$$;

create or replace function private.enforce_scorecard_step_dependency()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    parent_status public.content_status;
    parent_method_id uuid;
    step_method_id uuid;
begin
    select status, method_id into parent_status, parent_method_id
    from public.scorecards where id = new.scorecard_id;
    if parent_status <> 'published'::public.content_status then
        return new;
    end if;

    select method_id into step_method_id
    from public.method_steps where id = new.method_step_id for key share;
    if not found or step_method_id is distinct from parent_method_id then
        perform private.raise_content_lifecycle_conflict(
            'Une étape de la scorecard ne correspond pas à la méthode sélectionnée.'
        );
    end if;
    return new;
end;
$$;

create or replace function private.enforce_scorecard_criterion_dependencies()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    parent_status public.content_status;
begin
    select s.status into parent_status
    from public.scorecard_steps ss join public.scorecards s on s.id = ss.scorecard_id
    where ss.id = new.scorecard_step_id;
    if parent_status = 'published'::public.content_status then
        perform private.assert_published_skill_dependency(new.skill_id);
        if new.dimension_item_id is not null then
            perform private.assert_active_dimension_item_dependency(new.dimension_item_id);
        end if;
    end if;
    return new;
end;
$$;

create or replace function private.enforce_scenario_quiz_dependency()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    parent_status public.content_status;
    dependency_status public.content_status;
    dependency_active boolean;
begin
    select status into parent_status from public.scenarios where id = new.scenario_id;
    if parent_status = 'published'::public.content_status then
        select status, is_active into dependency_status, dependency_active
        from public.quizzes where id = new.quiz_id for key share;
        if not found or dependency_status <> 'published'::public.content_status or not dependency_active then
            perform private.raise_content_lifecycle_conflict('Le quiz associé doit être publié et actif.');
        end if;
    end if;
    return new;
end;
$$;

create or replace function private.protect_active_dimension_item()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    item_id uuid := old.id;
    has_dependants boolean;
begin
    if tg_op = 'UPDATE' and (not old.is_active or new.is_active) then
        return new;
    end if;

    select exists(
        select 1
        from public.quiz_questions qq
        join public.quiz_steps qs on qs.id = qq.step_id
        join public.quizzes q on q.id = qs.quiz_id
        where qq.dimension_item_id = item_id and q.status = 'published'::public.content_status
        union all
        select 1
        from public.scorecard_criteria sc
        join public.scorecard_steps ss on ss.id = sc.scorecard_step_id
        join public.scorecards s on s.id = ss.scorecard_id
        where sc.dimension_item_id = item_id and s.status = 'published'::public.content_status
    ) into has_dependants;

    if has_dependants then
        perform private.raise_content_lifecycle_conflict(
            'Cet item de compétence est utilisé par un contenu publié.'
        );
    end if;
    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

create or replace function private.protect_method_step()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    has_dependants boolean;
begin
    select exists(
        select 1
        from public.quiz_steps qs join public.quizzes q on q.id = qs.quiz_id
        where qs.method_step_id = old.id and q.status = 'published'::public.content_status
        union all
        select 1
        from public.scorecard_steps ss join public.scorecards s on s.id = ss.scorecard_id
        where ss.method_step_id = old.id and s.status = 'published'::public.content_status
    ) into has_dependants;
    if has_dependants then
        perform private.raise_content_lifecycle_conflict(
            'Cette étape de méthode est utilisée par un contenu publié.'
        );
    end if;
    return old;
end;
$$;

do $$
declare
    definition record;
begin
    for definition in
        select * from (values
            ('coaches', 'coach'),
            ('methods', 'method'),
            ('personas', 'persona'),
            ('quizzes', 'quiz'),
            ('scenarios', 'roleplay'),
            ('scorecards', 'scorecard'),
            ('skills', 'skill')
        ) as definitions(table_name, entity_kind)
    loop
        execute format('drop trigger if exists enforce_content_status_transition on public.%I', definition.table_name);
        execute format(
            'create trigger enforce_content_status_transition before update of status on public.%I for each row execute function private.enforce_content_status_transition(%L)',
            definition.table_name,
            definition.entity_kind
        );
    end loop;
end;
$$;

drop trigger if exists enforce_published_scenario_dependencies on public.scenarios;
create trigger enforce_published_scenario_dependencies
before insert or update on public.scenarios
for each row execute function private.enforce_published_parent_dependencies();

drop trigger if exists enforce_published_quiz_dependencies on public.quizzes;
create trigger enforce_published_quiz_dependencies
before insert or update on public.quizzes
for each row execute function private.enforce_published_parent_dependencies();

drop trigger if exists enforce_published_scorecard_dependencies on public.scorecards;
create trigger enforce_published_scorecard_dependencies
before insert or update on public.scorecards
for each row execute function private.enforce_published_parent_dependencies();

drop trigger if exists enforce_quiz_step_dependency on public.quiz_steps;
create trigger enforce_quiz_step_dependency
before insert or update of quiz_id, method_step_id on public.quiz_steps
for each row execute function private.enforce_quiz_step_dependency();

drop trigger if exists enforce_quiz_competency_dependency on public.quiz_step_competencies;
create trigger enforce_quiz_competency_dependency
before insert or update on public.quiz_step_competencies
for each row execute function private.enforce_quiz_competency_dependency();

drop trigger if exists enforce_quiz_question_dependencies on public.quiz_questions;
create trigger enforce_quiz_question_dependencies
before insert or update of step_id, competence_id, dimension_item_id on public.quiz_questions
for each row execute function private.enforce_quiz_question_dependencies();

drop trigger if exists enforce_scorecard_step_dependency on public.scorecard_steps;
create trigger enforce_scorecard_step_dependency
before insert or update of scorecard_id, method_step_id on public.scorecard_steps
for each row execute function private.enforce_scorecard_step_dependency();

drop trigger if exists enforce_scorecard_criterion_dependencies on public.scorecard_criteria;
create trigger enforce_scorecard_criterion_dependencies
before insert or update of scorecard_step_id, skill_id, dimension_item_id on public.scorecard_criteria
for each row execute function private.enforce_scorecard_criterion_dependencies();

drop trigger if exists enforce_scenario_quiz_dependency on public.scenario_quizzes;
create trigger enforce_scenario_quiz_dependency
before insert or update on public.scenario_quizzes
for each row execute function private.enforce_scenario_quiz_dependency();

drop trigger if exists protect_active_dimension_item on public.skill_dimension_items;
create trigger protect_active_dimension_item
before update of is_active or delete on public.skill_dimension_items
for each row execute function private.protect_active_dimension_item();

drop trigger if exists protect_method_step on public.method_steps;
create trigger protect_method_step
before delete on public.method_steps
for each row execute function private.protect_method_step();

create or replace function public.admin_update_quiz_aggregate(
    p_quiz_id uuid,
    p_quiz jsonb,
    p_steps jsonb,
    p_competencies jsonb,
    p_questions jsonb,
    p_choices jsonb,
    p_attachments jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
    payload public.quizzes%rowtype;
begin
    perform 1 from public.quizzes where id = p_quiz_id for update;
    if not found then raise no_data_found; end if;
    select * into payload from jsonb_populate_record(null::public.quizzes, p_quiz);

    update public.quizzes set
        title = payload.title,
        description = payload.description,
        quiz_kind = payload.quiz_kind,
        quiz_type = payload.quiz_type,
        domain = payload.domain,
        category = payload.category,
        method_id = payload.method_id,
        duration_minutes = payload.duration_minutes,
        validation_threshold = payload.validation_threshold,
        max_attempts = payload.max_attempts,
        tags = payload.tags,
        visibility_scope = payload.visibility_scope,
        organization_id = payload.organization_id,
        group_id = payload.group_id,
        assigned_user_id = payload.assigned_user_id,
        participation = payload.participation,
        status = payload.status,
        is_active = payload.is_active,
        updated_at = payload.updated_at
    where id = p_quiz_id;

    delete from public.quiz_steps where quiz_id = p_quiz_id;
    insert into public.quiz_steps (id, quiz_id, method_step_id, step_order, name, weight)
    select id, quiz_id, method_step_id, step_order, name, weight
    from jsonb_populate_recordset(null::public.quiz_steps, coalesce(p_steps, '[]'::jsonb));
    insert into public.quiz_step_competencies (step_id, competence_id)
    select step_id, competence_id
    from jsonb_populate_recordset(null::public.quiz_step_competencies, coalesce(p_competencies, '[]'::jsonb));
    insert into public.quiz_questions (
        id, step_id, question_order, question_type, prompt, competence_id,
        dimension, dimension_item, dimension_item_id, points, explanation
    )
    select id, step_id, question_order, question_type, prompt, competence_id,
        dimension, dimension_item, dimension_item_id, points, explanation
    from jsonb_populate_recordset(null::public.quiz_questions, coalesce(p_questions, '[]'::jsonb));
    insert into public.quiz_question_choices (id, question_id, choice_order, label, is_correct)
    select id, question_id, choice_order, label, is_correct
    from jsonb_populate_recordset(null::public.quiz_question_choices, coalesce(p_choices, '[]'::jsonb));
    insert into public.quiz_question_attachments (
        id, question_id, attachment_order, attachment_type, label,
        external_url, storage_bucket, storage_path
    )
    select id, question_id, attachment_order, attachment_type, label,
        external_url, storage_bucket, storage_path
    from jsonb_populate_recordset(null::public.quiz_question_attachments, coalesce(p_attachments, '[]'::jsonb));
end;
$$;

create or replace function public.admin_update_scorecard_aggregate(
    p_scorecard_id uuid,
    p_scorecard jsonb,
    p_steps jsonb,
    p_criteria jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
    payload public.scorecards%rowtype;
begin
    perform 1 from public.scorecards where id = p_scorecard_id for update;
    if not found then raise no_data_found; end if;
    select * into payload from jsonb_populate_record(null::public.scorecards, p_scorecard);
    update public.scorecards set
        name = payload.name,
        description = payload.description,
        domain = payload.domain,
        category = payload.category,
        level = payload.level,
        method_id = payload.method_id,
        visibility_scope = payload.visibility_scope,
        organization_id = payload.organization_id,
        status = payload.status,
        is_active = payload.is_active,
        updated_at = payload.updated_at
    where id = p_scorecard_id;

    delete from public.scorecard_steps where scorecard_id = p_scorecard_id;
    insert into public.scorecard_steps (id, scorecard_id, method_step_id, step_order, name)
    select id, scorecard_id, method_step_id, step_order, name
    from jsonb_populate_recordset(null::public.scorecard_steps, coalesce(p_steps, '[]'::jsonb));
    insert into public.scorecard_criteria (
        id, scorecard_step_id, criterion_order, criterion_key, expected_evidence,
        skill_id, dimension, dimension_item_id, max_points, ai_instruction, verbatim
    )
    select id, scorecard_step_id, criterion_order, criterion_key, expected_evidence,
        skill_id, dimension, dimension_item_id, max_points, ai_instruction, verbatim
    from jsonb_populate_recordset(null::public.scorecard_criteria, coalesce(p_criteria, '[]'::jsonb));
end;
$$;

create or replace function public.admin_update_skill_aggregate(
    p_skill_id text,
    p_skill jsonb,
    p_items jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
    payload public.skills%rowtype;
begin
    perform 1 from public.skills where id = p_skill_id for update;
    if not found then raise no_data_found; end if;
    if exists(
        select 1
        from jsonb_populate_recordset(null::public.skill_dimension_items, coalesce(p_items, '[]'::jsonb)) incoming
        join public.skill_dimension_items existing on existing.id = incoming.id
        where existing.skill_id <> p_skill_id
    ) then
        perform private.raise_content_lifecycle_conflict('Un item appartient à une autre compétence.');
    end if;

    select * into payload from jsonb_populate_record(null::public.skills, p_skill);
    update public.skills set
        name = payload.name,
        description = payload.description,
        category = payload.category,
        domain = payload.domain,
        functions = payload.functions,
        visibility_scope = payload.visibility_scope,
        organization_id = payload.organization_id,
        group_id = payload.group_id,
        assigned_user_id = payload.assigned_user_id,
        status = payload.status,
        is_active = payload.is_active,
        updated_at = payload.updated_at
    where id = p_skill_id;

    update public.skill_dimension_items set is_active = false, updated_at = now()
    where skill_id = p_skill_id
      and id not in (
          select id from jsonb_populate_recordset(
              null::public.skill_dimension_items,
              coalesce(p_items, '[]'::jsonb)
          )
      );

    insert into public.skill_dimension_items (id, skill_id, dimension, label, item_order, is_active)
    select id, skill_id, dimension, label, item_order, true
    from jsonb_populate_recordset(null::public.skill_dimension_items, coalesce(p_items, '[]'::jsonb))
    on conflict (id) do update set
        dimension = excluded.dimension,
        label = excluded.label,
        item_order = excluded.item_order,
        is_active = true,
        updated_at = now();
end;
$$;

create or replace function public.admin_update_roleplay_aggregate(
    p_roleplay_id uuid,
    p_roleplay jsonb,
    p_quizzes jsonb,
    p_resources jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
    payload public.scenarios%rowtype;
begin
    perform 1 from public.scenarios where id = p_roleplay_id for update;
    if not found then raise no_data_found; end if;
    select * into payload from jsonb_populate_record(null::public.scenarios, p_roleplay);
    update public.scenarios set
        title = payload.title,
        description = payload.description,
        preview_title = payload.preview_title,
        preview_description = payload.preview_description,
        background_image_path = payload.background_image_path,
        persona_id = payload.persona_id,
        coach_id = payload.coach_id,
        method_id = payload.method_id,
        scorecard_id = payload.scorecard_id,
        coaching_steps = payload.coaching_steps,
        difficulty_level = payload.difficulty_level,
        notation_method_id = payload.notation_method_id,
        status = payload.status,
        domain = payload.domain,
        category = payload.category,
        disc_profile = payload.disc_profile,
        context = payload.context,
        objective = payload.objective,
        obstacles = payload.obstacles,
        visibility_scope = payload.visibility_scope,
        organization_id = payload.organization_id,
        group_id = payload.group_id,
        assigned_user_id = payload.assigned_user_id,
        is_active = payload.is_active,
        updated_at = payload.updated_at
    where id = p_roleplay_id;

    delete from public.scenario_quizzes where scenario_id = p_roleplay_id;
    insert into public.scenario_quizzes (scenario_id, quiz_id, sort_order, participation)
    select scenario_id, quiz_id, sort_order, participation
    from jsonb_populate_recordset(null::public.scenario_quizzes, coalesce(p_quizzes, '[]'::jsonb));
    delete from public.scenario_resources where scenario_id = p_roleplay_id;
    insert into public.scenario_resources (
        id, scenario_id, bucket, path, label, resource_type,
        external_url, sort_order, is_active
    )
    select id, scenario_id, bucket, path, label, resource_type,
        external_url, sort_order, is_active
    from jsonb_populate_recordset(null::public.scenario_resources, coalesce(p_resources, '[]'::jsonb));
end;
$$;

create or replace function public.admin_update_method_aggregate(
    p_method_id uuid,
    p_method jsonb,
    p_steps jsonb,
    p_resources jsonb,
    p_quiz_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
    payload public.methods%rowtype;
    method_row public.methods%rowtype;
    quiz_row public.quizzes%rowtype;
    notation_id uuid;
begin
    perform 1 from public.methods where id = p_method_id for update;
    if not found then raise no_data_found; end if;
    select * into payload from jsonb_populate_record(null::public.methods, p_method);
    update public.methods set
        name = payload.name,
        description = payload.description,
        subtitle = payload.subtitle,
        category = payload.category,
        domain = payload.domain,
        tag = payload.tag,
        reading_time_minutes = payload.reading_time_minutes,
        objectives = payload.objectives,
        challenges = payload.challenges,
        organization_id = payload.organization_id,
        scope = payload.scope,
        status = payload.status,
        is_active = payload.is_active,
        updated_at = payload.updated_at
    where id = p_method_id;

    delete from public.method_resources
    where method_id = p_method_id
      and id not in (
          select id from jsonb_populate_recordset(
              null::public.method_resources,
              coalesce(p_resources, '[]'::jsonb)
          )
      );

    update public.method_steps
    set step_order = step_order + 100000,
        step_key = '__lifecycle_tmp__' || id::text
    where method_id = p_method_id;

    insert into public.method_steps (
        id, method_id, step_order, step_key, code, title, weight, aliases,
        summary, icon, takeaway, objectives, best_practices, pitfalls,
        posture, verbatims, notation_step_id, short_title
    )
    select id, method_id, step_order, step_key, code, title, weight, aliases,
        summary, icon, takeaway, objectives, best_practices, pitfalls,
        posture, verbatims, notation_step_id, short_title
    from jsonb_populate_recordset(null::public.method_steps, coalesce(p_steps, '[]'::jsonb))
    on conflict (id) do update set
        step_order = excluded.step_order,
        step_key = excluded.step_key,
        code = excluded.code,
        title = excluded.title,
        weight = excluded.weight,
        aliases = excluded.aliases,
        summary = excluded.summary,
        icon = excluded.icon,
        takeaway = excluded.takeaway,
        objectives = excluded.objectives,
        best_practices = excluded.best_practices,
        pitfalls = excluded.pitfalls,
        posture = excluded.posture,
        verbatims = excluded.verbatims,
        notation_step_id = excluded.notation_step_id,
        short_title = excluded.short_title,
        updated_at = now();

    delete from public.method_steps
    where method_id = p_method_id
      and id not in (
          select id from jsonb_populate_recordset(
              null::public.method_steps,
              coalesce(p_steps, '[]'::jsonb)
          )
      );

    insert into public.method_resources (
        id, method_id, step_id, bucket, path, label, resource_type,
        external_url, duration_seconds, sort_order, is_active, notation_file_id
    )
    select id, method_id, step_id, bucket, path, label, resource_type,
        external_url, duration_seconds, sort_order, is_active, notation_file_id
    from jsonb_populate_recordset(null::public.method_resources, coalesce(p_resources, '[]'::jsonb))
    on conflict (id) do update set
        step_id = excluded.step_id,
        bucket = excluded.bucket,
        path = excluded.path,
        label = excluded.label,
        resource_type = excluded.resource_type,
        external_url = excluded.external_url,
        duration_seconds = excluded.duration_seconds,
        sort_order = excluded.sort_order,
        is_active = excluded.is_active,
        notation_file_id = excluded.notation_file_id,
        updated_at = now();

    select * into method_row from public.methods where id = p_method_id;
    if exists(
        select 1 from public.method_resources
        where method_id = p_method_id and step_id is null and bucket is not null and path is not null
    ) then
        notation_id := coalesce(method_row.notation_method_id, p_method_id);
        insert into public.notation_methods (
            id, code, name, version, description, is_active, is_default,
            prompt_synthese_id, prompt_methodo_id, prompt_discours_id,
            prompt_transcription_id, status, updated_at
        ) values (
            notation_id, method_row.code, method_row.name, method_row.version,
            method_row.description, method_row.is_active, false,
            method_row.prompt_synthese_id, method_row.prompt_methodo_id,
            method_row.prompt_discours_id, method_row.prompt_transcription_id,
            method_row.status, now()
        ) on conflict (id) do nothing;
        update public.methods set notation_method_id = notation_id where id = p_method_id;

        insert into public.notation_method_files (
            method_id, bucket, path, label, file_type, sort_order, is_active, updated_at
        )
        select notation_id, bucket, path, coalesce(label, path),
            coalesce(nullif(lower(substring(path from '\\.([a-z0-9]+)$')), ''), resource_type, 'pdf'),
            sort_order, true, now()
        from public.method_resources
        where method_id = p_method_id and step_id is null and bucket is not null and path is not null
        on conflict (method_id, bucket, path) do update set
            label = excluded.label,
            file_type = excluded.file_type,
            sort_order = excluded.sort_order,
            is_active = true,
            updated_at = now();

        update public.method_resources mr set notation_file_id = nmf.id
        from public.notation_method_files nmf
        where mr.method_id = p_method_id
          and mr.step_id is null
          and nmf.method_id = notation_id
          and nmf.bucket = mr.bucket
          and nmf.path = mr.path;
    end if;

    if p_quiz_id is not null then
        select * into quiz_row from public.quizzes where id = p_quiz_id for update;
        if not found then
            perform private.raise_content_lifecycle_conflict('Le quiz associé est introuvable.');
        end if;
        if quiz_row.method_id is not null and quiz_row.method_id <> p_method_id then
            perform private.raise_content_lifecycle_conflict('Ce quiz est déjà associé à une autre méthode.');
        end if;
        if method_row.status = 'published'::public.content_status
           and (quiz_row.status <> 'published'::public.content_status or not quiz_row.is_active) then
            perform private.raise_content_lifecycle_conflict('Le quiz associé doit être publié et actif.');
        end if;
    end if;

    update public.quizzes set method_id = null, quiz_kind = 'contextual'
    where method_id = p_method_id
      and quiz_kind = 'method_knowledge'
      and (p_quiz_id is null or id <> p_quiz_id);
    if p_quiz_id is not null then
        update public.quizzes set method_id = p_method_id, quiz_kind = 'method_knowledge'
        where id = p_quiz_id;
    end if;
end;
$$;

revoke all on function public.admin_update_quiz_aggregate(uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb)
from public, anon, authenticated;
revoke all on function public.admin_update_scorecard_aggregate(uuid, jsonb, jsonb, jsonb)
from public, anon, authenticated;
revoke all on function public.admin_update_skill_aggregate(text, jsonb, jsonb)
from public, anon, authenticated;
revoke all on function public.admin_update_roleplay_aggregate(uuid, jsonb, jsonb, jsonb)
from public, anon, authenticated;
revoke all on function public.admin_update_method_aggregate(uuid, jsonb, jsonb, jsonb, uuid)
from public, anon, authenticated;

grant execute on function public.admin_update_quiz_aggregate(uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb)
to service_role;
grant execute on function public.admin_update_scorecard_aggregate(uuid, jsonb, jsonb, jsonb)
to service_role;
grant execute on function public.admin_update_skill_aggregate(text, jsonb, jsonb)
to service_role;
grant execute on function public.admin_update_roleplay_aggregate(uuid, jsonb, jsonb, jsonb)
to service_role;
grant execute on function public.admin_update_method_aggregate(uuid, jsonb, jsonb, jsonb, uuid)
to service_role;

revoke all on function private.raise_content_lifecycle_conflict(text) from public, anon, authenticated;
revoke all on function private.assert_no_published_content_dependants(text, text) from public, anon, authenticated;
revoke all on function private.assert_published_skill_dependency(text) from public, anon, authenticated;
revoke all on function private.assert_active_dimension_item_dependency(uuid) from public, anon, authenticated;
