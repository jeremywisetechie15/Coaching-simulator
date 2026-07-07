-- Quiz CRUD source of truth.
-- UI keeps the "Évaluations" wording, but persistence uses the product quiz model.

create table if not exists public.quizzes (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    quiz_kind text not null default 'contextual',
    quiz_type text not null default 'knowledge',
    domain text,
    category text,
    method_id uuid references public.methods(id) on delete set null,
    duration_minutes integer not null default 30,
    validation_threshold integer,
    max_attempts integer not null default 3,
    tags text[] not null default '{}',
    visibility_scope text not null default 'public',
    organization_id uuid references public.organizations(id) on delete set null,
    group_id uuid references public.groups(id) on delete set null,
    assigned_user_id uuid references public.profiles(id) on delete set null,
    participation text not null default 'optional',
    status public.content_status not null default 'draft'::public.content_status,
    is_active boolean not null default true,
    created_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint quizzes_quiz_kind_check check (quiz_kind in ('method_knowledge', 'contextual')),
    constraint quizzes_quiz_type_check check (quiz_type in ('knowledge', 'self_assessment')),
    constraint quizzes_duration_minutes_check check (duration_minutes >= 1),
    constraint quizzes_validation_threshold_check check (
        validation_threshold is null or validation_threshold between 0 and 100
    ),
    constraint quizzes_max_attempts_check check (max_attempts >= 1),
    constraint quizzes_visibility_scope_check check (visibility_scope in ('public', 'organization', 'group', 'user')),
    constraint quizzes_participation_check check (participation in ('optional', 'mandatory')),
    constraint quizzes_method_required_for_method_knowledge_check check (
        quiz_kind <> 'method_knowledge' or method_id is not null
    ),
    constraint quizzes_organization_required_for_private_check check (
        visibility_scope = 'public' or organization_id is not null or visibility_scope = 'user'
    ),
    constraint quizzes_group_required_for_group_scope_check check (
        visibility_scope <> 'group' or group_id is not null
    ),
    constraint quizzes_user_required_for_user_scope_check check (
        visibility_scope <> 'user' or assigned_user_id is not null
    )
);

create unique index if not exists quizzes_one_active_method_knowledge_quiz_idx
    on public.quizzes(method_id)
    where method_id is not null
      and quiz_kind = 'method_knowledge'
      and is_active = true
      and status <> 'archived'::public.content_status;

create index if not exists quizzes_status_active_idx
    on public.quizzes(status, is_active);

create index if not exists quizzes_method_id_idx
    on public.quizzes(method_id);

create index if not exists quizzes_visibility_scope_idx
    on public.quizzes(visibility_scope, organization_id, group_id, assigned_user_id);

create table if not exists public.quiz_steps (
    id uuid primary key default gen_random_uuid(),
    quiz_id uuid not null references public.quizzes(id) on delete cascade,
    method_step_id uuid references public.method_steps(id) on delete set null,
    step_order integer not null,
    name text not null,
    weight integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint quiz_steps_step_order_check check (step_order >= 1),
    constraint quiz_steps_weight_check check (weight between 0 and 100)
);

create unique index if not exists quiz_steps_quiz_order_key
    on public.quiz_steps(quiz_id, step_order);

create index if not exists quiz_steps_quiz_id_idx
    on public.quiz_steps(quiz_id);

create table if not exists public.quiz_step_competencies (
    step_id uuid not null references public.quiz_steps(id) on delete cascade,
    competence_id text not null,
    created_at timestamptz not null default now(),
    primary key (step_id, competence_id)
);

create table if not exists public.quiz_questions (
    id uuid primary key default gen_random_uuid(),
    step_id uuid not null references public.quiz_steps(id) on delete cascade,
    question_order integer not null,
    question_type text not null default 'QCU',
    prompt text not null,
    competence_id text,
    dimension text not null default 'savoir',
    dimension_item text,
    points integer not null default 1,
    explanation text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint quiz_questions_question_order_check check (question_order >= 1),
    constraint quiz_questions_question_type_check check (question_type in ('QCU', 'QCM')),
    constraint quiz_questions_dimension_check check (dimension in ('savoir', 'savoir_faire', 'savoir_etre')),
    constraint quiz_questions_points_check check (points >= 0)
);

