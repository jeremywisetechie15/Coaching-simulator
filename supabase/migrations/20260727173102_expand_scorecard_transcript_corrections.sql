-- New scorecard notations can link every useful learner message to an
-- incomplete criterion. Existing notation_json payloads stay unchanged and
-- remain readable through the legacy singular correction adapter.
begin;

do $$
begin
    if not exists (
        select 1
        from public.notation_output_schemas
        where notation_source = 'scorecard'
          and tab = 'methodo'
    ) then
        raise exception 'Missing scorecard/methodo notation output schema';
    end if;
end
$$;

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
                        "required": [
                            "ref",
                            "points_obtenus",
                            "points_max",
                            "preuve",
                            "commentaire",
                            "conseil",
                            "corrections"
                        ],
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
                            },
                            "corrections": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "additionalProperties": false,
                                    "required": [
                                        "message_ref",
                                        "phrase_originale",
                                        "verbatim_preconise",
                                        "pourquoi"
                                    ],
                                    "properties": {
                                        "message_ref": {
                                            "type": "string"
                                        },
                                        "phrase_originale": {
                                            "type": "string"
                                        },
                                        "verbatim_preconise": {
                                            "type": "string"
                                        },
                                        "pourquoi": {
                                            "type": "string"
                                        }
                                    }
                                }
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

commit;
