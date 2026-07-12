insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'personas-avatars',
    'personas-avatars',
    true,
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

-- Uploads are performed by the server-only service role after admin authorization.
-- Public access is intentionally limited to reading persona avatars by URL.
