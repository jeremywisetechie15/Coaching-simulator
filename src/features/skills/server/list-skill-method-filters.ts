import type { SupabaseClient } from "@supabase/supabase-js";
import { QUIZ_KIND } from "@/features/evaluations/domain";
import type {
    SkillMethodFilterData,
    SkillMethodFilterOption,
} from "@/features/skills/domain/skills";
import { createClient } from "@/lib/supabase/server";

interface ScorecardCriterionMethodRow {
    scorecard_step_id: string;
    skill_id: string;
}

interface ScorecardStepMethodRow {
    id: string;
    scorecard_id: string;
}

interface ScorecardMethodRow {
    id: string;
    method_id: string | null;
}

interface QuizSkillMethodRow {
    competence_id: string;
    step_id: string;
}

interface QuizStepMethodRow {
    id: string;
    quiz_id: string;
}

interface QuizMethodRow {
    id: string;
    method_id: string | null;
}

interface MethodFilterRow {
    id: string;
    name: string;
}

function unique(values: readonly string[]) {
    return [...new Set(values)];
}

function addMethodId(
    methodIdsBySkillId: Map<string, Set<string>>,
    skillId: string,
    methodId: string | null | undefined,
) {
    if (!methodId) return;

    const methodIds = methodIdsBySkillId.get(skillId) ?? new Set<string>();
    methodIds.add(methodId);
    methodIdsBySkillId.set(skillId, methodIds);
}

async function listScorecardMethodLinks(
    supabase: SupabaseClient,
    skillIds: string[],
) {
    const { data: criteria, error: criteriaError } = await supabase
        .from("scorecard_criteria")
        .select("skill_id, scorecard_step_id")
        .in("skill_id", skillIds)
        .returns<ScorecardCriterionMethodRow[]>();

    if (criteriaError) throw criteriaError;

    const scorecardStepIds = unique((criteria ?? []).map((criterion) => criterion.scorecard_step_id));
    if (scorecardStepIds.length === 0) return [];

    const { data: steps, error: stepsError } = await supabase
        .from("scorecard_steps")
        .select("id, scorecard_id")
        .in("id", scorecardStepIds)
        .returns<ScorecardStepMethodRow[]>();

    if (stepsError) throw stepsError;

    const scorecardIds = unique((steps ?? []).map((step) => step.scorecard_id));
    if (scorecardIds.length === 0) return [];

    const { data: scorecards, error: scorecardsError } = await supabase
        .from("scorecards")
        .select("id, method_id")
        .in("id", scorecardIds)
        .returns<ScorecardMethodRow[]>();

    if (scorecardsError) throw scorecardsError;

    const scorecardIdByStepId = new Map((steps ?? []).map((step) => [step.id, step.scorecard_id]));
    const methodIdByScorecardId = new Map((scorecards ?? []).map((scorecard) => [scorecard.id, scorecard.method_id]));

    return (criteria ?? []).map((criterion) => ({
        methodId: methodIdByScorecardId.get(scorecardIdByStepId.get(criterion.scorecard_step_id) ?? "") ?? null,
        skillId: criterion.skill_id,
    }));
}

async function listQuizMethodLinks(
    supabase: SupabaseClient,
    skillIds: string[],
) {
    const [stepSkillsResult, questionSkillsResult] = await Promise.all([
        supabase
            .from("quiz_step_competencies")
            .select("competence_id, step_id")
            .in("competence_id", skillIds)
            .returns<QuizSkillMethodRow[]>(),
        supabase
            .from("quiz_questions")
            .select("competence_id, step_id")
            .in("competence_id", skillIds)
            .returns<QuizSkillMethodRow[]>(),
    ]);

    if (stepSkillsResult.error) throw stepSkillsResult.error;
    if (questionSkillsResult.error) throw questionSkillsResult.error;

    const skillRows = [...(stepSkillsResult.data ?? []), ...(questionSkillsResult.data ?? [])];
    const quizStepIds = unique(skillRows.map((row) => row.step_id));
    if (quizStepIds.length === 0) return [];

    const { data: steps, error: stepsError } = await supabase
        .from("quiz_steps")
        .select("id, quiz_id")
        .in("id", quizStepIds)
        .returns<QuizStepMethodRow[]>();

    if (stepsError) throw stepsError;

    const quizIds = unique((steps ?? []).map((step) => step.quiz_id));
    if (quizIds.length === 0) return [];

    const { data: quizzes, error: quizzesError } = await supabase
        .from("quizzes")
        .select("id, method_id")
        .in("id", quizIds)
        .eq("quiz_kind", QUIZ_KIND.methodKnowledge)
        .returns<QuizMethodRow[]>();

    if (quizzesError) throw quizzesError;

    const quizIdByStepId = new Map((steps ?? []).map((step) => [step.id, step.quiz_id]));
    const methodIdByQuizId = new Map((quizzes ?? []).map((quiz) => [quiz.id, quiz.method_id]));

    return skillRows.map((row) => ({
        methodId: methodIdByQuizId.get(quizIdByStepId.get(row.step_id) ?? "") ?? null,
        skillId: row.competence_id,
    }));
}

export async function listSkillMethodFilterData(
    skillIds: readonly string[],
): Promise<SkillMethodFilterData> {
    const uniqueSkillIds = unique(skillIds);
    if (uniqueSkillIds.length === 0) {
        return { methodIdsBySkillId: {}, methodOptions: [] };
    }

    const supabase = await createClient();
    const [scorecardLinks, quizLinks] = await Promise.all([
        listScorecardMethodLinks(supabase, uniqueSkillIds),
        listQuizMethodLinks(supabase, uniqueSkillIds),
    ]);
    const methodIdsBySkillId = new Map<string, Set<string>>();

    for (const link of [...scorecardLinks, ...quizLinks]) {
        addMethodId(methodIdsBySkillId, link.skillId, link.methodId);
    }

    const methodIds = unique(
        [...methodIdsBySkillId.values()].flatMap((ids) => [...ids]),
    );
    if (methodIds.length === 0) {
        return { methodIdsBySkillId: {}, methodOptions: [] };
    }

    const { data: methods, error: methodsError } = await supabase
        .from("methods")
        .select("id, name")
        .in("id", methodIds)
        .order("name", { ascending: true })
        .returns<MethodFilterRow[]>();

    if (methodsError) throw methodsError;

    const methodOptions: SkillMethodFilterOption[] = (methods ?? [])
        .map((method) => ({ id: method.id, name: method.name }))
        .sort((first, second) => first.name.localeCompare(second.name, "fr-FR"));
    const visibleMethodIds = new Set(methodOptions.map((method) => method.id));

    return {
        methodIdsBySkillId: Object.fromEntries(
            uniqueSkillIds.map((skillId) => [
                skillId,
                [...(methodIdsBySkillId.get(skillId) ?? [])]
                    .filter((methodId) => visibleMethodIds.has(methodId))
                    .sort(),
            ]),
        ),
        methodOptions,
    };
}
