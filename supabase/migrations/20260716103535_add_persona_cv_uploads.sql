create table if not exists public.persona_cv_documents (
    persona_id uuid primary key references public.personas(id) on delete cascade,
    storage_path text not null unique,
    file_name text not null,
    mime_type text not null,
    size_bytes bigint not null,
    uploaded_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint persona_cv_documents_file_name_check
        check (char_length(file_name) between 1 and 255),
    constraint persona_cv_documents_mime_type_check
        check (mime_type = 'application/pdf'),
    constraint persona_cv_documents_size_bytes_check
        check (size_bytes between 1 and 5242880),
    constraint persona_cv_documents_owned_path_check
        check (storage_path like ('personas/' || persona_id::text || '/cv/_%'))
);

comment on table public.persona_cv_documents is
    'Private CV metadata for personas. File access is restricted to server-authorized admins.';
comment on column public.persona_cv_documents.storage_path is
    'Server-generated path in the private personas-cvs Storage bucket.';

alter table public.persona_cv_documents enable row level security;

-- CV metadata is deliberately unavailable through authenticated/anonymous Data API calls.
-- The server uses the service role only after requireAdmin() authorization.
revoke all on table public.persona_cv_documents from public, anon, authenticated;
grant select, insert, update, delete on table public.persona_cv_documents to service_role;

drop trigger if exists persona_cv_documents_set_updated_at on public.persona_cv_documents;
create trigger persona_cv_documents_set_updated_at
before update on public.persona_cv_documents
for each row execute function public.set_updated_at();

insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'personas-cvs',
    'personas-cvs',
    false,
    5242880,
    array['application/pdf']::text[]
)
on conflict (id) do update
set
    allowed_mime_types = excluded.allowed_mime_types,
    file_size_limit = excluded.file_size_limit,
    name = excluded.name,
    public = excluded.public;

-- No storage.objects policy is created for this bucket. All uploads, downloads and
-- removals go through the server-only service role after application authorization.
