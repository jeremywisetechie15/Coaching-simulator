-- Quiz attempt persistence.
-- Keeps the repository schema reproducible and is idempotent for existing environments.

create table if not exists public.quiz_attempts (
    id uuid primary key default gen_random_uuid(),
    quiz_id uuid not null references public.quizzes(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    status text not null default 'in_progress',
    attempt_number integer not null,
    started_at timestamptz not null default now(),
    completed_at timestamptz,
    score_percent integer,
    earned_points integer not null default 0,
    max_points integer not null default 0,
    passed boolean,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint quiz_attempts_status_check check (status in ('in_progress', 'completed')),
    constraint quiz_attempts_attempt_number_check check (attempt_number >= 1),
    constraint quiz_attempts_score_percent_check check (
        score_percent is null or score_percent between 0 and 100
    ),
    constraint quiz_attempts_points_check check (earned_points >= 0 and max_points >= 0),
    constraint quiz_attempts_completed_consistency_check check (
        status <> 'completed'
        or (completed_at is not null and score_percent is not null and passed is not null)
    )
);

create unique index if not exists quiz_attempts_quiz_user_attempt_number_key
    on public.quiz_attempts(quiz_id, user_id, attempt_number);

create unique index if not exists quiz_attempts_one_in_progress_per_user_quiz_idx
    on public.quiz_attempts(quiz_id, user_id)
    where status = 'in_progress';

create index if not exists quiz_attempts_quiz_user_status_idx
    on public.quiz_attempts(quiz_id, user_id, status);

create table if not exists public.quiz_attempt_answers (
    id uuid primary key default gen_random_uuid(),
    attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
    question_id uuid not null references public.quiz_questions(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists quiz_attempt_answers_attempt_question_key
    on public.quiz_attempt_answers(attempt_id, question_id);

create index if not exists quiz_attempt_answers_attempt_id_idx
    on public.quiz_attempt_answers(attempt_id);

create table if not exists public.quiz_attempt_answer_choices (
    answer_id uuid not null references public.quiz_attempt_answers(id) on delete cascade,
    choice_id uuid not null references public.quiz_question_choices(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (answer_id, choice_id)
);

create index if not exists quiz_attempt_answer_choices_choice_id_idx
    on public.quiz_attempt_answer_choices(choice_id);

create table if not exists public.quiz_attempt_step_scores (
    attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
    quiz_step_id uuid not null references public.quiz_steps(id) on delete cascade,
    score_percent integer not null default 0,
    earned_points integer not null default 0,
    max_points integer not null default 0,
    weight integer not null default 0,
    created_at timestamptz not null default now(),
    primary key (attempt_id, quiz_step_id),
    constraint quiz_attempt_step_scores_score_percent_check check (score_percent between 0 and 100),
    constraint quiz_attempt_step_scores_points_check check (earned_points >= 0 and max_points >= 0),
    constraint quiz_attempt_step_scores_weight_check check (weight between 0 and 100)
);

drop trigger if exists quiz_attempts_set_updated_at on public.quiz_attempts;
create trigger quiz_attempts_set_updated_at
before update on public.quiz_attempts
for each row execute function public.set_updated_at();

drop trigger if exists quiz_attempt_answers_set_updated_at on public.quiz_attempt_answers;
create trigger quiz_attempt_answers_set_updated_at
before update on public.quiz_attempt_answers
for each row execute function public.set_updated_at();

alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_answers enable row level security;
alter table public.quiz_attempt_answer_choices enable row level security;
alter table public.quiz_attempt_step_scores enable row level security;

revoke all privileges on table public.quiz_attempts from anon, authenticated;
revoke all privileges on table public.quiz_attempt_answers from anon, authenticated;
revoke all privileges on table public.quiz_attempt_answer_choices from anon, authenticated;
revoke all privileges on table public.quiz_attempt_step_scores from anon, authenticated;

grant select, insert, update, delete on table public.quiz_attempts to authenticated, service_role;
grant select, insert, update, delete on table public.quiz_attempt_answers to authenticated, service_role;
grant select, insert, update, delete on table public.quiz_attempt_answer_choices to authenticated, service_role;
grant select, insert, update, delete on table public.quiz_attempt_step_scores to authenticated, service_role;

drop policy if exists "Users can read their own quiz attempts" on public.quiz_attempts;
create policy "Users can read their own quiz attempts"
    on public.quiz_attempts
    for select
    using (user_id = (select auth.uid()) or private.is_platform_admin());

drop policy if exists "Users can create their own quiz attempts" on public.quiz_attempts;
create policy "Users can create their own quiz attempts"
    on public.quiz_attempts
    for insert
    with check (user_id = (select auth.uid()) or private.is_platform_admin());

drop policy if exists "Users can update their own quiz attempts" on public.quiz_attempts;
create policy "Users can update their own quiz attempts"
    on public.quiz_attempts
    for update
    using (user_id = (select auth.uid()) or private.is_platform_admin())
    with check (user_id = (select auth.uid()) or private.is_platform_admin());

drop policy if exists "Users can delete their own quiz attempts" on public.quiz_attempts;
create policy "Users can delete their own quiz attempts"
    on public.quiz_attempts
    for delete
    using (user_id = (select auth.uid()) or private.is_platform_admin());

drop policy if exists "Users can read their quiz attempt answers" on public.quiz_attempt_answers;
create policy "Users can read their quiz attempt answers"
    on public.quiz_attempt_answers
    for select
    using (
        private.is_platform_admin()
        or exists (
            select 1
            from public.quiz_attempts
            where quiz_attempts.id = quiz_attempt_answers.attempt_id
              and quiz_attempts.user_id = (select auth.uid())
        )
    );

drop policy if exists "Users can mutate their quiz attempt answers" on public.quiz_attempt_answers;
create policy "Users can mutate their quiz attempt answers"
    on public.quiz_attempt_answers
    for all
    using (
        private.is_platform_admin()
        or exists (
            select 1
            from public.quiz_attempts
            where quiz_attempts.id = quiz_attempt_answers.attempt_id
              and quiz_attempts.user_id = (select auth.uid())
        )
    )
    with check (
        private.is_platform_admin()
        or exists (
            select 1
            from public.quiz_attempts
            where quiz_attempts.id = quiz_attempt_answers.attempt_id
              and quiz_attempts.user_id = (select auth.uid())
        )
    );

drop policy if exists "Users can read their quiz attempt answer choices" on public.quiz_attempt_answer_choices;
create policy "Users can read their quiz attempt answer choices"
    on public.quiz_attempt_answer_choices
    for select
    using (
        private.is_platform_admin()
        or exists (
            select 1
            from public.quiz_attempt_answers
            join public.quiz_attempts on quiz_attempts.id = quiz_attempt_answers.attempt_id
            where quiz_attempt_answers.id = quiz_attempt_answer_choices.answer_id
              and quiz_attempts.user_id = (select auth.uid())
        )
    );

drop policy if exists "Users can mutate their quiz attempt answer choices" on public.quiz_attempt_answer_choices;
create policy "Users can mutate their quiz attempt answer choices"
    on public.quiz_attempt_answer_choices
    for all
    using (
        private.is_platform_admin()
        or exists (
            select 1
            from public.quiz_attempt_answers
            join public.quiz_attempts on quiz_attempts.id = quiz_attempt_answers.attempt_id
            where quiz_attempt_answers.id = quiz_attempt_answer_choices.answer_id
              and quiz_attempts.user_id = (select auth.uid())
        )
    )
    with check (
        private.is_platform_admin()
        or exists (
            select 1
            from public.quiz_attempt_answers
            join public.quiz_attempts on quiz_attempts.id = quiz_attempt_answers.attempt_id
            where quiz_attempt_answers.id = quiz_attempt_answer_choices.answer_id
              and quiz_attempts.user_id = (select auth.uid())
        )
    );

drop policy if exists "Users can read their quiz attempt step scores" on public.quiz_attempt_step_scores;
create policy "Users can read their quiz attempt step scores"
    on public.quiz_attempt_step_scores
    for select
    using (
        private.is_platform_admin()
        or exists (
            select 1
            from public.quiz_attempts
            where quiz_attempts.id = quiz_attempt_step_scores.attempt_id
              and quiz_attempts.user_id = (select auth.uid())
        )
    );

drop policy if exists "Users can mutate their quiz attempt step scores" on public.quiz_attempt_step_scores;
create policy "Users can mutate their quiz attempt step scores"
    on public.quiz_attempt_step_scores
    for all
    using (
        private.is_platform_admin()
        or exists (
            select 1
            from public.quiz_attempts
            where quiz_attempts.id = quiz_attempt_step_scores.attempt_id
              and quiz_attempts.user_id = (select auth.uid())
        )
    )
    with check (
        private.is_platform_admin()
        or exists (
            select 1
            from public.quiz_attempts
            where quiz_attempts.id = quiz_attempt_step_scores.attempt_id
              and quiz_attempts.user_id = (select auth.uid())
        )
    );
