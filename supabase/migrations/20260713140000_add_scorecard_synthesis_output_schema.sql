-- Generic synthesis schema for scorecard notation.
-- Step references are generated server-side (S1..Sn); legacy PDF schemas remain unchanged.

insert into public.notation_output_schemas (
    notation_source,
    tab,
    name,
    schema_json,
    is_active,
    status
)
values (
    'scorecard',
    'synthese',
    'notation_scorecard_synthese',
    '{
        "type": "object",
        "additionalProperties": false,
        "required": [
            "onglet",
            "avis_persona_IA",
            "moments_cles",
            "plan_de_progres",
            "points_positifs",
            "axes_amelioration",
            "appreciation_globale",
            "priorite_strategique"
        ],
        "properties": {
            "onglet": {
                "type": "string",
                "enum": ["SyntheseGlobale"]
            },
            "avis_persona_IA": {
                "type": "object",
                "additionalProperties": false,
                "required": ["role", "texte", "description"],
                "properties": {
                    "role": { "type": "string" },
                    "texte": { "type": "string" },
                    "description": { "type": "string" }
                }
            },
            "moments_cles": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": [
                        "etape_ref",
                        "role",
                        "titre",
                        "type_impact",
                        "impact_label",
                        "timecode_debut",
                        "timecode_fin",
                        "competences_associees",
                        "extrait_transcript",
                        "pourquoi_moment_cle",
                        "perception_client",
                        "impact_sur_objectif",
                        "reponse_alternative_recommandee",
                        "description"
                    ],
                    "properties": {
                        "etape_ref": { "type": "string" },
                        "role": { "type": "string" },
                        "titre": { "type": "string" },
                        "type_impact": {
                            "type": "string",
                            "enum": [
                                "moment_cle_negatif",
                                "moment_cle_positif",
                                "opportunite_manquee",
                                "moment_sensible"
                            ]
                        },
                        "impact_label": { "type": "string" },
                        "timecode_debut": { "type": "string" },
                        "timecode_fin": { "type": "string" },
                        "competences_associees": {
                            "type": "array",
                            "items": { "type": "string" }
                        },
                        "extrait_transcript": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "additionalProperties": false,
                                "required": ["speaker", "verbatim", "timecode"],
                                "properties": {
                                    "speaker": {
                                        "type": "string",
                                        "enum": ["Persona", "Apprenant"]
                                    },
                                    "verbatim": { "type": "string" },
                                    "timecode": { "type": "string" }
                                }
                            }
                        },
                        "pourquoi_moment_cle": { "type": "string" },
                        "perception_client": { "type": "string" },
                        "impact_sur_objectif": { "type": "string" },
                        "reponse_alternative_recommandee": { "type": "string" },
                        "description": { "type": "string" }
                    }
                }
            },
            "plan_de_progres": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["etape_ref", "role", "texte", "description"],
                    "properties": {
                        "etape_ref": { "type": "string" },
                        "role": { "type": "string" },
                        "texte": { "type": "string" },
                        "description": { "type": "string" }
                    }
                }
            },
            "points_positifs": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["role", "texte", "description"],
                    "properties": {
                        "role": { "type": "string" },
                        "texte": { "type": "string" },
                        "description": { "type": "string" }
                    }
                }
            },
            "axes_amelioration": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["role", "texte", "description"],
                    "properties": {
                        "role": { "type": "string" },
                        "texte": { "type": "string" },
                        "description": { "type": "string" }
                    }
                }
            },
            "appreciation_globale": {
                "type": "object",
                "additionalProperties": false,
                "required": ["role", "texte", "description"],
                "properties": {
                    "role": { "type": "string" },
                    "texte": { "type": "string" },
                    "description": { "type": "string" }
                }
            },
            "priorite_strategique": {
                "type": "object",
                "additionalProperties": false,
                "required": ["role", "texte", "description", "reference_axe"],
                "properties": {
                    "role": { "type": "string" },
                    "texte": { "type": "string" },
                    "description": { "type": "string" },
                    "reference_axe": { "type": "string" }
                }
            }
        }
    }'::jsonb,
    true,
    'published'::public.content_status
)
on conflict (notation_source, tab) do update
set
    name = excluded.name,
    schema_json = excluded.schema_json,
    is_active = excluded.is_active,
    status = excluded.status,
    updated_at = now();

comment on table public.notation_output_schemas is
    'JSON schemas used to constrain OpenAI notation outputs. Scorecard schemas use generic server-generated references and never depend on method letters.';

notify pgrst, 'reload schema';
