alter table public.scenarios
    add column if not exists background_image_path text;

alter table public.coaches
    add column if not exists background_image_path text;

comment on column public.scenarios.background_image_path is
    'Private Storage path of the optional background used by persona roleplay sessions.';

comment on column public.coaches.background_image_path is
    'Private Storage path of the optional background used by audio coaching sessions.';

insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'session-backgrounds',
    'session-backgrounds',
    false,
    10485760,
    array[
        'image/jpeg',
        'image/png',
        'image/webp'
    ]::text[]
)
on conflict (id) do update
set
    allowed_mime_types = excluded.allowed_mime_types,
    file_size_limit = excluded.file_size_limit,
    name = excluded.name,
    public = excluded.public;

-- The application uploads with the server-only service role and serves short-lived signed URLs.
-- No anon/authenticated storage.objects policy is intentionally created for this private bucket.

notify pgrst, 'reload schema';
