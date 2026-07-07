import type { SupabaseClient } from "@supabase/supabase-js";
import type { RoleplayNotationCriterionRef } from "@/features/roleplays/domain";

interface MessageRow {
    content: string | null;
    role: string | null;
    timestamp: string | null;
}

interface SessionScenarioRow {
    created_at: string | null;
    duration_seconds: number | null;
    id: string;
    scenario_id: string | null;
    scenarios: {
        coaching_steps?: string | null;
        context?: string | null;
        description?: string | null;
        difficulty_level?: string | null;
        id: string;
        method_id?: string | null;
        objective?: string | null;
        obstacles?: string | null;
        scorecard_id?: string | null;
        title?: string | null;
    } | null;
    user_id: string | null;
}

interface MethodRow {
    challenges?: string[] | null;
    code?: string | null;
    description?: string | null;
    id: string;
    name?: string | null;
    objectives?: string[] | null;
    version?: string | null;
}

interface MethodStepRow {
    best_practices?: string[] | null;
    code?: string | null;
    id: string;
    objectives?: string[] | null;
    pitfalls?: string[] | null;
    posture?: string[] | null;
    short_title?: string | null;
    step_key?: string | null;
    step_order: number;
    summary?: string | null;
    title?: string | null;
    verbatims?: string[] | null;
}

interface ScorecardRow {
    description?: string | null;
    id: string;
    method_id: string;
    name?: string | null;
}

interface ScorecardStepRow {
    id: string;
    method_step_id: string | null;
    name?: string | null;
    scorecard_id: string;
    step_order: number;
}

interface ScorecardCriterionRow {
    ai_instruction?: string | null;
    criterion_key?: string | null;
    criterion_order: number;
    dimension: string;
    dimension_item_id?: string | null;
    expected_evidence?: string | null;
    id: string;
    max_points?: number | null;
    scorecard_step_id: string;
    skill_id: string;
    verbatim?: string | null;
}

interface SkillRow {
    description?: string | null;
    id: string;
    name?: string | null;
}

interface DimensionItemRow {
    dimension: string;
    id: string;
    label?: string | null;
    skill_id: string;
}

export interface RoleplayScorecardNotationContext {
    criterionRefs: RoleplayNotationCriterionRef[];
    method: {
        challenges: string[];
        code: string;
        description: string;
        id: string;
        name: string;
        objectives: string[];
        steps: Array<{
            bestPractices: string[];
            code: string;
            id: string;
            objectives: string[];
            order: number;
            pitfalls: string[];
            posture: string[];
            summary: string;
            title: string;
            verbatims: string[];
        }>;
        version: string;
    };
    scenario: {
        coachingSteps: string;
        context: string;
        description: string;
        difficulty: string;
        id: string;
        objective: string;
        obstacles: string;
        title: string;
    };
    scorecard: {
        description: string;
        id: string;
        name: string;
        steps: Array<{
            criteria: Array<{
                aiInstruction: string;
                criterionKey: string;
                dimension: string;
                dimensionItemLabel: string | null;
                expectedEvidence: string;
                maxPoints: number;
                ref: string;
                skillName: string;
                verbatim: string;
            }>;
            id: string;
            methodStepId: string | null;
            order: number;
            title: string;
        }>;
    };
    session: {
        completedAt: string;
        durationSeconds: number | null;
        id: string;
        scenarioId: string;
        userId: string | null;
    };
    transcript: string;
}

function cleanArray(value: string[] | null | undefined) {
    return Array.isArray(value) ? value.filter((item) => item.trim().length > 0) : [];
}

function cleanText(value: string | null | undefined) {
    return value?.trim() ?? "";
}

function normalizeDimension(value: string): RoleplayNotationCriterionRef["dimension"] {
    if (value === "savoir" || value === "savoir_faire" || value === "savoir_etre") {
        return value;
    }

    return "savoir_faire";
}

function buildTranscript(messages: MessageRow[]) {
    return messages
        .map((message) => {
            const timestamp = message.timestamp ? new Date(message.timestamp) : null;
            const time = timestamp && !Number.isNaN(timestamp.getTime())
                ? timestamp.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                })
                : "--:--:--";
            const role = message.role === "user" ? "Utilisateur" : "Persona";
            return `[${time}] ${role}: ${message.content ?? ""}`;
        })
        .join("\n");
}

