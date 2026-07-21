alter table public.scenarios
    alter column persona_id drop not null;

alter table public.scenarios
    drop constraint if exists scenarios_title_not_blank_check;

alter table public.scenarios
    add constraint scenarios_title_not_blank_check
    check (nullif(btrim(title::text), '') is not null)
    not valid;

alter table public.scenarios
    validate constraint scenarios_title_not_blank_check;

alter table public.scenarios
    drop constraint if exists scenarios_organization_required_for_private_check;

alter table public.scenarios
    add constraint scenarios_organization_required_for_private_check
    check (
        status <> 'published'::public.content_status
        or visibility_scope = 'public'
        or organization_id is not null
        or visibility_scope = 'user'
    );

alter table public.scenarios
    drop constraint if exists scenarios_group_required_for_group_scope_check;

alter table public.scenarios
    add constraint scenarios_group_required_for_group_scope_check
    check (
        status <> 'published'::public.content_status
        or visibility_scope <> 'group'
        or group_id is not null
    );

alter table public.scenarios
    drop constraint if exists scenarios_user_required_for_user_scope_check;

alter table public.scenarios
    add constraint scenarios_user_required_for_user_scope_check
    check (
        status <> 'published'::public.content_status
        or visibility_scope <> 'user'
        or assigned_user_id is not null
    );

alter table public.scenarios
    drop constraint if exists scenarios_published_required_fields_check;

-- Les roleplays publiés historiques restent lisibles. La règle s'applique à
-- toute nouvelle publication et à toute prochaine modification.
alter table public.scenarios
    add constraint scenarios_published_required_fields_check
    check (
        status <> 'published'::public.content_status
        or (
            persona_id is not null
            and coach_id is not null
            and method_id is not null
            and scorecard_id is not null
            and nullif(btrim(domain), '') is not null
            and nullif(btrim(category), '') is not null
        )
    ) not valid;
