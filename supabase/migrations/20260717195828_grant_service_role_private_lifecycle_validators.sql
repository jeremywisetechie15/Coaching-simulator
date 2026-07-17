-- Aggregate content updates run through server-only, security-invoker RPCs.
-- Grant the service role only the private validation helpers those RPCs call.

grant usage on schema private to service_role;

grant execute on function private.raise_content_lifecycle_conflict(text)
to service_role;

grant execute on function private.content_audience_covers_dependency(
    text,
    uuid,
    uuid,
    uuid,
    text,
    uuid,
    uuid,
    uuid
)
to service_role;

grant execute on function private.assert_content_audience_dependency(
    text,
    uuid,
    uuid,
    uuid,
    text,
    uuid,
    uuid,
    uuid,
    text
)
to service_role;

grant execute on function private.quiz_structure_matches(
    uuid,
    jsonb,
    jsonb,
    jsonb,
    jsonb,
    jsonb
)
to service_role;

grant execute on function private.scorecard_structure_matches(uuid, jsonb, jsonb)
to service_role;
