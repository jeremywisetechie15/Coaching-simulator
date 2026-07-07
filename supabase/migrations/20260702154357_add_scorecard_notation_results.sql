-- Scorecard notation runtime and normalized roleplay result persistence.
-- Keeps the legacy PDF notation flow intact while adding a structured scorecard flow.

alter table public.sessions
    add column if not exists notation_status text not null default 'not_started',
    add column if not exists notation_error text,
    add column if not exists notation_generated_at timestamptz,
    add column if not exists notation_source text;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'sessions_notation_status_check'
    ) then
        alter table public.sessions
            add constraint sessions_notation_status_check
            check (notation_status in ('not_started', 'processing', 'completed', 'failed')) not valid;
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'sessions_notation_source_check'
    ) then
        alter table public.sessions
            add constraint sessions_notation_source_check
            check (notation_source is null or notation_source in ('legacy_pdf', 'scorecard')) not valid;
    end if;
end $$;

update public.sessions
set
    notation_status = case
        when notation_json is not null then 'completed'
        else notation_status
    end,
    notation_source = case
        when notation_json is not null and notation_source is null then 'legacy_pdf'
        else notation_source
    end,
    notation_generated_at = case
        when notation_json is not null and notation_generated_at is null then coalesce(created_at, now())
        else notation_generated_at
    end
where notation_json is not null
  and (
      notation_status is distinct from 'completed'
      or notation_source is null
      or notation_generated_at is null
  );

alter table public.sessions validate constraint sessions_notation_status_check;
alter table public.sessions validate constraint sessions_notation_source_check;

create index if not exists sessions_notation_status_idx
    on public.sessions(notation_status);

create index if not exists sessions_notation_source_idx
    on public.sessions(notation_source);

