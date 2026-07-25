alter table public.organization_members
    add column if not exists invitation_sent_at timestamptz;

update public.organization_members
set invitation_sent_at = coalesce(updated_at, created_at, now())
where status = 'invited'
  and invitation_sent_at is null;

comment on column public.organization_members.invitation_sent_at is
    'Last successful initial or repeated organization invitation send; used for resend cooldown and audit.';
