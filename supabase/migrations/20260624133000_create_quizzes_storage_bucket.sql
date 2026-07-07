-- Dedicated private bucket for quiz question attachments.

insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'quizzes',
    'quizzes',
    false,
    262144000,
    array[
        'application/msword',
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/webp',
        'text/csv',
        'text/markdown',
        'text/plain',
        'text/x-markdown',
        'video/mp4',
        'video/quicktime',
        'video/webm'
    ]::text[]
)
on conflict (id) do update
set
    allowed_mime_types = excluded.allowed_mime_types,
    file_size_limit = excluded.file_size_limit,
    name = excluded.name,
    public = excluded.public;

drop policy if exists "Authenticated users can read quiz attachment files" on storage.objects;
create policy "Authenticated users can read quiz attachment files"
    on storage.objects
    for select
    to authenticated
    using (
        bucket_id = 'quizzes'
        and exists (
            select 1
            from public.quiz_question_attachments
            where quiz_question_attachments.storage_bucket = storage.objects.bucket_id
              and quiz_question_attachments.storage_path = storage.objects.name
        )
    );
