-- Align skills with the shared content taxonomy used by methods and the MAIA Coach reference form.
-- The former `category` column stored the skill type. Preserve it under an explicit name,
-- add the actual domain category, and remove the obsolete business-functions array.

begin;

alter table public.skills
    drop constraint if exists skills_category_check;

alter table public.skills
    rename column category to skill_type;

alter table public.skills
    add column category text;

-- "Méthode ACDC" was a method name incorrectly stored as a domain. All related
-- seeded competencies are commercial; categories remain null rather than guessed.
update public.skills
set domain = 'Commercial'
where domain = 'Méthode ACDC';

alter table public.skills
    drop column functions;

alter table public.skills
    add constraint skills_skill_type_check
        check (skill_type in ('Métier', 'Comportementale', 'Transversale'))
        not valid,
    add constraint skills_domain_check
        check (
            domain is null
            or domain in ('Commercial', 'Management', 'Communication', 'Ressources humaines')
        )
        not valid,
    add constraint skills_category_domain_check
        check (
            category is null
            or (
                domain is not null
                and (
                    (domain = 'Commercial' and category in (
                        'Prospection',
                        'Négociation',
                        'Vente',
                        'Recommandation',
                        'Prise de rendez-vous'
                    ))
                    or (domain = 'Management' and category in (
                        'Entretien de Remobilisation',
                        'Feedback',
                        'Pilotage'
                    ))
                    or (domain = 'Communication' and category in (
                        'Prise de parole',
                        'Communication écrite',
                        'Gestion des conflits'
                    ))
                    or (domain = 'Ressources humaines' and category in (
                        'Recrutement',
                        'Onboarding'
                    ))
                )
            )
        )
        not valid;

alter table public.skills validate constraint skills_skill_type_check;
alter table public.skills validate constraint skills_domain_check;
alter table public.skills validate constraint skills_category_domain_check;

alter index if exists public.skills_category_idx
    rename to skills_skill_type_idx;

create index if not exists skills_domain_category_idx
    on public.skills(domain, category);

comment on column public.skills.skill_type is
    'Skill type: Métier, Comportementale or Transversale.';

comment on column public.skills.domain is
    'Domain from the shared content taxonomy.';

comment on column public.skills.category is
    'Optional category constrained by the selected shared taxonomy domain.';

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
        from jsonb_populate_recordset(
            null::public.skill_dimension_items,
            coalesce(p_items, '[]'::jsonb)
        ) incoming
        join public.skill_dimension_items existing on existing.id = incoming.id
        where existing.skill_id <> p_skill_id
    ) then
        perform private.raise_content_lifecycle_conflict(
            'Un item appartient à une autre compétence.'
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

notify pgrst, 'reload schema';

commit;
