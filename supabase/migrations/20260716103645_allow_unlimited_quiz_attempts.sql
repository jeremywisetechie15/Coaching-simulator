alter table public.quizzes
    alter column max_attempts drop not null;

comment on column public.quizzes.max_attempts is
    'Maximum number of completed attempts allowed per user. NULL means unlimited; omitted values default to 3.';
