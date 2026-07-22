-- SSOT: every synthesis list contains only the most useful feedback, never more than
-- three items and never padded just to reach the limit. The strategic priority
-- remains a compatible top-level JSON field but belongs to the progress-plan
-- section in the product vocabulary.

with synthesis_rule(marker, rule) as (
    values (
        'REGLE PRIORITAIRE DES BLOCS DE SYNTHESE',
        E'\n\nREGLE PRIORITAIRE DES BLOCS DE SYNTHESE :\n- Cette règle remplace toute consigne numérique précédente concernant ces blocs.\n- points_positifs, axes_amelioration, moments_cles et plan_de_progres contiennent chacun 3 éléments maximum.\n- Produis uniquement les éléments les plus importants, classés par priorité.\n- Ne cherche jamais à atteindre exactement 3 éléments : retourne 1 ou 2 éléments lorsqu''ils suffisent, et aucun lorsqu''aucune observation fiable ne le justifie.\n- Ne produis jamais plus de 3 éléments dans l''un de ces tableaux.\n- priorite_strategique fait partie du bloc « Plan de progrès et priorité stratégique » et doit rester cohérente avec les actions retenues dans plan_de_progres.'
    )
)
update public.prompts
set
    prompt = prompt || synthesis_rule.rule,
    updated_at = now()
from synthesis_rule
where title in ('notation.scorecard.synthese', 'notation.synthese')
  and position(synthesis_rule.marker in prompt) = 0;

update public.notation_output_schemas
set
    schema_json = jsonb_set(
        schema_json,
        '{properties,points_positifs,maxItems}',
        to_jsonb(3),
        true
    ),
    updated_at = now()
where tab = 'synthese'
  and schema_json #> '{properties,points_positifs}' is not null;

update public.notation_output_schemas
set
    schema_json = jsonb_set(
        schema_json,
        '{properties,axes_amelioration,maxItems}',
        to_jsonb(3),
        true
    ),
    updated_at = now()
where tab = 'synthese'
  and schema_json #> '{properties,axes_amelioration}' is not null;

update public.notation_output_schemas
set
    schema_json = jsonb_set(
        schema_json,
        '{properties,moments_cles,maxItems}',
        to_jsonb(3),
        true
    ),
    updated_at = now()
where tab = 'synthese'
  and schema_json #> '{properties,moments_cles}' is not null;

update public.notation_output_schemas
set
    schema_json = jsonb_set(
        schema_json,
        '{properties,plan_de_progres,maxItems}',
        to_jsonb(3),
        true
    ),
    updated_at = now()
where tab = 'synthese'
  and schema_json #> '{properties,plan_de_progres}' is not null;
