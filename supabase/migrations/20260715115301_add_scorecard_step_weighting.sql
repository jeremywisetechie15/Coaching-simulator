alter table public.scorecard_steps
    add column if not exists weight_percent numeric(5, 2);

-- Preserve the relative importance of existing steps by deriving their first
-- explicit weights from the criterion points used by the previous formula.
with step_points as (
    select
        step.id,
        step.scorecard_id,
        step.step_order,
        coalesce(sum(criterion.max_points), 0)::numeric as points,
        count(*) over (partition by step.scorecard_id) as step_count
    from public.scorecard_steps step
    left join public.scorecard_criteria criterion
        on criterion.scorecard_step_id = step.id
    group by step.id, step.scorecard_id, step.step_order
), scorecard_points as (
    select
        step_points.*,
        sum(points) over (partition by scorecard_id) as total_points,
        min(points) over (partition by scorecard_id) as minimum_step_points
    from step_points
), inferred_weights as (
    select
        id,
        case
            when total_points > 0 and minimum_step_points > 0
                then round(points * 100 / total_points, 2)
            else round(100::numeric / step_count, 2)
        end as weight_percent
    from scorecard_points
)
update public.scorecard_steps step
set weight_percent = inferred_weights.weight_percent
from inferred_weights
where step.id = inferred_weights.id
  and step.weight_percent is null;

-- Rounding can produce 99.99 or 100.01. Apply the remainder to the last step
-- so every existing scorecard totals exactly 100 percent.
with scorecard_totals as (
    select scorecard_id, sum(weight_percent) as total_weight
    from public.scorecard_steps
    group by scorecard_id
), last_steps as (
    select distinct on (scorecard_id)
        id,
        scorecard_id
    from public.scorecard_steps
    order by scorecard_id, step_order desc, id desc
)
update public.scorecard_steps step
set weight_percent = step.weight_percent + (100 - scorecard_totals.total_weight)
from scorecard_totals
join last_steps on last_steps.scorecard_id = scorecard_totals.scorecard_id
where step.id = last_steps.id
  and scorecard_totals.total_weight <> 100;

alter table public.scorecard_steps
    alter column weight_percent set not null;

alter table public.scorecard_steps
    drop constraint if exists scorecard_steps_weight_percent_check;

alter table public.scorecard_steps
    add constraint scorecard_steps_weight_percent_check
    check (weight_percent > 0 and weight_percent <= 100);

comment on column public.scorecard_steps.weight_percent is
    'Explicit contribution of this step to the deterministic scorecard score; published scorecards total 100 percent.';

create or replace function private.scorecard_structure_matches(
    p_scorecard_id uuid,
    p_steps jsonb,
    p_criteria jsonb
)
returns boolean
language sql
stable
set search_path = ''
as $$
with
incoming_steps as (
    select id, scorecard_id, method_step_id, step_order, name, weight_percent
    from jsonb_populate_recordset(null::public.scorecard_steps, coalesce(p_steps, '[]'::jsonb))
),
incoming_criteria as (
    select id, scorecard_step_id, criterion_order, criterion_key, expected_evidence,
        skill_id, dimension, dimension_item_id, max_points, ai_instruction, verbatim
    from jsonb_populate_recordset(null::public.scorecard_criteria, coalesce(p_criteria, '[]'::jsonb))
)
select
    not exists (
        (select id, scorecard_id, method_step_id, step_order, name, weight_percent
         from public.scorecard_steps where scorecard_id = p_scorecard_id
         except
         select id, scorecard_id, method_step_id, step_order, name, weight_percent from incoming_steps)
        union all
        (select id, scorecard_id, method_step_id, step_order, name, weight_percent from incoming_steps
         except
         select id, scorecard_id, method_step_id, step_order, name, weight_percent
         from public.scorecard_steps where scorecard_id = p_scorecard_id)
    )
    and not exists (
        (select sc.id, sc.scorecard_step_id, sc.criterion_order, sc.criterion_key,
            sc.expected_evidence, sc.skill_id, sc.dimension, sc.dimension_item_id,
            sc.max_points, sc.ai_instruction, sc.verbatim
         from public.scorecard_criteria sc
         join public.scorecard_steps ss on ss.id = sc.scorecard_step_id
         where ss.scorecard_id = p_scorecard_id
         except
         select id, scorecard_step_id, criterion_order, criterion_key,
            expected_evidence, skill_id, dimension, dimension_item_id,
            max_points, ai_instruction, verbatim
         from incoming_criteria)
        union all
        (select id, scorecard_step_id, criterion_order, criterion_key,
            expected_evidence, skill_id, dimension, dimension_item_id,
            max_points, ai_instruction, verbatim
         from incoming_criteria
         except
         select sc.id, sc.scorecard_step_id, sc.criterion_order, sc.criterion_key,
            sc.expected_evidence, sc.skill_id, sc.dimension, sc.dimension_item_id,
            sc.max_points, sc.ai_instruction, sc.verbatim
         from public.scorecard_criteria sc
         join public.scorecard_steps ss on ss.id = sc.scorecard_step_id
         where ss.scorecard_id = p_scorecard_id)
    );
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
    has_results boolean;
    incoming_step_count integer;
    incoming_total_weight numeric;
    incoming_weights_valid boolean;
