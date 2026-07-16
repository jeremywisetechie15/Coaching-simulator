-- Close lifecycle gaps left by the first transactional enforcement pass.
--
-- Invariants:
-- - a published parent's audience must be included in every dependency audience;
-- - dependency rows stay share-locked while a parent is published;
-- - quiz and scorecard structures become immutable after producing learner history.

create or replace function private.can_read_group(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select private.is_platform_admin()
        or exists (
            select 1
            from public.groups g
            join public.group_members gm on gm.group_id = g.id
            where g.id = target_group_id
              and gm.user_id = (select auth.uid())
              and private.has_active_organization_membership(g.organization_id)
        );
$$;

revoke all on function private.can_read_group(uuid) from public, anon;
grant execute on function private.can_read_group(uuid) to authenticated;

create or replace function private.content_audience_covers_dependency(
    p_parent_scope text,
    p_parent_organization_id uuid,
    p_parent_group_id uuid,
    p_parent_user_id uuid,
    p_dependency_scope text,
    p_dependency_organization_id uuid,
    p_dependency_group_id uuid,
    p_dependency_user_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
    if p_dependency_scope = 'public' then
        return true;
    end if;

    case p_parent_scope
        when 'public' then
            return false;
        when 'organization' then
            return p_dependency_scope = 'organization'
                and p_dependency_organization_id = p_parent_organization_id;
        when 'group' then
            return (
                p_dependency_scope = 'organization'
                and p_dependency_organization_id = p_parent_organization_id
            ) or (
                p_dependency_scope = 'group'
                and p_dependency_group_id = p_parent_group_id
            );
        when 'user' then
            return (
                p_dependency_scope = 'user'
                and p_dependency_user_id = p_parent_user_id
            ) or (
                p_dependency_scope = 'organization'
                and exists (
                    select 1
                    from public.organization_members om
                    join public.organizations o on o.id = om.organization_id
                    where om.user_id = p_parent_user_id
                      and om.organization_id = p_dependency_organization_id
                      and om.status = 'active'
                      and o.status = 'active'
                )
            ) or (
                p_dependency_scope = 'group'
                and exists (
                    select 1
                    from public.group_members gm
                    join public.groups g on g.id = gm.group_id
                    join public.organization_members om
                      on om.organization_id = g.organization_id
                     and om.user_id = gm.user_id
                    join public.organizations o on o.id = om.organization_id
                    where gm.user_id = p_parent_user_id
                      and gm.group_id = p_dependency_group_id
                      and om.status = 'active'
                      and o.status = 'active'
                )
            );
        else
            return false;
    end case;
end;
$$;

create or replace function private.assert_content_audience_dependency(
    p_parent_scope text,
    p_parent_organization_id uuid,
    p_parent_group_id uuid,
    p_parent_user_id uuid,
    p_dependency_scope text,
    p_dependency_organization_id uuid,
    p_dependency_group_id uuid,
    p_dependency_user_id uuid,
    p_dependency_label text
)
returns void
language plpgsql
set search_path = ''
as $$
begin
    if not private.content_audience_covers_dependency(
        p_parent_scope,
        p_parent_organization_id,
        p_parent_group_id,
        p_parent_user_id,
        p_dependency_scope,
        p_dependency_organization_id,
        p_dependency_group_id,
        p_dependency_user_id
    ) then
        perform private.raise_content_lifecycle_conflict(
            'La portée de ' || p_dependency_label || ' ne couvre pas tous les destinataires du contenu.'
        );
    end if;
end;
$$;

create or replace function private.enforce_published_parent_dependencies()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    dependency_status public.content_status;
    dependency_active boolean;
    dependency_scope text;
    dependency_organization_id uuid;
begin
    if new.status <> 'published'::public.content_status then
        return new;
    end if;

    if tg_table_name = 'scenarios' then
        select status into dependency_status
        from public.personas where id = new.persona_id for share;
        if not found or dependency_status <> 'published'::public.content_status then
            perform private.raise_content_lifecycle_conflict('Le persona associé doit être publié.');
        end if;

        if new.coach_id is not null then
            select status into dependency_status
            from public.coaches where id = new.coach_id for share;
            if not found or dependency_status <> 'published'::public.content_status then
                perform private.raise_content_lifecycle_conflict('Le coach associé doit être publié.');
            end if;
        end if;

        if new.method_id is not null then
            select status, is_active, scope, organization_id
            into dependency_status, dependency_active, dependency_scope, dependency_organization_id
            from public.methods where id = new.method_id for share;
            if not found or dependency_status <> 'published'::public.content_status or not dependency_active then
                perform private.raise_content_lifecycle_conflict('La méthode associée doit être publiée et active.');
            end if;
            perform private.assert_content_audience_dependency(
                new.visibility_scope,
                new.organization_id,
                new.group_id,
                new.assigned_user_id,
                dependency_scope,
                dependency_organization_id,
                null,
                null,
                'la méthode associée'
            );
        end if;

        if new.scorecard_id is not null then
            select status, is_active, visibility_scope, organization_id
            into dependency_status, dependency_active, dependency_scope, dependency_organization_id
            from public.scorecards where id = new.scorecard_id for share;
            if not found or dependency_status <> 'published'::public.content_status or not dependency_active then
                perform private.raise_content_lifecycle_conflict('La scorecard associée doit être publiée et active.');
            end if;
            perform private.assert_content_audience_dependency(
                new.visibility_scope,
                new.organization_id,
                new.group_id,
                new.assigned_user_id,
                dependency_scope,
                dependency_organization_id,
                null,
                null,
                'la scorecard associée'
            );
        end if;
    elsif tg_table_name = 'quizzes' and new.method_id is not null then
        select status, is_active, scope, organization_id
        into dependency_status, dependency_active, dependency_scope, dependency_organization_id
        from public.methods where id = new.method_id for share;
        if not found or dependency_status <> 'published'::public.content_status or not dependency_active then
            perform private.raise_content_lifecycle_conflict('La méthode associée doit être publiée et active.');
        end if;
        perform private.assert_content_audience_dependency(
            new.visibility_scope,
            new.organization_id,
            new.group_id,
            new.assigned_user_id,
            dependency_scope,
            dependency_organization_id,
            null,
            null,
            'la méthode associée'
        );
    elsif tg_table_name = 'scorecards' then
        select status, is_active, scope, organization_id
        into dependency_status, dependency_active, dependency_scope, dependency_organization_id
        from public.methods where id = new.method_id for share;
        if not found or dependency_status <> 'published'::public.content_status or not dependency_active then
            perform private.raise_content_lifecycle_conflict('La méthode associée doit être publiée et active.');
        end if;
        perform private.assert_content_audience_dependency(
            new.visibility_scope,
            new.organization_id,
            null,
            null,
            dependency_scope,
            dependency_organization_id,
            null,
            null,
            'la méthode associée'
        );
    end if;

    return new;
end;
$$;

create or replace function private.enforce_quiz_step_dependency()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    quiz_status public.content_status;
    quiz_method_id uuid;
    step_method_id uuid;
    method_status public.content_status;
    method_active boolean;
begin
    select status, method_id into quiz_status, quiz_method_id
    from public.quizzes where id = new.quiz_id;

    if quiz_status <> 'published'::public.content_status or new.method_step_id is null then
        return new;
    end if;

    select ms.method_id, m.status, m.is_active
    into step_method_id, method_status, method_active
    from public.method_steps ms
    join public.methods m on m.id = ms.method_id
    where ms.id = new.method_step_id
    for share of ms, m;

    if not found or step_method_id is distinct from quiz_method_id
       or method_status <> 'published'::public.content_status or not method_active then
        perform private.raise_content_lifecycle_conflict(
            'Une étape du quiz ne correspond pas à la méthode publiée sélectionnée.'
        );
    end if;

    return new;
end;
$$;

create or replace function private.assert_published_skill_dependency(skill_id text)
returns void
language plpgsql
set search_path = ''
as $$
declare
    dependency_status public.content_status;
    dependency_active boolean;
begin
    select status, is_active into dependency_status, dependency_active
    from public.skills where id = skill_id for share;
    if not found or dependency_status <> 'published'::public.content_status or not dependency_active then
        perform private.raise_content_lifecycle_conflict('La compétence associée doit être publiée et active.');
    end if;
end;
$$;

create or replace function private.assert_published_scoped_skill_dependency(
    p_skill_id text,
    p_parent_scope text,
    p_parent_organization_id uuid,
    p_parent_group_id uuid,
    p_parent_user_id uuid
)
returns void
language plpgsql
set search_path = ''
as $$
declare
    dependency_status public.content_status;
    dependency_active boolean;
    dependency_scope text;
    dependency_organization_id uuid;
    dependency_group_id uuid;
    dependency_user_id uuid;
begin
    select status, is_active, visibility_scope, organization_id, group_id, assigned_user_id
    into dependency_status, dependency_active, dependency_scope,
        dependency_organization_id, dependency_group_id, dependency_user_id
    from public.skills where id = p_skill_id for share;

    if not found or dependency_status <> 'published'::public.content_status or not dependency_active then
        perform private.raise_content_lifecycle_conflict('La compétence associée doit être publiée et active.');
    end if;

    perform private.assert_content_audience_dependency(
        p_parent_scope,
        p_parent_organization_id,
        p_parent_group_id,
        p_parent_user_id,
        dependency_scope,
        dependency_organization_id,
        dependency_group_id,
        dependency_user_id,
        'la compétence associée'
    );
end;
$$;

create or replace function private.assert_active_dimension_item_dependency(item_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
    dependency_active boolean;
begin
    select is_active into dependency_active
    from public.skill_dimension_items where id = item_id for share;
    if not found or not dependency_active then
        perform private.raise_content_lifecycle_conflict('L’item de compétence associé doit être actif.');
    end if;
end;
$$;

create or replace function private.enforce_quiz_competency_dependency()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    parent_status public.content_status;
    parent_scope text;
    parent_organization_id uuid;
    parent_group_id uuid;
    parent_user_id uuid;
begin
    select q.status, q.visibility_scope, q.organization_id, q.group_id, q.assigned_user_id
    into parent_status, parent_scope, parent_organization_id, parent_group_id, parent_user_id
    from public.quiz_steps qs
    join public.quizzes q on q.id = qs.quiz_id
    where qs.id = new.step_id;

    if parent_status = 'published'::public.content_status then
        perform private.assert_published_scoped_skill_dependency(
            new.competence_id,
            parent_scope,
            parent_organization_id,
            parent_group_id,
            parent_user_id
        );
    end if;
    return new;
end;
$$;

create or replace function private.enforce_quiz_question_dependencies()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    parent_status public.content_status;
    parent_scope text;
    parent_organization_id uuid;
    parent_group_id uuid;
    parent_user_id uuid;
begin
    select q.status, q.visibility_scope, q.organization_id, q.group_id, q.assigned_user_id
    into parent_status, parent_scope, parent_organization_id, parent_group_id, parent_user_id
    from public.quiz_steps qs
    join public.quizzes q on q.id = qs.quiz_id
    where qs.id = new.step_id;

    if parent_status = 'published'::public.content_status then
        if new.competence_id is not null then
            perform private.assert_published_scoped_skill_dependency(
                new.competence_id,
                parent_scope,
                parent_organization_id,
                parent_group_id,
                parent_user_id
            );
        end if;
        if new.dimension_item_id is not null then
            perform private.assert_active_dimension_item_dependency(new.dimension_item_id);
        end if;
    end if;
    return new;
end;
$$;

create or replace function private.enforce_scorecard_step_dependency()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    parent_status public.content_status;
    parent_method_id uuid;
    step_method_id uuid;
begin
    select status, method_id into parent_status, parent_method_id
    from public.scorecards where id = new.scorecard_id;
    if parent_status <> 'published'::public.content_status then
        return new;
    end if;

    select method_id into step_method_id
    from public.method_steps where id = new.method_step_id for share;
    if not found or step_method_id is distinct from parent_method_id then
        perform private.raise_content_lifecycle_conflict(
            'Une étape de la scorecard ne correspond pas à la méthode sélectionnée.'
        );
    end if;
    return new;
end;
$$;

create or replace function private.enforce_scorecard_criterion_dependencies()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    parent_status public.content_status;
    parent_scope text;
    parent_organization_id uuid;
begin
    select s.status, s.visibility_scope, s.organization_id
    into parent_status, parent_scope, parent_organization_id
    from public.scorecard_steps ss
    join public.scorecards s on s.id = ss.scorecard_id
    where ss.id = new.scorecard_step_id;

    if parent_status = 'published'::public.content_status then
        perform private.assert_published_scoped_skill_dependency(
            new.skill_id,
            parent_scope,
            parent_organization_id,
            null,
            null
        );
        if new.dimension_item_id is not null then
            perform private.assert_active_dimension_item_dependency(new.dimension_item_id);
        end if;
    end if;
    return new;
end;
$$;

create or replace function private.enforce_scenario_quiz_dependency()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    parent_status public.content_status;
    parent_scope text;
    parent_organization_id uuid;
    parent_group_id uuid;
    parent_user_id uuid;
    dependency_status public.content_status;
    dependency_active boolean;
    dependency_scope text;
    dependency_organization_id uuid;
    dependency_group_id uuid;
    dependency_user_id uuid;
begin
    select status, visibility_scope, organization_id, group_id, assigned_user_id
    into parent_status, parent_scope, parent_organization_id, parent_group_id, parent_user_id
    from public.scenarios where id = new.scenario_id for share;

    if parent_status = 'published'::public.content_status then
        select status, is_active, visibility_scope, organization_id, group_id, assigned_user_id
        into dependency_status, dependency_active, dependency_scope,
            dependency_organization_id, dependency_group_id, dependency_user_id
        from public.quizzes where id = new.quiz_id for share;

        if not found or dependency_status <> 'published'::public.content_status or not dependency_active then
            perform private.raise_content_lifecycle_conflict('Le quiz associé doit être publié et actif.');
        end if;

        perform private.assert_content_audience_dependency(
            parent_scope,
            parent_organization_id,
            parent_group_id,
            parent_user_id,
            dependency_scope,
            dependency_organization_id,
            dependency_group_id,
            dependency_user_id,
            'le quiz associé'
        );
    end if;
    return new;
end;
$$;

create or replace function private.quiz_structure_matches(
    p_quiz_id uuid,
    p_steps jsonb,
    p_competencies jsonb,
    p_questions jsonb,
    p_choices jsonb,
    p_attachments jsonb
)
returns boolean
language sql
stable
set search_path = ''
as $$
with
incoming_steps as (
    select id, quiz_id, method_step_id, step_order, name, weight
    from jsonb_populate_recordset(null::public.quiz_steps, coalesce(p_steps, '[]'::jsonb))
),
incoming_competencies as (
    select step_id, competence_id
    from jsonb_populate_recordset(null::public.quiz_step_competencies, coalesce(p_competencies, '[]'::jsonb))
),
incoming_questions as (
    select id, step_id, question_order, question_type, prompt, competence_id,
        dimension, dimension_item, dimension_item_id, points, explanation
    from jsonb_populate_recordset(null::public.quiz_questions, coalesce(p_questions, '[]'::jsonb))
),
incoming_choices as (
    select id, question_id, choice_order, label, is_correct
    from jsonb_populate_recordset(null::public.quiz_question_choices, coalesce(p_choices, '[]'::jsonb))
),
incoming_attachments as (
    select id, question_id, attachment_order, attachment_type, label,
        external_url, storage_bucket, storage_path
    from jsonb_populate_recordset(null::public.quiz_question_attachments, coalesce(p_attachments, '[]'::jsonb))
)
select
    not exists (
        (select id, quiz_id, method_step_id, step_order, name, weight
         from public.quiz_steps where quiz_id = p_quiz_id
         except
         select id, quiz_id, method_step_id, step_order, name, weight from incoming_steps)
        union all
        (select id, quiz_id, method_step_id, step_order, name, weight from incoming_steps
         except
         select id, quiz_id, method_step_id, step_order, name, weight
         from public.quiz_steps where quiz_id = p_quiz_id)
    )
    and not exists (
        (select qsc.step_id, qsc.competence_id
         from public.quiz_step_competencies qsc
         join public.quiz_steps qs on qs.id = qsc.step_id
         where qs.quiz_id = p_quiz_id
         except
         select step_id, competence_id from incoming_competencies)
        union all
        (select step_id, competence_id from incoming_competencies
         except
         select qsc.step_id, qsc.competence_id
         from public.quiz_step_competencies qsc
         join public.quiz_steps qs on qs.id = qsc.step_id
         where qs.quiz_id = p_quiz_id)
    )
    and not exists (
        (select qq.id, qq.step_id, qq.question_order, qq.question_type, qq.prompt,
            qq.competence_id, qq.dimension, qq.dimension_item, qq.dimension_item_id,
            qq.points, qq.explanation
         from public.quiz_questions qq
         join public.quiz_steps qs on qs.id = qq.step_id
         where qs.quiz_id = p_quiz_id
         except
         select id, step_id, question_order, question_type, prompt, competence_id,
            dimension, dimension_item, dimension_item_id, points, explanation
         from incoming_questions)
        union all
        (select id, step_id, question_order, question_type, prompt, competence_id,
            dimension, dimension_item, dimension_item_id, points, explanation
         from incoming_questions
         except
         select qq.id, qq.step_id, qq.question_order, qq.question_type, qq.prompt,
            qq.competence_id, qq.dimension, qq.dimension_item, qq.dimension_item_id,
            qq.points, qq.explanation
         from public.quiz_questions qq
         join public.quiz_steps qs on qs.id = qq.step_id
         where qs.quiz_id = p_quiz_id)
    )
    and not exists (
        (select qc.id, qc.question_id, qc.choice_order, qc.label, qc.is_correct
         from public.quiz_question_choices qc
         join public.quiz_questions qq on qq.id = qc.question_id
         join public.quiz_steps qs on qs.id = qq.step_id
         where qs.quiz_id = p_quiz_id
         except
         select id, question_id, choice_order, label, is_correct from incoming_choices)
        union all
        (select id, question_id, choice_order, label, is_correct from incoming_choices
         except
         select qc.id, qc.question_id, qc.choice_order, qc.label, qc.is_correct
         from public.quiz_question_choices qc
         join public.quiz_questions qq on qq.id = qc.question_id
         join public.quiz_steps qs on qs.id = qq.step_id
         where qs.quiz_id = p_quiz_id)
    )
    and not exists (
        (select qa.id, qa.question_id, qa.attachment_order, qa.attachment_type,
            qa.label, qa.external_url, qa.storage_bucket, qa.storage_path
         from public.quiz_question_attachments qa
         join public.quiz_questions qq on qq.id = qa.question_id
         join public.quiz_steps qs on qs.id = qq.step_id
         where qs.quiz_id = p_quiz_id
         except
         select id, question_id, attachment_order, attachment_type,
            label, external_url, storage_bucket, storage_path
         from incoming_attachments)
        union all
        (select id, question_id, attachment_order, attachment_type,
            label, external_url, storage_bucket, storage_path
         from incoming_attachments
         except
         select qa.id, qa.question_id, qa.attachment_order, qa.attachment_type,
            qa.label, qa.external_url, qa.storage_bucket, qa.storage_path
         from public.quiz_question_attachments qa
         join public.quiz_questions qq on qq.id = qa.question_id
         join public.quiz_steps qs on qs.id = qq.step_id
         where qs.quiz_id = p_quiz_id)
    );
$$;

create or replace function private.scorecard_structure_matches(
    p_scorecard_id uuid,
    p_steps jsonb,
    p_criteria jsonb
)
returns boolean
language sql
stable
set search_path = ''
as $$
with
incoming_steps as (
    select id, scorecard_id, method_step_id, step_order, name
    from jsonb_populate_recordset(null::public.scorecard_steps, coalesce(p_steps, '[]'::jsonb))
),
incoming_criteria as (
    select id, scorecard_step_id, criterion_order, criterion_key, expected_evidence,
        skill_id, dimension, dimension_item_id, max_points, ai_instruction, verbatim
    from jsonb_populate_recordset(null::public.scorecard_criteria, coalesce(p_criteria, '[]'::jsonb))
)
select
    not exists (
        (select id, scorecard_id, method_step_id, step_order, name
         from public.scorecard_steps where scorecard_id = p_scorecard_id
         except
         select id, scorecard_id, method_step_id, step_order, name from incoming_steps)
        union all
        (select id, scorecard_id, method_step_id, step_order, name from incoming_steps
         except
         select id, scorecard_id, method_step_id, step_order, name
         from public.scorecard_steps where scorecard_id = p_scorecard_id)
    )
    and not exists (
        (select sc.id, sc.scorecard_step_id, sc.criterion_order, sc.criterion_key,
            sc.expected_evidence, sc.skill_id, sc.dimension, sc.dimension_item_id,
            sc.max_points, sc.ai_instruction, sc.verbatim
         from public.scorecard_criteria sc
         join public.scorecard_steps ss on ss.id = sc.scorecard_step_id
         where ss.scorecard_id = p_scorecard_id
         except
         select id, scorecard_step_id, criterion_order, criterion_key,
            expected_evidence, skill_id, dimension, dimension_item_id,
            max_points, ai_instruction, verbatim
         from incoming_criteria)
        union all
        (select id, scorecard_step_id, criterion_order, criterion_key,
            expected_evidence, skill_id, dimension, dimension_item_id,
            max_points, ai_instruction, verbatim
         from incoming_criteria
         except
         select sc.id, sc.scorecard_step_id, sc.criterion_order, sc.criterion_key,
            sc.expected_evidence, sc.skill_id, sc.dimension, sc.dimension_item_id,
            sc.max_points, sc.ai_instruction, sc.verbatim
         from public.scorecard_criteria sc
         join public.scorecard_steps ss on ss.id = sc.scorecard_step_id
         where ss.scorecard_id = p_scorecard_id)
    );
$$;

create or replace function public.admin_update_quiz_aggregate(
    p_quiz_id uuid,
    p_quiz jsonb,
    p_steps jsonb,
    p_competencies jsonb,
    p_questions jsonb,
    p_choices jsonb,
    p_attachments jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
    payload public.quizzes%rowtype;
    has_attempts boolean;
begin
    perform 1 from public.quizzes where id = p_quiz_id for update;
    if not found then raise no_data_found; end if;
    select * into payload from jsonb_populate_record(null::public.quizzes, p_quiz);

    select exists(
        select 1 from public.quiz_attempts where quiz_id = p_quiz_id
    ) into has_attempts;

    if has_attempts and not private.quiz_structure_matches(
        p_quiz_id,
        p_steps,
        p_competencies,
        p_questions,
        p_choices,
        p_attachments
    ) then
        perform private.raise_content_lifecycle_conflict(
            'Ce quiz contient des tentatives. Dupliquez-le pour modifier ses étapes ou ses questions.'
        );
    end if;

    update public.quizzes set
        title = payload.title,
        description = payload.description,
        quiz_kind = payload.quiz_kind,
        quiz_type = payload.quiz_type,
        domain = payload.domain,
        category = payload.category,
        method_id = payload.method_id,
        duration_minutes = payload.duration_minutes,
        validation_threshold = payload.validation_threshold,
        max_attempts = payload.max_attempts,
        tags = payload.tags,
        visibility_scope = payload.visibility_scope,
        organization_id = payload.organization_id,
        group_id = payload.group_id,
        assigned_user_id = payload.assigned_user_id,
        participation = payload.participation,
        status = payload.status,
        is_active = payload.is_active,
        updated_at = payload.updated_at
    where id = p_quiz_id;

    if not has_attempts then
        delete from public.quiz_steps where quiz_id = p_quiz_id;
        insert into public.quiz_steps (id, quiz_id, method_step_id, step_order, name, weight)
        select id, quiz_id, method_step_id, step_order, name, weight
        from jsonb_populate_recordset(null::public.quiz_steps, coalesce(p_steps, '[]'::jsonb));
        insert into public.quiz_step_competencies (step_id, competence_id)
        select step_id, competence_id
        from jsonb_populate_recordset(null::public.quiz_step_competencies, coalesce(p_competencies, '[]'::jsonb));
        insert into public.quiz_questions (
            id, step_id, question_order, question_type, prompt, competence_id,
            dimension, dimension_item, dimension_item_id, points, explanation
        )
        select id, step_id, question_order, question_type, prompt, competence_id,
            dimension, dimension_item, dimension_item_id, points, explanation
        from jsonb_populate_recordset(null::public.quiz_questions, coalesce(p_questions, '[]'::jsonb));
        insert into public.quiz_question_choices (id, question_id, choice_order, label, is_correct)
        select id, question_id, choice_order, label, is_correct
        from jsonb_populate_recordset(null::public.quiz_question_choices, coalesce(p_choices, '[]'::jsonb));
        insert into public.quiz_question_attachments (
            id, question_id, attachment_order, attachment_type, label,
            external_url, storage_bucket, storage_path
        )
        select id, question_id, attachment_order, attachment_type, label,
            external_url, storage_bucket, storage_path
        from jsonb_populate_recordset(null::public.quiz_question_attachments, coalesce(p_attachments, '[]'::jsonb));
    end if;
end;
$$;

create or replace function public.admin_update_scorecard_aggregate(
    p_scorecard_id uuid,
    p_scorecard jsonb,
    p_steps jsonb,
    p_criteria jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
    payload public.scorecards%rowtype;
    has_results boolean;
begin
    perform 1 from public.scorecards where id = p_scorecard_id for update;
    if not found then raise no_data_found; end if;
    select * into payload from jsonb_populate_record(null::public.scorecards, p_scorecard);

    select exists(
        select 1 from public.roleplay_session_results where scorecard_id = p_scorecard_id
        union all
        select 1 from public.roleplay_session_step_results where scorecard_id = p_scorecard_id
        union all
        select 1 from public.roleplay_session_criterion_results where scorecard_id = p_scorecard_id
        union all
        select 1
        from public.roleplay_session_step_results result
        join public.scorecard_steps step on step.id = result.scorecard_step_id
        where step.scorecard_id = p_scorecard_id
        union all
        select 1
        from public.roleplay_session_criterion_results result
        join public.scorecard_criteria criterion on criterion.id = result.scorecard_criterion_id
        join public.scorecard_steps step on step.id = criterion.scorecard_step_id
        where step.scorecard_id = p_scorecard_id
    ) into has_results;

    if has_results and not private.scorecard_structure_matches(p_scorecard_id, p_steps, p_criteria) then
        perform private.raise_content_lifecycle_conflict(
            'Cette scorecard contient des résultats de session. Dupliquez-la pour modifier ses étapes ou ses critères.'
        );
    end if;

    update public.scorecards set
        name = payload.name,
        description = payload.description,
        domain = payload.domain,
        category = payload.category,
        level = payload.level,
        method_id = payload.method_id,
        visibility_scope = payload.visibility_scope,
        organization_id = payload.organization_id,
        status = payload.status,
        is_active = payload.is_active,
        updated_at = payload.updated_at
    where id = p_scorecard_id;

    if not has_results then
        delete from public.scorecard_steps where scorecard_id = p_scorecard_id;
        insert into public.scorecard_steps (id, scorecard_id, method_step_id, step_order, name)
        select id, scorecard_id, method_step_id, step_order, name
        from jsonb_populate_recordset(null::public.scorecard_steps, coalesce(p_steps, '[]'::jsonb));
        insert into public.scorecard_criteria (
            id, scorecard_step_id, criterion_order, criterion_key, expected_evidence,
            skill_id, dimension, dimension_item_id, max_points, ai_instruction, verbatim
        )
        select id, scorecard_step_id, criterion_order, criterion_key, expected_evidence,
            skill_id, dimension, dimension_item_id, max_points, ai_instruction, verbatim
        from jsonb_populate_recordset(null::public.scorecard_criteria, coalesce(p_criteria, '[]'::jsonb));
    end if;
end;
$$;

-- The method owns the method-knowledge association, so it must also be able to
-- resolve the selected quiz for all of its viewers.
create or replace function public.admin_update_method_aggregate(
    p_method_id uuid,
    p_method jsonb,
    p_steps jsonb,
    p_resources jsonb,
    p_quiz_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
    payload public.methods%rowtype;
    method_row public.methods%rowtype;
    quiz_row public.quizzes%rowtype;
    notation_id uuid;
begin
    perform 1 from public.methods where id = p_method_id for update;
    if not found then raise no_data_found; end if;
    select * into payload from jsonb_populate_record(null::public.methods, p_method);
    update public.methods set
        name = payload.name,
        description = payload.description,
        subtitle = payload.subtitle,
        category = payload.category,
        domain = payload.domain,
        tag = payload.tag,
        reading_time_minutes = payload.reading_time_minutes,
        objectives = payload.objectives,
        challenges = payload.challenges,
        organization_id = payload.organization_id,
        scope = payload.scope,
        status = payload.status,
        is_active = payload.is_active,
        updated_at = payload.updated_at
    where id = p_method_id;

    delete from public.method_resources
    where method_id = p_method_id
      and id not in (
          select id from jsonb_populate_recordset(
              null::public.method_resources,
              coalesce(p_resources, '[]'::jsonb)
          )
      );

    update public.method_steps
    set step_order = step_order + 100000,
        step_key = '__lifecycle_tmp__' || id::text
    where method_id = p_method_id;

    insert into public.method_steps (
        id, method_id, step_order, step_key, code, title, weight, aliases,
        summary, icon, takeaway, objectives, best_practices, pitfalls,
        posture, verbatims, notation_step_id, short_title
    )
    select id, method_id, step_order, step_key, code, title, weight, aliases,
        summary, icon, takeaway, objectives, best_practices, pitfalls,
        posture, verbatims, notation_step_id, short_title
    from jsonb_populate_recordset(null::public.method_steps, coalesce(p_steps, '[]'::jsonb))
    on conflict (id) do update set
        step_order = excluded.step_order,
        step_key = excluded.step_key,
        code = excluded.code,
        title = excluded.title,
        weight = excluded.weight,
        aliases = excluded.aliases,
        summary = excluded.summary,
        icon = excluded.icon,
        takeaway = excluded.takeaway,
        objectives = excluded.objectives,
        best_practices = excluded.best_practices,
        pitfalls = excluded.pitfalls,
        posture = excluded.posture,
        verbatims = excluded.verbatims,
        notation_step_id = excluded.notation_step_id,
        short_title = excluded.short_title,
        updated_at = now();

    delete from public.method_steps
    where method_id = p_method_id
      and id not in (
          select id from jsonb_populate_recordset(
              null::public.method_steps,
              coalesce(p_steps, '[]'::jsonb)
          )
      );

    insert into public.method_resources (
        id, method_id, step_id, bucket, path, label, resource_type,
        external_url, duration_seconds, sort_order, is_active, notation_file_id
    )
    select id, method_id, step_id, bucket, path, label, resource_type,
        external_url, duration_seconds, sort_order, is_active, notation_file_id
    from jsonb_populate_recordset(null::public.method_resources, coalesce(p_resources, '[]'::jsonb))
    on conflict (id) do update set
        step_id = excluded.step_id,
        bucket = excluded.bucket,
        path = excluded.path,
        label = excluded.label,
        resource_type = excluded.resource_type,
        external_url = excluded.external_url,
        duration_seconds = excluded.duration_seconds,
        sort_order = excluded.sort_order,
        is_active = excluded.is_active,
        notation_file_id = excluded.notation_file_id,
        updated_at = now();

    select * into method_row from public.methods where id = p_method_id;
    if exists(
        select 1 from public.method_resources
        where method_id = p_method_id and step_id is null and bucket is not null and path is not null
    ) then
        notation_id := coalesce(method_row.notation_method_id, p_method_id);
        insert into public.notation_methods (
            id, code, name, version, description, is_active, is_default,
            prompt_synthese_id, prompt_methodo_id, prompt_discours_id,
            prompt_transcription_id, status, updated_at
        ) values (
            notation_id, method_row.code, method_row.name, method_row.version,
            method_row.description, method_row.is_active, false,
            method_row.prompt_synthese_id, method_row.prompt_methodo_id,
            method_row.prompt_discours_id, method_row.prompt_transcription_id,
            method_row.status, now()
        ) on conflict (id) do nothing;
        update public.methods set notation_method_id = notation_id where id = p_method_id;

        insert into public.notation_method_files (
            method_id, bucket, path, label, file_type, sort_order, is_active, updated_at
        )
        select notation_id, bucket, path, coalesce(label, path),
            coalesce(nullif(lower(substring(path from '\\.([a-z0-9]+)$')), ''), resource_type, 'pdf'),
            sort_order, true, now()
        from public.method_resources
        where method_id = p_method_id and step_id is null and bucket is not null and path is not null
        on conflict (method_id, bucket, path) do update set
            label = excluded.label,
            file_type = excluded.file_type,
            sort_order = excluded.sort_order,
            is_active = true,
            updated_at = now();

        update public.method_resources mr set notation_file_id = nmf.id
        from public.notation_method_files nmf
        where mr.method_id = p_method_id
          and mr.step_id is null
          and nmf.method_id = notation_id
          and nmf.bucket = mr.bucket
          and nmf.path = mr.path;
    end if;

    if p_quiz_id is not null then
        select * into quiz_row from public.quizzes where id = p_quiz_id for update;
        if not found then
            perform private.raise_content_lifecycle_conflict('Le quiz associé est introuvable.');
        end if;
        if quiz_row.method_id is not null and quiz_row.method_id <> p_method_id then
            perform private.raise_content_lifecycle_conflict('Ce quiz est déjà associé à une autre méthode.');
        end if;
        if method_row.status = 'published'::public.content_status
           and (quiz_row.status <> 'published'::public.content_status or not quiz_row.is_active) then
            perform private.raise_content_lifecycle_conflict('Le quiz associé doit être publié et actif.');
        end if;
        if method_row.status = 'published'::public.content_status then
            perform private.assert_content_audience_dependency(
                method_row.scope,
                method_row.organization_id,
                null,
                null,
                quiz_row.visibility_scope,
                quiz_row.organization_id,
                quiz_row.group_id,
                quiz_row.assigned_user_id,
                'le quiz associé'
            );
        end if;
    end if;

    update public.quizzes set method_id = null, quiz_kind = 'contextual'
    where method_id = p_method_id
      and quiz_kind = 'method_knowledge'
      and (p_quiz_id is null or id <> p_quiz_id);
    if p_quiz_id is not null then
        update public.quizzes set method_id = p_method_id, quiz_kind = 'method_knowledge'
        where id = p_quiz_id;
    end if;
end;
$$;

revoke all on function private.content_audience_covers_dependency(text, uuid, uuid, uuid, text, uuid, uuid, uuid)
from public, anon, authenticated;
revoke all on function private.assert_content_audience_dependency(text, uuid, uuid, uuid, text, uuid, uuid, uuid, text)
from public, anon, authenticated;
revoke all on function private.assert_published_scoped_skill_dependency(text, text, uuid, uuid, uuid)
from public, anon, authenticated;
revoke all on function private.quiz_structure_matches(uuid, jsonb, jsonb, jsonb, jsonb, jsonb)
from public, anon, authenticated;
revoke all on function private.scorecard_structure_matches(uuid, jsonb, jsonb)
from public, anon, authenticated;

revoke all on function public.admin_update_quiz_aggregate(uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb)
from public, anon, authenticated;
revoke all on function public.admin_update_scorecard_aggregate(uuid, jsonb, jsonb, jsonb)
from public, anon, authenticated;
revoke all on function public.admin_update_method_aggregate(uuid, jsonb, jsonb, jsonb, uuid)
from public, anon, authenticated;

grant execute on function public.admin_update_quiz_aggregate(uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb)
to service_role;
grant execute on function public.admin_update_scorecard_aggregate(uuid, jsonb, jsonb, jsonb)
to service_role;
grant execute on function public.admin_update_method_aggregate(uuid, jsonb, jsonb, jsonb, uuid)
to service_role;
