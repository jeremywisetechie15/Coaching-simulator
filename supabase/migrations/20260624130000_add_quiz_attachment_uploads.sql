-- Allow quiz question attachments to point either to an external URL or to a stored file.

alter table public.quiz_question_attachments
    alter column external_url drop not null;

alter table public.quiz_question_attachments
    add column if not exists storage_bucket text,
    add column if not exists storage_path text;

alter table public.quiz_question_attachments
    drop constraint if exists quiz_question_attachments_type_check;

alter table public.quiz_question_attachments
    add constraint quiz_question_attachments_type_check
    check (attachment_type in ('link', 'image', 'video', 'document'));

alter table public.quiz_question_attachments
    drop constraint if exists quiz_question_attachments_location_check;

alter table public.quiz_question_attachments
    add constraint quiz_question_attachments_location_check
    check (
        nullif(btrim(coalesce(external_url, '')), '') is not null
        or (
            nullif(btrim(coalesce(storage_bucket, '')), '') is not null
            and nullif(btrim(coalesce(storage_path, '')), '') is not null
        )
    );

notify pgrst, 'reload schema';
