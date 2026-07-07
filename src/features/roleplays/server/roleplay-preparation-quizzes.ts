import { QUIZ_PARTICIPATION } from "@/features/evaluations/domain";
import type { ScenarioQuizRow } from "./roleplay.mapper";

interface MergeMethodKnowledgeQuizRowParams {
    methodQuizId: string | null;
    scenarioId: string;
    scenarioQuizRows: ScenarioQuizRow[];
}

export function mergeMethodKnowledgeQuizRow({
    methodQuizId,
    scenarioId,
    scenarioQuizRows,
}: MergeMethodKnowledgeQuizRowParams): ScenarioQuizRow[] {
    if (!methodQuizId) {
        return scenarioQuizRows;
    }

    return [
        {
            participation: QUIZ_PARTICIPATION.mandatory,
            quiz_id: methodQuizId,
            scenario_id: scenarioId,
            sort_order: 0,
        },
        ...scenarioQuizRows.filter((row) => row.quiz_id !== methodQuizId),
    ];
}
