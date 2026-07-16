alter table public.quiz_questions
    drop constraint if exists quiz_questions_dimension_check;

alter table public.quiz_questions
    add constraint quiz_questions_dimension_check
    check (dimension = 'savoir');
