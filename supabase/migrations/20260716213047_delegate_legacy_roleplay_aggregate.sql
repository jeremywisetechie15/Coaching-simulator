create or replace function public.admin_update_roleplay_aggregate(
    p_roleplay_id uuid,
    p_roleplay jsonb,
    p_quizzes jsonb,
    p_resources jsonb,
    p_ai_instructions text
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

    if p_ai_instructions is not null then
        insert into public.scenario_ai_settings (scenario_id, ai_instructions)
        values (p_roleplay_id, btrim(p_ai_instructions))
        on conflict (scenario_id) do update set
            ai_instructions = excluded.ai_instructions,
            updated_at = now();
    end if;

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
begin
    perform public.admin_update_roleplay_aggregate(
        p_roleplay_id,
        p_roleplay,
        p_quizzes,
        p_resources,
        null::text
    );
end;
$$;

revoke all on function public.admin_update_roleplay_aggregate(uuid, jsonb, jsonb, jsonb, text)
from public, anon, authenticated;
grant execute on function public.admin_update_roleplay_aggregate(uuid, jsonb, jsonb, jsonb, text)
to service_role;

revoke all on function public.admin_update_roleplay_aggregate(uuid, jsonb, jsonb, jsonb)
from public, anon, authenticated;
grant execute on function public.admin_update_roleplay_aggregate(uuid, jsonb, jsonb, jsonb)
to service_role;
