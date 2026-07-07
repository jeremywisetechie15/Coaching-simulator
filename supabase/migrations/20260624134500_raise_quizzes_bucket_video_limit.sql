-- Allow quiz attachment videos up to 250 Mo.

update storage.buckets
set file_size_limit = 262144000
where id = 'quizzes';
