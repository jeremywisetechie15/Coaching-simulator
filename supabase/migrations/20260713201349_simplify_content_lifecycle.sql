-- Keep the lifecycle intentionally small:
-- draft -> published -> archived, with archived as a terminal soft-delete.
-- Dependency status no longer controls publication or archival. Historical
-- quiz attempts and scorecard results remain protected by the aggregate RPCs.

create or replace function private.enforce_content_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    old_status public.content_status := (to_jsonb(old)->>'status')::public.content_status;
    new_status public.content_status := (to_jsonb(new)->>'status')::public.content_status;
begin
    if old_status = 'published'::public.content_status
       and new_status = 'draft'::public.content_status then
        perform private.raise_content_lifecycle_conflict(
            'Un contenu publié ne peut pas repasser en brouillon. Archivez-le lorsqu’il ne doit plus être visible.'
        );
    end if;

    if old_status = 'archived'::public.content_status
       and new_status <> 'archived'::public.content_status then
        perform private.raise_content_lifecycle_conflict(
            'Un contenu archivé ne peut pas être restauré. Dupliquez-le pour créer un nouveau brouillon.'
        );
    end if;

    return new;
end;
$$;

drop trigger if exists enforce_published_scenario_dependencies on public.scenarios;
drop trigger if exists enforce_published_quiz_dependencies on public.quizzes;
drop trigger if exists enforce_published_scorecard_dependencies on public.scorecards;
drop trigger if exists enforce_quiz_step_dependency on public.quiz_steps;
drop trigger if exists enforce_quiz_competency_dependency on public.quiz_step_competencies;
drop trigger if exists enforce_quiz_question_dependencies on public.quiz_questions;
drop trigger if exists enforce_scorecard_step_dependency on public.scorecard_steps;
drop trigger if exists enforce_scorecard_criterion_dependencies on public.scorecard_criteria;
drop trigger if exists enforce_scenario_quiz_dependency on public.scenario_quizzes;
drop trigger if exists protect_active_dimension_item on public.skill_dimension_items;
drop trigger if exists protect_method_step on public.method_steps;

drop function if exists private.assert_no_published_content_dependants(text, text);
drop function if exists private.enforce_published_parent_dependencies();
drop function if exists private.enforce_quiz_step_dependency();
drop function if exists private.enforce_quiz_competency_dependency();
drop function if exists private.enforce_quiz_question_dependencies();
drop function if exists private.enforce_scorecard_step_dependency();
drop function if exists private.enforce_scorecard_criterion_dependencies();
drop function if exists private.enforce_scenario_quiz_dependency();
drop function if exists private.protect_active_dimension_item();
drop function if exists private.protect_method_step();
drop function if exists private.assert_published_scoped_skill_dependency(text, text, uuid, uuid, uuid);
drop function if exists private.assert_published_skill_dependency(text);
drop function if exists private.assert_active_dimension_item_dependency(uuid);

-- The method aggregate keeps transactional writes and scope validation, but a
-- draft or archived quiz no longer blocks the method lifecycle.
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
            method_row.prompt_synthese_id, method_row.prompt_methodo_id, method_row.prompt_discours_id,
            method_row.prompt_transcription_id, method_row.status, now()
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
        if method_row.status = 'published'::public.content_status then
            perform private.assert_content_audience_dependency(
                method_row.scope,
                method_row.organization_id,
                null,
                null,
                quiz_row.visibility_scope,
                quiz_row.organization_id,
                quiz_row.group_id,
                quiz_row.assigned_user_id,
                'le quiz associé'
            );
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

revoke all on function public.admin_update_method_aggregate(uuid, jsonb, jsonb, jsonb, uuid)
from public, anon, authenticated;
grant execute on function public.admin_update_method_aggregate(uuid, jsonb, jsonb, jsonb, uuid)
to service_role;