begin
    perform 1 from public.scorecards where id = p_scorecard_id for update;
    if not found then raise no_data_found; end if;
    select * into payload from jsonb_populate_record(null::public.scorecards, p_scorecard);

    if payload.status = 'published'::public.content_status then
        select
            count(*),
            coalesce(sum(weight_percent), 0),
            coalesce(bool_and(weight_percent > 0 and weight_percent <= 100), false)
        into incoming_step_count, incoming_total_weight, incoming_weights_valid
        from jsonb_populate_recordset(
            null::public.scorecard_steps,
            coalesce(p_steps, '[]'::jsonb)
        );

        if incoming_step_count = 0
            or not incoming_weights_valid
            or incoming_total_weight <> 100 then
            raise exception using
                errcode = '23514',
                message = 'La pondération des étapes d''une scorecard publiée doit totaliser 100%.';
        end if;
    end if;

    select exists(
        select 1 from public.roleplay_session_results where scorecard_id = p_scorecard_id
        union all
        select 1 from public.roleplay_session_step_results where scorecard_id = p_scorecard_id
        union all
        select 1 from public.roleplay_session_criterion_results where scorecard_id = p_scorecard_id
        union all
        select 1
        from public.roleplay_session_step_results result
        join public.scorecard_steps step on step.id = result.scorecard_step_id
        where step.scorecard_id = p_scorecard_id
        union all
        select 1
        from public.roleplay_session_criterion_results result
        join public.scorecard_criteria criterion on criterion.id = result.scorecard_criterion_id
        join public.scorecard_steps step on step.id = criterion.scorecard_step_id
        where step.scorecard_id = p_scorecard_id
    ) into has_results;

    if has_results and not private.scorecard_structure_matches(p_scorecard_id, p_steps, p_criteria) then
        perform private.raise_content_lifecycle_conflict(
            'Cette scorecard contient des résultats de session. Dupliquez-la pour modifier ses étapes, ses critères ou leur pondération.'
        );
    end if;

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

    if not has_results then
        delete from public.scorecard_steps where scorecard_id = p_scorecard_id;
        insert into public.scorecard_steps (
            id, scorecard_id, method_step_id, step_order, name, weight_percent
        )
        select id, scorecard_id, method_step_id, step_order, name, weight_percent
        from jsonb_populate_recordset(null::public.scorecard_steps, coalesce(p_steps, '[]'::jsonb));
        insert into public.scorecard_criteria (
            id, scorecard_step_id, criterion_order, criterion_key, expected_evidence,
            skill_id, dimension, dimension_item_id, max_points, ai_instruction, verbatim
        )
        select id, scorecard_step_id, criterion_order, criterion_key, expected_evidence,
            skill_id, dimension, dimension_item_id, max_points, ai_instruction, verbatim
        from jsonb_populate_recordset(null::public.scorecard_criteria, coalesce(p_criteria, '[]'::jsonb));
    end if;
end;
$$;