create unique index if not exists quiz_questions_step_order_key
    on public.quiz_questions(step_id, question_order);

create index if not exists quiz_questions_step_id_idx
    on public.quiz_questions(step_id);

create table if not exists public.quiz_question_choices (
    id uuid primary key default gen_random_uuid(),
    question_id uuid not null references public.quiz_questions(id) on delete cascade,
    choice_order integer not null,
    label text not null,
    is_correct boolean not null default false,
    created_at timestamptz not null default now(),
    constraint quiz_question_choices_choice_order_check check (choice_order >= 1)
);

create unique index if not exists quiz_question_choices_question_order_key
    on public.quiz_question_choices(question_id, choice_order);

create index if not exists quiz_question_choices_question_id_idx
    on public.quiz_question_choices(question_id);

create table if not exists public.quiz_question_attachments (
    id uuid primary key default gen_random_uuid(),
    question_id uuid not null references public.quiz_questions(id) on delete cascade,
    attachment_order integer not null,
    attachment_type text not null,
    label text,
    external_url text,
    storage_bucket text,
    storage_path text,
    created_at timestamptz not null default now(),
    constraint quiz_question_attachments_order_check check (attachment_order >= 1),
    constraint quiz_question_attachments_type_check check (attachment_type in ('link', 'image', 'video', 'document')),
    constraint quiz_question_attachments_location_check check (
        nullif(btrim(coalesce(external_url, '')), '') is not null
        or (
            nullif(btrim(coalesce(storage_bucket, '')), '') is not null
            and nullif(btrim(coalesce(storage_path, '')), '') is not null
        )
    )
);

create unique index if not exists quiz_question_attachments_question_order_key
    on public.quiz_question_attachments(question_id, attachment_order);

create index if not exists quiz_question_attachments_question_id_idx
    on public.quiz_question_attachments(question_id);

drop trigger if exists quizzes_set_updated_at on public.quizzes;
create trigger quizzes_set_updated_at
before update on public.quizzes
for each row execute function public.set_updated_at();

drop trigger if exists quiz_steps_set_updated_at on public.quiz_steps;
create trigger quiz_steps_set_updated_at
before update on public.quiz_steps
for each row execute function public.set_updated_at();

drop trigger if exists quiz_questions_set_updated_at on public.quiz_questions;
create trigger quiz_questions_set_updated_at
before update on public.quiz_questions
for each row execute function public.set_updated_at();

alter table public.quizzes enable row level security;
alter table public.quiz_steps enable row level security;
alter table public.quiz_step_competencies enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_question_choices enable row level security;
alter table public.quiz_question_attachments enable row level security;

revoke all on table public.quizzes from anon;
revoke all on table public.quiz_steps from anon;
revoke all on table public.quiz_step_competencies from anon;
revoke all on table public.quiz_questions from anon;
revoke all on table public.quiz_question_choices from anon;
revoke all on table public.quiz_question_attachments from anon;

grant select, insert, update, delete on table public.quizzes to authenticated, service_role;
grant select, insert, update, delete on table public.quiz_steps to authenticated, service_role;
grant select, insert, update, delete on table public.quiz_step_competencies to authenticated, service_role;
grant select, insert, update, delete on table public.quiz_questions to authenticated, service_role;
grant select, insert, update, delete on table public.quiz_question_choices to authenticated, service_role;
grant select, insert, update, delete on table public.quiz_question_attachments to authenticated, service_role;

