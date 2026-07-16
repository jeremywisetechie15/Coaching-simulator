revoke insert, update, delete
on table
    public.quiz_attempts,
    public.quiz_attempt_answers,
    public.quiz_attempt_answer_choices,
    public.quiz_attempt_step_scores
from authenticated;

drop policy if exists "Users can create their own quiz attempts"
    on public.quiz_attempts;
drop policy if exists "Users can update their own quiz attempts"
    on public.quiz_attempts;
drop policy if exists "Users can delete their own quiz attempts"
    on public.quiz_attempts;
drop policy if exists "Users can mutate their quiz attempt answers"
    on public.quiz_attempt_answers;
drop policy if exists "Users can mutate their quiz attempt answer choices"
    on public.quiz_attempt_answer_choices;
drop policy if exists "Users can mutate their quiz attempt step scores"
    on public.quiz_attempt_step_scores;

notify pgrst, 'reload schema';