export async function buildRoleplayScorecardNotationContext(
    supabase: SupabaseClient,
    sessionId: string,
    messages: MessageRow[],
): Promise<RoleplayScorecardNotationContext | null> {
    const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .select(`
            id,
            user_id,
            scenario_id,
            duration_seconds,
            created_at,
            scenarios!inner(
                id,
                title,
                description,
                method_id,
                scorecard_id,
                context,
                objective,
                obstacles,
                difficulty_level,
                coaching_steps
            )
        `)
        .eq("id", sessionId)
        .maybeSingle<SessionScenarioRow>();

    if (sessionError) throw sessionError;
    if (!session?.scenario_id || !session.scenarios?.scorecard_id || !session.scenarios.method_id) {
        return null;
    }

    const scenario = session.scenarios;

    const [
        { data: method, error: methodError },
        { data: methodSteps, error: methodStepsError },
        { data: scorecard, error: scorecardError },
        { data: scorecardSteps, error: scorecardStepsError },
    ] = await Promise.all([
        supabase
            .from("methods")
            .select("id, code, name, version, description, objectives, challenges")
            .eq("id", scenario.method_id)
            .maybeSingle<MethodRow>(),
        supabase
            .from("method_steps")
            .select("id, step_order, step_key, code, title, short_title, summary, objectives, best_practices, pitfalls, posture, verbatims")
            .eq("method_id", scenario.method_id)
            .order("step_order", { ascending: true })
            .returns<MethodStepRow[]>(),
        supabase
            .from("scorecards")
            .select("id, name, description, method_id")
            .eq("id", scenario.scorecard_id)
            .maybeSingle<ScorecardRow>(),
        supabase
            .from("scorecard_steps")
            .select("id, scorecard_id, method_step_id, step_order, name")
            .eq("scorecard_id", scenario.scorecard_id)
            .order("step_order", { ascending: true })
            .returns<ScorecardStepRow[]>(),
    ]);

    if (methodError) throw methodError;
    if (methodStepsError) throw methodStepsError;
    if (scorecardError) throw scorecardError;
    if (scorecardStepsError) throw scorecardStepsError;
    if (!method || !scorecard) return null;

    const steps = scorecardSteps ?? [];
    if (steps.length === 0) return null;

    const { data: criteria, error: criteriaError } = await supabase
        .from("scorecard_criteria")
        .select("id, scorecard_step_id, criterion_order, criterion_key, expected_evidence, skill_id, dimension, dimension_item_id, max_points, ai_instruction, verbatim")
        .in("scorecard_step_id", steps.map((step) => step.id))
        .order("criterion_order", { ascending: true })
        .returns<ScorecardCriterionRow[]>();

    if (criteriaError) throw criteriaError;
    if (!criteria || criteria.length === 0) return null;

    const skillIds = Array.from(new Set(criteria.map((criterion) => criterion.skill_id).filter(Boolean)));
    const dimensionItemIds = Array.from(
        new Set(criteria.map((criterion) => criterion.dimension_item_id).filter((id): id is string => Boolean(id))),
    );

    const [{ data: skills, error: skillsError }, { data: dimensionItems, error: dimensionItemsError }] = await Promise.all([
        skillIds.length > 0
            ? supabase
                .from("skills")
                .select("id, name, description")
                .in("id", skillIds)
                .returns<SkillRow[]>()
            : Promise.resolve({ data: [] as SkillRow[], error: null }),
        dimensionItemIds.length > 0
            ? supabase
                .from("skill_dimension_items")
                .select("id, skill_id, dimension, label")
                .in("id", dimensionItemIds)
                .returns<DimensionItemRow[]>()
            : Promise.resolve({ data: [] as DimensionItemRow[], error: null }),
    ]);

    if (skillsError) throw skillsError;
    if (dimensionItemsError) throw dimensionItemsError;

    const methodStepsById = new Map((methodSteps ?? []).map((step) => [step.id, step]));
    const skillsById = new Map((skills ?? []).map((skill) => [skill.id, skill]));
    const dimensionItemsById = new Map((dimensionItems ?? []).map((item) => [item.id, item]));
    const criteriaByStepId = new Map<string, ScorecardCriterionRow[]>();

    for (const criterion of criteria) {
        const current = criteriaByStepId.get(criterion.scorecard_step_id) ?? [];
        current.push(criterion);
        criteriaByStepId.set(criterion.scorecard_step_id, current);
    }

    const criterionRefs: RoleplayNotationCriterionRef[] = [];
    let refIndex = 1;

    const scorecardContextSteps = steps.map((step) => {
        const methodStep = step.method_step_id ? methodStepsById.get(step.method_step_id) : null;
        const title = cleanText(step.name) || cleanText(methodStep?.title) || `Étape ${step.step_order}`;
        const stepCriteria = (criteriaByStepId.get(step.id) ?? []).map((criterion) => {
            const ref = `C${refIndex++}`;
            const skill = skillsById.get(criterion.skill_id);
            const dimensionItem = criterion.dimension_item_id ? dimensionItemsById.get(criterion.dimension_item_id) : null;
            const dimension = normalizeDimension(criterion.dimension);
            const maxPoints = Math.max(1, Number(criterion.max_points) || 1);

            criterionRefs.push({
                criterionKey: cleanText(criterion.criterion_key),
                dimension,
                dimensionItemId: criterion.dimension_item_id ?? null,
                dimensionItemLabel: cleanText(dimensionItem?.label) || null,
                expectedEvidence: cleanText(criterion.expected_evidence),
                maxPoints,
                methodStepId: step.method_step_id ?? null,
                ref,
                scorecardCriterionId: criterion.id,
                scorecardStepId: step.id,
                skillId: criterion.skill_id,
                skillName: cleanText(skill?.name) || criterion.skill_id,
                stepOrder: step.step_order,
                stepTitle: title,
                verbatim: cleanText(criterion.verbatim),
            });

            return {
                aiInstruction: cleanText(criterion.ai_instruction),
                criterionKey: cleanText(criterion.criterion_key),
                dimension,
                dimensionItemLabel: cleanText(dimensionItem?.label) || null,
                expectedEvidence: cleanText(criterion.expected_evidence),
                maxPoints,
                ref,
                skillName: cleanText(skill?.name) || criterion.skill_id,
                verbatim: cleanText(criterion.verbatim),
            };
        });

        return {
            criteria: stepCriteria,
            id: step.id,
            methodStepId: step.method_step_id ?? null,
            order: step.step_order,
            title,
        };
    });

    return {
        criterionRefs,
        method: {
            challenges: cleanArray(method.challenges),
            code: cleanText(method.code),
            description: cleanText(method.description),
            id: method.id,
            name: cleanText(method.name) || cleanText(method.code) || "Méthode",
            objectives: cleanArray(method.objectives),
            steps: (methodSteps ?? []).map((step) => ({
                bestPractices: cleanArray(step.best_practices),
                code: cleanText(step.code),
                id: step.id,
                objectives: cleanArray(step.objectives),
                order: step.step_order,
                pitfalls: cleanArray(step.pitfalls),
                posture: cleanArray(step.posture),
                summary: cleanText(step.summary),
                title: cleanText(step.title) || cleanText(step.short_title) || `Étape ${step.step_order}`,
                verbatims: cleanArray(step.verbatims),
            })),
            version: cleanText(method.version),
        },
        scenario: {
            coachingSteps: cleanText(scenario.coaching_steps),
            context: cleanText(scenario.context),
            description: cleanText(scenario.description),
            difficulty: cleanText(scenario.difficulty_level),
            id: scenario.id,
            objective: cleanText(scenario.objective),
            obstacles: cleanText(scenario.obstacles),
            title: cleanText(scenario.title) || "Simulation",
        },
        scorecard: {
            description: cleanText(scorecard.description),
            id: scorecard.id,
            name: cleanText(scorecard.name) || "Scorecard",
            steps: scorecardContextSteps,
        },
        session: {
            completedAt: session.created_at ?? new Date().toISOString(),
            durationSeconds: session.duration_seconds,
            id: session.id,
            scenarioId: session.scenario_id,
            userId: session.user_id,
        },
        transcript: buildTranscript(messages),
    };
}
