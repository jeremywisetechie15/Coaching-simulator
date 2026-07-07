-- Dedicated JSON output schema for scorecard-based roleplay notation.
-- Legacy method/PDF notation keeps using the existing legacy_pdf/methodo schema.

alter table public.notation_output_schemas
    add column if not exists notation_source text not null default 'legacy_pdf';

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'notation_output_schemas_source_check'
          and conrelid = 'public.notation_output_schemas'::regclass
    ) then
        alter table public.notation_output_schemas
            add constraint notation_output_schemas_source_check
            check (notation_source in ('legacy_pdf', 'scorecard')) not valid;
    end if;
end $$;

alter table public.notation_output_schemas
    validate constraint notation_output_schemas_source_check;

alter table public.notation_output_schemas
    drop constraint if exists notation_output_schemas_tab_key;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'notation_output_schemas_source_tab_key'
          and conrelid = 'public.notation_output_schemas'::regclass
    ) then
        alter table public.notation_output_schemas
            add constraint notation_output_schemas_source_tab_key
            unique (notation_source, tab);
    end if;
end $$;

with scorecard_schema(schema_json) as (
    values (
        '{
            "type": "object",
            "additionalProperties": false,
            "required": ["onglet", "criteres"],
            "properties": {
                "onglet": {
                    "type": "string",
                    "enum": ["AnalyseMethodologique"]
                },
                "criteres": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "required": ["ref", "points_obtenus", "points_max", "preuve", "commentaire", "conseil"],
                        "properties": {
                            "ref": {
                                "type": "string"
                            },
                            "points_obtenus": {
                                "type": "number"
                            },
                            "points_max": {
                                "type": "number"
                            },
                            "preuve": {
                                "type": "string"
                            },
                            "commentaire": {
                                "type": "string"
                            },
                            "conseil": {
                                "type": "string"
                            }
                        }
                    }
                }
            }
        }'::jsonb
    )
)
insert into public.notation_output_schemas (notation_source, tab, name, schema_json, is_active, status)
select
    'scorecard',
    'methodo',
    'notation_scorecard_methodo',
    scorecard_schema.schema_json,
    true,
    'published'::public.content_status
from scorecard_schema
where not exists (
    select 1
    from public.notation_output_schemas
    where notation_source = 'scorecard'
      and tab = 'methodo'
);

with scorecard_schema(schema_json) as (
    values (
        '{
            "type": "object",
            "additionalProperties": false,
            "required": ["onglet", "criteres"],
            "properties": {
                "onglet": {
                    "type": "string",
                    "enum": ["AnalyseMethodologique"]
                },
                "criteres": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": false,
                        "required": ["ref", "points_obtenus", "points_max", "preuve", "commentaire", "conseil"],
                        "properties": {
                            "ref": {
                                "type": "string"
                            },
                            "points_obtenus": {
                                "type": "number"
                            },
                            "points_max": {
                                "type": "number"
                            },
                            "preuve": {
                                "type": "string"
                            },
                            "commentaire": {
                                "type": "string"
                            },
                            "conseil": {
                                "type": "string"
                            }
                        }
                    }
                }
            }
        }'::jsonb
    )
)
update public.notation_output_schemas
set
    name = 'notation_scorecard_methodo',
    schema_json = scorecard_schema.schema_json,
    is_active = true,
    status = 'published'::public.content_status,
    updated_at = now()
from scorecard_schema
where notation_source = 'scorecard'
  and tab = 'methodo';

comment on column public.notation_output_schemas.notation_source is
    'Notation source using this schema: legacy_pdf for historical PDF/method prompts, scorecard for structured scorecard notation.';

comment on table public.notation_output_schemas is
    'JSON schemas used to constrain OpenAI notation outputs. scorecard/methodo is reserved for scorecard-based roleplay notation.';

notify pgrst, 'reload schema';
