-- Draft quizzes are admin-only and may be saved before their audience is complete.
-- Publishing still requires every target needed by the selected visibility scope.

alter table public.quizzes
    drop constraint if exists quizzes_organization_required_for_private_check,
    drop constraint if exists quizzes_group_required_for_group_scope_check,
    drop constraint if exists quizzes_user_required_for_user_scope_check;

alter table public.quizzes
    add constraint quizzes_organization_required_for_private_check check (
        status <> 'published'::public.content_status
        or visibility_scope not in ('organization', 'group')
        or organization_id is not null
    ),
    add constraint quizzes_group_required_for_group_scope_check check (
        status <> 'published'::public.content_status
        or visibility_scope <> 'group'
        or group_id is not null
    ),
    add constraint quizzes_user_required_for_user_scope_check check (
        status <> 'published'::public.content_status
        or visibility_scope <> 'user'
        or assigned_user_id is not null
    );

comment on constraint quizzes_organization_required_for_private_check on public.quizzes is
    'Published organization/group quizzes require an organization; drafts may keep an incomplete target.';
comment on constraint quizzes_group_required_for_group_scope_check on public.quizzes is
    'Published group quizzes require a group; drafts may keep an incomplete target.';
comment on constraint quizzes_user_required_for_user_scope_check on public.quizzes is
    'Published user quizzes require an assigned user; drafts may keep an incomplete target.';
