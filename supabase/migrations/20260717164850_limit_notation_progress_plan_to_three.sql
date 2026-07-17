-- A progress plan keeps only the most important actions: never more than three,
-- without asking the model to fill the list artificially.

with progress_plan_rule(rule) as (
    values (
        E'\n\nREGLE PRIORITAIRE DU PLAN DE PROGRES :\n- Produis entre 1 et 3 actions de progression maximum.\n- Conserve uniquement les actions les plus importantes, classees de la plus prioritaire a la moins prioritaire.\n- Ne cherche jamais a produire exactement 3 actions si 1 ou 2 suffisent.\n- Ne produis jamais plus de 3 actions, meme si davantage d axes d amelioration sont identifies.'
    )
)
update public.prompts
set
    prompt = case
        when title = 'notation.synthese' then
            replace(
                replace(
                    replace(
                        replace(
                            replace(
                                replace(
                                    prompt,
                                    '- Les tableaux points_positifs, axes_amelioration, plan_de_progres doivent contenir 2 à 4 objets, sauf plan_de_progres qui doit avoir exactement le même nombre que axes_amelioration.',
                                    '- Les tableaux points_positifs et axes_amelioration contiennent 2 à 4 objets. Le plan_de_progres contient 1 à 3 actions maximum.'
                                ),
                                '- plan_de_progres : 1 action par axe',
                                '- plan_de_progres : 1 à 3 actions maximum, choisies parmi les axes les plus prioritaires'
                            ),
                            '- Le nombre d’éléments dans plan_de_progres doit correspondre exactement au nombre d’axes_amelioration et suivre le même ordre.',
                            '- Le plan_de_progres peut contenir moins d’actions que les axes_amelioration et suit leur ordre de priorité.'
                        ),
                        '- Le nombre d’actions générées doit être strictement égal au nombre d’axes_amelioration.',
                        '- Le nombre d’actions générées est compris entre 1 et 3, selon les priorités réellement utiles.'
                    ),
                    'Le plan de progrès doit contenir exactement le même nombre d’actions que les axes d’amélioration.',
                    'Le plan de progrès contient entre 1 et 3 actions maximum, issues des axes les plus prioritaires.'
                ),
                'Les actions du plan_de_progres doivent suivre exactement le même ordre que les axes_amelioration.',
                'Les actions du plan_de_progres suivent l’ordre de priorité des axes retenus.'
            )
        else prompt
    end || progress_plan_rule.rule,
    updated_at = now()
from progress_plan_rule
where title in ('notation.scorecard.synthese', 'notation.synthese')
  and position('REGLE PRIORITAIRE DU PLAN DE PROGRES' in prompt) = 0;

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