create table if not exists public.roleplay_session_results (
    session_id uuid primary key references public.sessions(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete set null,
    scenario_id uuid references public.scenarios(id) on delete cascade,
    method_id uuid references public.methods(id) on delete set null,
    scorecard_id uuid references public.scorecards(id) on delete set null,
    notation_source text not null,
    score_percent numeric(6, 2) not null,
    points_awarded numeric(10, 2),
    points_max numeric(10, 2),
    completed_at timestamptz not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint roleplay_session_results_notation_source_check
        check (notation_source in ('legacy_pdf', 'scorecard')),
    constraint roleplay_session_results_score_percent_check
        check (score_percent between 0 and 100),
    constraint roleplay_session_results_points_check
        check (
            (points_awarded is null and points_max is null)
            or (
                points_awarded is not null
                and points_max is not null
                and points_awarded >= 0
                and points_max >= 0
                and points_awarded <= points_max
            )
        )
);

create index if not exists roleplay_session_results_user_scenario_idx
    on public.roleplay_session_results(user_id, scenario_id);

create index if not exists roleplay_session_results_scenario_completed_idx
    on public.roleplay_session_results(scenario_id, completed_at desc);

create index if not exists roleplay_session_results_scorecard_idx
    on public.roleplay_session_results(scorecard_id);

create table if not exists public.roleplay_session_step_results (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.sessions(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete set null,
    scenario_id uuid references public.scenarios(id) on delete cascade,
    scorecard_id uuid references public.scorecards(id) on delete set null,
    scorecard_step_id uuid references public.scorecard_steps(id) on delete set null,
    method_step_id uuid references public.method_steps(id) on delete set null,
    step_order integer not null,
    title text not null,
    score_percent numeric(6, 2) not null,
    points_awarded numeric(10, 2),
    points_max numeric(10, 2),
    coach_comment text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint roleplay_session_step_results_step_order_check check (step_order >= 1),
    constraint roleplay_session_step_results_score_percent_check check (score_percent between 0 and 100),
    constraint roleplay_session_step_results_points_check
        check (
            (points_awarded is null and points_max is null)
            or (
                points_awarded is not null
                and points_max is not null
                and points_awarded >= 0
                and points_max >= 0
                and points_awarded <= points_max
            )
        ),
    constraint roleplay_session_step_results_session_order_key unique (session_id, step_order)
);

create index if not exists roleplay_session_step_results_session_idx
    on public.roleplay_session_step_results(session_id);

create index if not exists roleplay_session_step_results_user_scenario_idx
    on public.roleplay_session_step_results(user_id, scenario_id);

create index if not exists roleplay_session_step_results_method_step_idx
    on public.roleplay_session_step_results(method_step_id);

create table if not exists public.roleplay_session_criterion_results (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.sessions(id) on delete cascade,
    user_id uuid references public.profiles(id) on delete set null,
    scenario_id uuid references public.scenarios(id) on delete cascade,
    scorecard_id uuid references public.scorecards(id) on delete set null,
    scorecard_step_id uuid references public.scorecard_steps(id) on delete set null,
    scorecard_criterion_id uuid references public.scorecard_criteria(id) on delete set null,
    skill_id text references public.skills(id) on update cascade on delete set null,
    dimension text not null,
    dimension_item_id uuid references public.skill_dimension_items(id) on delete set null,
    criterion_ref text not null,
    points_awarded numeric(10, 2) not null,
    points_max numeric(10, 2) not null,
    score_percent numeric(6, 2) not null,
    evidence text,
    coach_comment text,
    advice text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint roleplay_session_criterion_results_dimension_check
        check (dimension in ('savoir', 'savoir_faire', 'savoir_etre')),
    constraint roleplay_session_criterion_results_ref_check
        check (length(btrim(criterion_ref)) > 0),
    constraint roleplay_session_criterion_results_points_check
        check (points_awarded >= 0 and points_max >= 0 and points_awarded <= points_max),
    constraint roleplay_session_criterion_results_score_percent_check
        check (score_percent between 0 and 100),
    constraint roleplay_session_criterion_results_session_ref_key unique (session_id, criterion_ref)
);

create index if not exists roleplay_session_criterion_results_session_idx
    on public.roleplay_session_criterion_results(session_id);

create index if not exists roleplay_session_criterion_results_user_scenario_idx
    on public.roleplay_session_criterion_results(user_id, scenario_id);

create index if not exists roleplay_session_criterion_results_skill_dimension_idx
    on public.roleplay_session_criterion_results(skill_id, dimension, dimension_item_id);

create index if not exists roleplay_session_criterion_results_scorecard_criterion_idx
    on public.roleplay_session_criterion_results(scorecard_criterion_id);

drop trigger if exists roleplay_session_results_set_updated_at on public.roleplay_session_results;
create trigger roleplay_session_results_set_updated_at
before update on public.roleplay_session_results
for each row execute function public.set_updated_at();

drop trigger if exists roleplay_session_step_results_set_updated_at on public.roleplay_session_step_results;
create trigger roleplay_session_step_results_set_updated_at
before update on public.roleplay_session_step_results
for each row execute function public.set_updated_at();

drop trigger if exists roleplay_session_criterion_results_set_updated_at on public.roleplay_session_criterion_results;
create trigger roleplay_session_criterion_results_set_updated_at
before update on public.roleplay_session_criterion_results
for each row execute function public.set_updated_at();

alter table public.roleplay_session_results enable row level security;
alter table public.roleplay_session_step_results enable row level security;
alter table public.roleplay_session_criterion_results enable row level security;

revoke all privileges on table public.roleplay_session_results from anon, authenticated;
revoke all privileges on table public.roleplay_session_step_results from anon, authenticated;
revoke all privileges on table public.roleplay_session_criterion_results from anon, authenticated;

grant select, insert, update, delete on table public.roleplay_session_results to authenticated, service_role;
grant select, insert, update, delete on table public.roleplay_session_step_results to authenticated, service_role;
grant select, insert, update, delete on table public.roleplay_session_criterion_results to authenticated, service_role;

drop policy if exists "Users can read their own roleplay session results" on public.roleplay_session_results;
create policy "Users can read their own roleplay session results"
    on public.roleplay_session_results
    for select
    to authenticated
    using (user_id = (select auth.uid()) or private.is_platform_admin());

drop policy if exists "Platform admins can mutate roleplay session results" on public.roleplay_session_results;
create policy "Platform admins can mutate roleplay session results"
    on public.roleplay_session_results
    for all
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

drop policy if exists "Users can read their own roleplay session step results" on public.roleplay_session_step_results;
create policy "Users can read their own roleplay session step results"
    on public.roleplay_session_step_results
    for select
    to authenticated
    using (user_id = (select auth.uid()) or private.is_platform_admin());

drop policy if exists "Platform admins can mutate roleplay session step results" on public.roleplay_session_step_results;
create policy "Platform admins can mutate roleplay session step results"
    on public.roleplay_session_step_results
    for all
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

drop policy if exists "Users can read their own roleplay session criterion results" on public.roleplay_session_criterion_results;
create policy "Users can read their own roleplay session criterion results"
    on public.roleplay_session_criterion_results
    for select
    to authenticated
    using (user_id = (select auth.uid()) or private.is_platform_admin());

drop policy if exists "Platform admins can mutate roleplay session criterion results" on public.roleplay_session_criterion_results;
create policy "Platform admins can mutate roleplay session criterion results"
    on public.roleplay_session_criterion_results
    for all
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

with scorecard_prompts(title, prompt) as (
    values
        (
            'notation.scorecard.methodo',
            'Tu es un evaluateur de simulation roleplay. Analyse uniquement la transcription fournie avec la methode et la scorecard fournies. Utilise exclusivement les references de criteres donnees dans la grille. Ne cree aucun critere, ne renomme aucune reference et ne retourne aucun ID de base de donnees. Pour chaque critere, attribue des points entre 0 et points_max selon les preuves observees dans la transcription, puis fournis une preuve courte, un commentaire coach et un conseil actionnable. Retourne uniquement le JSON attendu par le schema.'
        ),
        (
            'notation.scorecard.synthese',
            'Tu es un coach evaluateur. Produis une synthese globale coherente avec le resultat methodologique et le score global fournis. Ne reinvente pas les scores. Mets en avant les forces, les priorites de progression et les prochaines actions utiles. Retourne uniquement le JSON attendu par le schema.'
        ),
        (
            'notation.scorecard.discours',
            'Tu es un coach specialise dans l analyse du discours commercial. Analyse le discours a partir de la transcription, de la methode fournie et du resultat methodologique deja calcule. Ne modifie pas les scores. Identifie clarte, structure, ecoute, reformulation, impact et posture verbale. Retourne uniquement le JSON attendu par le schema.'
        ),
        (
            'notation.scorecard.transcription',
            'Tu es un assistant de transcription analytique. Structure la transcription fournie en moments cles utiles pour comprendre la simulation et relier les preuves observees aux etapes de la methode. Ne modifie pas les scores. Retourne uniquement le JSON attendu par le schema.'
        )
)
insert into public.prompts (title, prompt, status)
select scorecard_prompts.title, scorecard_prompts.prompt, 'published'::public.content_status
from scorecard_prompts
where not exists (
    select 1
    from public.prompts
    where public.prompts.title = scorecard_prompts.title
);

with scorecard_prompts(title, prompt) as (
    values
        (
            'notation.scorecard.methodo',
            'Tu es un evaluateur de simulation roleplay. Analyse uniquement la transcription fournie avec la methode et la scorecard fournies. Utilise exclusivement les references de criteres donnees dans la grille. Ne cree aucun critere, ne renomme aucune reference et ne retourne aucun ID de base de donnees. Pour chaque critere, attribue des points entre 0 et points_max selon les preuves observees dans la transcription, puis fournis une preuve courte, un commentaire coach et un conseil actionnable. Retourne uniquement le JSON attendu par le schema.'
        ),
        (
            'notation.scorecard.synthese',
            'Tu es un coach evaluateur. Produis une synthese globale coherente avec le resultat methodologique et le score global fournis. Ne reinvente pas les scores. Mets en avant les forces, les priorites de progression et les prochaines actions utiles. Retourne uniquement le JSON attendu par le schema.'
        ),
        (
            'notation.scorecard.discours',
            'Tu es un coach specialise dans l analyse du discours commercial. Analyse le discours a partir de la transcription, de la methode fournie et du resultat methodologique deja calcule. Ne modifie pas les scores. Identifie clarte, structure, ecoute, reformulation, impact et posture verbale. Retourne uniquement le JSON attendu par le schema.'
        ),
        (
            'notation.scorecard.transcription',
            'Tu es un assistant de transcription analytique. Structure la transcription fournie en moments cles utiles pour comprendre la simulation et relier les preuves observees aux etapes de la methode. Ne modifie pas les scores. Retourne uniquement le JSON attendu par le schema.'
        )
)
update public.prompts
set
    prompt = scorecard_prompts.prompt,
    status = 'published'::public.content_status
from scorecard_prompts
where public.prompts.title = scorecard_prompts.title;

comment on column public.sessions.notation_status is
    'Runtime status for notation generation: not_started, processing, completed or failed.';

comment on column public.sessions.notation_source is
    'Notation source used for the saved notation_json: legacy_pdf or scorecard.';

comment on table public.roleplay_session_results is
    'Normalized session-level roleplay notation results derived from sessions.notation_json.';

comment on table public.roleplay_session_step_results is
    'Normalized step-level roleplay notation results for progress and reporting.';

comment on table public.roleplay_session_criterion_results is
    'Normalized criterion-level roleplay notation results mapped to scorecard criteria and skill dimension items.';

notify pgrst, 'reload schema';
