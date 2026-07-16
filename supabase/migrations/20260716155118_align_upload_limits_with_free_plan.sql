-- Keep bucket restrictions aligned with the current Supabase Free global limit.
update storage.buckets
set file_size_limit = 52428800
where id in ('notation_pdf', 'quizzes', 'resource_scenarios');
