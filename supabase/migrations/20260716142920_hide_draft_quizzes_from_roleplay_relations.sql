-- Quiz relations must inherit both the roleplay visibility and the quiz visibility.
-- Application routes are authenticated, so anonymous clients do not need direct
-- access to the association table.

revoke select on table public.scenario_quizzes from anon;

drop policy if exists "Public can read visible scenario quizzes"
    on public.scenario_quizzes;
drop policy if exists "Authenticated users can read visible scenario quizzes"
    on public.scenario_quizzes;

create policy "Authenticated users can read visible scenario quizzes"
    on public.scenario_quizzes
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.scenarios
            where scenarios.id = scenario_quizzes.scenario_id
        )
        and exists (
            select 1
            from public.quizzes
            where quizzes.id = scenario_quizzes.quiz_id
        )
    );

notify pgrst, 'reload schema';
