import type { SupabaseClient } from "@supabase/supabase-js";
import type { RoleplayNotationCriterionRef } from "@/features/roleplays/domain";
import { getRoleplayScorecardDefinition } from "./get-roleplay-scorecard-definition";

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
        scorecard,
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
        getRoleplayScorecardDefinition(supabase, scenario.scorecard_id ?? null),
    ]);

    if (methodError) throw methodError;
    if (methodStepsError) throw methodStepsError;
    if (!method || !scorecard) return null;

    if (scorecard.steps.length === 0 || scorecard.steps.every((step) => step.criteria.length === 0)) {
        return null;
    }

    const methodStepsById = new Map((methodSteps ?? []).map((step) => [step.id, step]));
    const criterionRefs: RoleplayNotationCriterionRef[] = [];
    let refIndex = 1;

    const scorecardContextSteps = scorecard.steps.map((step) => {
        const methodStep = step.methodStepId ? methodStepsById.get(step.methodStepId) : null;
        const title = cleanText(step.title) || cleanText(methodStep?.title) || `Étape ${step.order}`;
        const stepCriteria = step.criteria.map((criterion) => {
            const ref = `C${refIndex++}`;

            criterionRefs.push({
                criterionKey: criterion.criterionKey,
                dimension: criterion.dimension,
                dimensionItemId: criterion.dimensionItemId,
                dimensionItemLabel: criterion.dimensionItemLabel,
                expectedEvidence: criterion.expectedEvidence,
                maxPoints: criterion.maxPoints,
                methodStepId: step.methodStepId,
                ref,
                scorecardCriterionId: criterion.id,
                scorecardStepId: step.id,
                skillId: criterion.skillId,
                skillName: criterion.skillName,
                stepOrder: step.order,
                stepTitle: title,
                verbatim: criterion.verbatim,
            });

            return {
                aiInstruction: criterion.aiInstruction,
                criterionKey: criterion.criterionKey,
                dimension: criterion.dimension,
                dimensionItemLabel: criterion.dimensionItemLabel,
                expectedEvidence: criterion.expectedEvidence,
                maxPoints: criterion.maxPoints,
                ref,
                skillName: criterion.skillName,
                verbatim: criterion.verbatim,
            };
        });

        return {
            criteria: stepCriteria,
            id: step.id,
            methodStepId: step.methodStepId,
            order: step.order,
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
