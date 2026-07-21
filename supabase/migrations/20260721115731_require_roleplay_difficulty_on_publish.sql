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
            and difficulty_level is not null
            and method_id is not null
            and scorecard_id is not null
            and nullif(btrim(domain), '') is not null
            and nullif(btrim(category), '') is not null
        )
    ) not valid;
