-- Keep the stable skill identity and evaluation structure protected while
-- allowing administrators to update the displayed skill name.

begin;

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
    existing.skill_type is not distinct from incoming.skill_type
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
            'Cette compétence est utilisée par un scénario ou un quiz qui n’est plus en brouillon. Son libellé et sa description peuvent être modifiés. Dupliquez-la pour modifier sa configuration.'
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

comment on function private.skill_locked_configuration_matches(text, jsonb, jsonb) is
    'Compares protected skill fields and active dimension items, excluding the displayed name and description.';

notify pgrst, 'reload schema';

commit;
