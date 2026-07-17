-- RLS limits which profile row an authenticated user can update, while these
-- column privileges limit which attributes can be changed on that row.
-- Administrative writes keep using service_role and are intentionally
-- unaffected by this restriction.
revoke update on table public.profiles from authenticated;

grant update (
    name,
    first_name,
    last_name,
    bio,
    avatar_path,
    updated_at
) on table public.profiles to authenticated;
