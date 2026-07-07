-- Allow audio files as quiz question attachments.

alter table public.quiz_question_attachments
    drop constraint if exists quiz_question_attachments_type_check;

alter table public.quiz_question_attachments
    add constraint quiz_question_attachments_type_check
    check (attachment_type in ('link', 'image', 'video', 'audio', 'document'));

update storage.buckets
set allowed_mime_types = array[
    'application/msword',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/mpeg',
    'audio/mp4',
    'audio/ogg',
    'audio/wav',
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
where id = 'quizzes';

notify pgrst, 'reload schema';