drop policy if exists "Authenticated users can read scoped published quizzes" on public.quizzes;
create policy "Authenticated users can read scoped published quizzes"
    on public.quizzes
    for select
    to authenticated
    using (
        private.is_platform_admin()
        or (
            is_active = true
            and status = 'published'::public.content_status
            and (
                visibility_scope = 'public'
                or (
                    visibility_scope = 'organization'
                    and organization_id is not null
                    and private.has_active_organization_membership(organization_id)
                )
                or (
                    visibility_scope = 'group'
                    and group_id is not null
                    and private.can_read_group(group_id)
                )
                or (
                    visibility_scope = 'user'
                    and assigned_user_id = (select auth.uid())
                )
            )
        )
    );

drop policy if exists "Platform admins can insert quizzes" on public.quizzes;
create policy "Platform admins can insert quizzes"
    on public.quizzes
    for insert
    to authenticated
    with check (private.is_platform_admin());

drop policy if exists "Platform admins can update quizzes" on public.quizzes;
create policy "Platform admins can update quizzes"
    on public.quizzes
    for update
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

drop policy if exists "Platform admins can delete quizzes" on public.quizzes;
create policy "Platform admins can delete quizzes"
    on public.quizzes
    for delete
    to authenticated
    using (private.is_platform_admin());

drop policy if exists "Authenticated users can read visible quiz steps" on public.quiz_steps;
create policy "Authenticated users can read visible quiz steps"
    on public.quiz_steps
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.quizzes
            where quizzes.id = quiz_steps.quiz_id
        )
    );

drop policy if exists "Platform admins can mutate quiz steps" on public.quiz_steps;
create policy "Platform admins can mutate quiz steps"
    on public.quiz_steps
    for all
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

drop policy if exists "Authenticated users can read visible quiz step competencies" on public.quiz_step_competencies;
create policy "Authenticated users can read visible quiz step competencies"
    on public.quiz_step_competencies
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.quiz_steps
            where quiz_steps.id = quiz_step_competencies.step_id
        )
    );

drop policy if exists "Platform admins can mutate quiz step competencies" on public.quiz_step_competencies;
create policy "Platform admins can mutate quiz step competencies"
    on public.quiz_step_competencies
    for all
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

drop policy if exists "Authenticated users can read visible quiz questions" on public.quiz_questions;
create policy "Authenticated users can read visible quiz questions"
    on public.quiz_questions
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.quiz_steps
            where quiz_steps.id = quiz_questions.step_id
        )
    );

drop policy if exists "Platform admins can mutate quiz questions" on public.quiz_questions;
create policy "Platform admins can mutate quiz questions"
    on public.quiz_questions
    for all
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

drop policy if exists "Authenticated users can read visible quiz choices" on public.quiz_question_choices;
create policy "Authenticated users can read visible quiz choices"
    on public.quiz_question_choices
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.quiz_questions
            where quiz_questions.id = quiz_question_choices.question_id
        )
    );

drop policy if exists "Platform admins can mutate quiz choices" on public.quiz_question_choices;
create policy "Platform admins can mutate quiz choices"
    on public.quiz_question_choices
    for all
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

drop policy if exists "Authenticated users can read visible quiz attachments" on public.quiz_question_attachments;
create policy "Authenticated users can read visible quiz attachments"
    on public.quiz_question_attachments
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.quiz_questions
            where quiz_questions.id = quiz_question_attachments.question_id
        )
    );

drop policy if exists "Platform admins can mutate quiz attachments" on public.quiz_question_attachments;
create policy "Platform admins can mutate quiz attachments"
    on public.quiz_question_attachments
    for all
    to authenticated
    using (private.is_platform_admin())
    with check (private.is_platform_admin());

comment on table public.quizzes is
    'Quiz definitions used by evaluations, methods and later roleplay quiz associations.';
comment on column public.quizzes.quiz_kind is
    'Business family: method_knowledge for method knowledge checks, contextual for product/document/context quizzes.';
comment on column public.quizzes.method_id is
    'Optional method association. Required for method_knowledge quizzes; no quiz_id is stored on methods.';

notify pgrst, 'reload schema';
