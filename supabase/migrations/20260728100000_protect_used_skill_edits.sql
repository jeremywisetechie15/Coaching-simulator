-- Protect the identity and dimension structure of skills already exposed to learners.
-- The description remains editable so administrators can clarify existing content.

begin;

create or replace function private.skill_has_protected_usage(
    p_skill_id text
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
select exists (
    select 1
    from public.scorecard_criteria criterion
    join public.scorecard_steps step
      on step.id = criterion.scorecard_step_id
    join public.scenarios scenario
      on scenario.scorecard_id = step.scorecard_id
    where criterion.skill_id = p_skill_id
      and scenario.status in (
          'published'::public.content_status,
          'archived'::public.content_status
      )

    union all

    select 1
    from public.quiz_step_competencies competency
    join public.quiz_steps step
      on step.id = competency.step_id
    join public.quizzes quiz
      on quiz.id = step.quiz_id
    where competency.competence_id = p_skill_id
      and quiz.status in (
          'published'::public.content_status,
          'archived'::public.content_status
      )

    union all

    select 1
    from public.quiz_questions question
    join public.quiz_steps step
      on step.id = question.step_id
    join public.quizzes quiz
      on quiz.id = step.quiz_id
    where question.competence_id = p_skill_id
      and quiz.status in (
          'published'::public.content_status,
          'archived'::public.content_status
      )

    union all

    select 1
    from public.sessions session
    join public.scenarios scenario
      on scenario.id = session.scenario_id
    join public.scorecard_steps step
      on step.scorecard_id = scenario.scorecard_id
    join public.scorecard_criteria criterion
      on criterion.scorecard_step_id = step.id
    where criterion.skill_id = p_skill_id

    union all

    select 1
    from public.roleplay_session_criterion_results result
    left join public.skill_dimension_items dimension_item
      on dimension_item.id = result.dimension_item_id
    where result.skill_id = p_skill_id
       or dimension_item.skill_id = p_skill_id

    union all

    select 1
    from public.quiz_attempts attempt
    join public.quiz_steps step
      on step.quiz_id = attempt.quiz_id
    join public.quiz_step_competencies competency
      on competency.step_id = step.id
    where competency.competence_id = p_skill_id

    union all

    select 1
    from public.quiz_attempts attempt
    join public.quiz_steps step
      on step.quiz_id = attempt.quiz_id
    join public.quiz_questions question
      on question.step_id = step.id
    where question.competence_id = p_skill_id
);
$$;

create or replace function private.skill_locked_configuration_matches(
    p_skill_id text,
    p_skill jsonb,
    p_items jsonb
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
with
incoming_skill as (
    select *
    from jsonb_populate_record(null::public.skills, p_skill)
),
incoming_items as (
    select id, skill_id, dimension, label, item_order
    from jsonb_populate_recordset(
        null::public.skill_dimension_items,
        coalesce(p_items, '[]'::jsonb)
    )
)
select
    existing.name is not distinct from incoming.name
    and existing.skill_type is not distinct from incoming.skill_type
    and existing.domain is not distinct from incoming.domain
    and existing.category is not distinct from incoming.category
    and existing.visibility_scope is not distinct from incoming.visibility_scope
    and existing.organization_id is not distinct from incoming.organization_id
    and existing.group_id is not distinct from incoming.group_id
    and existing.assigned_user_id is not distinct from incoming.assigned_user_id
    and not exists (
        (
            select id, skill_id, dimension, label, item_order
            from public.skill_dimension_items
            where skill_id = p_skill_id
              and is_active
            except
            select id, skill_id, dimension, label, item_order
            from incoming_items
        )
        union all
        (
            select id, skill_id, dimension, label, item_order
            from incoming_items
            except
            select id, skill_id, dimension, label, item_order
            from public.skill_dimension_items
            where skill_id = p_skill_id
              and is_active
        )
    )
from public.skills existing
cross join incoming_skill incoming
where existing.id = p_skill_id;
$$;

create or replace function public.admin_skill_has_protected_usage(
    p_skill_id text
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
    select private.skill_has_protected_usage(p_skill_id);
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
    perform 1
    from public.skills
    where id = p_skill_id
    for update;
    if not found then
        raise no_data_found;
    end if;

    if exists (
        select 1
        from jsonb_populate_recordset(
            null::public.skill_dimension_items,
            coalesce(p_items, '[]'::jsonb)
        ) incoming
        where incoming.skill_id is distinct from p_skill_id
    ) then
        perform private.raise_content_lifecycle_conflict(
            'Un item doit appartenir à la compétence modifiée.'
        );
    end if;

    if exists (
        select 1
        from jsonb_populate_recordset(
            null::public.skill_dimension_items,
            coalesce(p_items, '[]'::jsonb)
        ) incoming
        join public.skill_dimension_items existing
          on existing.id = incoming.id
        where existing.skill_id <> p_skill_id
    ) then
        perform private.raise_content_lifecycle_conflict(
            'Un item appartient à une autre compétence.'
        );
    end if;

    if private.skill_has_protected_usage(p_skill_id)
       and not private.skill_locked_configuration_matches(
           p_skill_id,
           p_skill,
           p_items
       ) then
        perform private.raise_content_lifecycle_conflict(
            'Cette compétence est utilisée par un scénario ou un quiz qui n’est plus en brouillon. Seule sa description peut être modifiée. Dupliquez-la pour créer une nouvelle version.'
        );
    end if;

    select *
    into payload
    from jsonb_populate_record(null::public.skills, p_skill);

    update public.skills
    set name = payload.name,
        description = payload.description,
        skill_type = payload.skill_type,
        domain = payload.domain,
        category = payload.category,
        visibility_scope = payload.visibility_scope,
        organization_id = payload.organization_id,
        group_id = payload.group_id,
        assigned_user_id = payload.assigned_user_id,
        status = payload.status,
        is_active = payload.is_active,
        updated_at = payload.updated_at
    where id = p_skill_id;

    update public.skill_dimension_items
    set is_active = false,
        updated_at = now()
    where skill_id = p_skill_id
      and id not in (
          select id
          from jsonb_populate_recordset(
              null::public.skill_dimension_items,
              coalesce(p_items, '[]'::jsonb)
          )
      );

    insert into public.skill_dimension_items (
        id,
        skill_id,
        dimension,
        label,
        item_order,
        is_active
    )
    select id,
        skill_id,
        dimension,
        label,
        item_order,
        true
    from jsonb_populate_recordset(
        null::public.skill_dimension_items,
        coalesce(p_items, '[]'::jsonb)
    )
    on conflict (id) do update
    set dimension = excluded.dimension,
        label = excluded.label,
        item_order = excluded.item_order,
        is_active = true,
        updated_at = now();
end;
$$;

revoke all on function private.skill_has_protected_usage(text)
from public, anon, authenticated;
revoke all on function private.skill_locked_configuration_matches(text, jsonb, jsonb)
from public, anon, authenticated;
revoke all on function public.admin_skill_has_protected_usage(text)
from public, anon, authenticated;

grant execute on function private.skill_has_protected_usage(text)
to service_role;
grant execute on function private.skill_locked_configuration_matches(text, jsonb, jsonb)
to service_role;
grant execute on function public.admin_skill_has_protected_usage(text)
to service_role;

comment on function private.skill_has_protected_usage(text) is
    'SSOT for deciding whether learner-facing usage protects a skill configuration.';
comment on function private.skill_locked_configuration_matches(text, jsonb, jsonb) is
    'Compares every protected skill field and active dimension item, excluding description.';
comment on function public.admin_skill_has_protected_usage(text) is
    'Server-only usage flag for the skill editor.';

notify pgrst, 'reload schema';

commit;
