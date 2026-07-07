-- Harden quiz table privileges exposed through the Data API.
-- RLS still controls row visibility; authenticated clients only need SELECT.

revoke all privileges on table public.quizzes from authenticated;
revoke all privileges on table public.quiz_steps from authenticated;
revoke all privileges on table public.quiz_step_competencies from authenticated;
revoke all privileges on table public.quiz_questions from authenticated;
revoke all privileges on table public.quiz_question_choices from authenticated;
revoke all privileges on table public.quiz_question_attachments from authenticated;

grant select on table public.quizzes to authenticated;
grant select on table public.quiz_steps to authenticated;
grant select on table public.quiz_step_competencies to authenticated;
grant select on table public.quiz_questions to authenticated;
grant select on table public.quiz_question_choices to authenticated;
grant select on table public.quiz_question_attachments to authenticated;

revoke all privileges on table public.quizzes from anon;
revoke all privileges on table public.quiz_steps from anon;
revoke all privileges on table public.quiz_step_competencies from anon;
revoke all privileges on table public.quiz_questions from anon;
revoke all privileges on table public.quiz_question_choices from anon;
revoke all privileges on table public.quiz_question_attachments from anon;

notify pgrst, 'reload schema';
