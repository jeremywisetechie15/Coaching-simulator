alter table public.scenarios
    add column if not exists preview_title text,
    add column if not exists preview_description text;

comment on column public.scenarios.preview_title is
    'Short title displayed on roleplay preview cards.';

comment on column public.scenarios.preview_description is
    'Short description displayed on roleplay preview cards.';

notify pgrst, 'reload schema';
