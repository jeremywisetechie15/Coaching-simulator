import type { SupabaseClient } from "@supabase/supabase-js";
import {
    buildRoleplayNotationTranscript,
    buildRoleplayNotationTranscriptText,
    type RoleplayNotationCriterionRef,
    type RoleplayNotationMessage,
    type RoleplayNotationStepRef,
    type RoleplayNotationTranscriptPayload,
} from "@/features/roleplays/domain";
import { getRoleplayRuntimeContext } from "./get-roleplay-coach-context";

interface SessionRow {
    created_at: string | null;
    duration_seconds: number | null;
    id: string;
    scenario_id: string | null;
    user_id: string | null;
}

export interface RoleplayScorecardNotationContext {
    criterionRefs: RoleplayNotationCriterionRef[];
    method: {
        category: string;
        challenges: string[];
        code: string;
        description: string;
        domain: string;
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
            takeaway: string;
            title: string;
            verbatims: string[];
            weight: number | null;
        }>;
        version: string;
    };
    persona: {
        age: number | null;
        annualRevenue: string;
        childrenCount: number | null;
        company: string;
        companyDescription: string;
        diploma: string;
        discProfile: string;
        employeeCount: number | null;
        industry: string;
        maritalStatus: string;
        name: string;
        nationality: string;
        netIncomeBeforeTax: string;
        residenceCountry: string;
        role: string;
        systemInstructions: string;
    } | null;
    scenario: {
        category: string;
        coachingSteps: string;
        context: string;
        description: string;
        difficulty: string;
        discProfile: string;
        domain: string;
        id: string;
        objective: string;
        obstacles: string;
        title: string;
    };
    scorecard: {
        category: string;
        description: string;
        domain: string;
        id: string;
        level: string;
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
            stepRef: string;
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
    stepRefs: RoleplayNotationStepRef[];
    transcript: string;
    transcription: RoleplayNotationTranscriptPayload;
}

function buildPersonaContext(
    persona: Awaited<ReturnType<typeof getRoleplayRuntimeContext>>["persona"],
): RoleplayScorecardNotationContext["persona"] {
    if (!persona) return null;

    return {
        age: persona.age,
        annualRevenue: persona.annualRevenue,
        childrenCount: persona.childrenCount,
        company: persona.company,
        companyDescription: persona.companyDescription,
        diploma: persona.diploma,
        discProfile: persona.discProfile,
        employeeCount: persona.employeeCount,
        industry: persona.industry,
        maritalStatus: persona.maritalStatus,
        name: persona.name,
        nationality: persona.nationality,
        netIncomeBeforeTax: persona.netIncomeBeforeTax,
        residenceCountry: persona.residenceCountry,
        role: persona.role,
        systemInstructions: persona.systemInstructions,
    };
}

export async function buildRoleplayScorecardNotationContext(
    supabase: SupabaseClient,
    sessionId: string,
    messages: RoleplayNotationMessage[],
): Promise<RoleplayScorecardNotationContext | null> {
    const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .select("id, user_id, scenario_id, duration_seconds, created_at")
        .eq("id", sessionId)
        .maybeSingle<SessionRow>();

    if (sessionError) throw sessionError;
    if (!session?.scenario_id) return null;

    const runtime = await getRoleplayRuntimeContext(supabase, session.scenario_id);
    if (!runtime.method || !runtime.scorecard) return null;
    if (runtime.scorecard.methodId !== runtime.method.id) {
        throw new Error("La scorecard du roleplay n'est pas liee a la methode selectionnee.");
    }
    if (runtime.scorecard.steps.length === 0 || runtime.scorecard.steps.every((step) => step.criteria.length === 0)) {
        throw new Error("La scorecard du roleplay ne contient aucun critere evaluable.");
    }

    const methodStepsById = new Map(runtime.methodSteps.map((step) => [step.id, step]));
    const methodStepsByOrder = new Map(runtime.methodSteps.map((step) => [step.order, step]));
    const stepRefs: RoleplayNotationStepRef[] = runtime.scorecard.steps.map((step, index) => {
        const methodStep = (step.methodStepId ? methodStepsById.get(step.methodStepId) : null)
            ?? methodStepsByOrder.get(step.order);
        const ref = `S${index + 1}`;

        return {
            code: methodStep?.code || ref,
            methodStepId: step.methodStepId,
            order: step.order,
            ref,
            scorecardStepId: step.id,
            title: step.title || methodStep?.title || `Etape ${step.order}`,
        };
    });
    const stepRefsByScorecardStepId = new Map(stepRefs.map((step) => [step.scorecardStepId, step]));
    const criterionRefs: RoleplayNotationCriterionRef[] = [];
    let criterionRefIndex = 1;

    const scorecardSteps = runtime.scorecard.steps.map((step) => {
        const stepRef = stepRefsByScorecardStepId.get(step.id);
        if (!stepRef) throw new Error(`Reference interne absente pour l'etape ${step.id}.`);

        return {
            criteria: step.criteria.map((criterion) => {
                const ref = `C${criterionRefIndex++}`;
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
                    stepRef: stepRef.ref,
                    stepTitle: stepRef.title,
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
            }),
            id: step.id,
            methodStepId: step.methodStepId,
            order: step.order,
            stepRef: stepRef.ref,
            title: stepRef.title,
        };
    });
    const transcription = buildRoleplayNotationTranscript(messages);

    return {
        criterionRefs,
        method: {
            ...runtime.method,
            steps: runtime.methodSteps,
        },
        persona: buildPersonaContext(runtime.persona),
        scenario: {
            category: runtime.scenario.category,
            coachingSteps: runtime.scenario.coachingSteps,
            context: runtime.scenario.context,
            description: runtime.scenario.description,
            difficulty: runtime.scenario.difficulty,
            discProfile: runtime.scenario.discProfile,
            domain: runtime.scenario.domain,
            id: runtime.scenario.id,
            objective: runtime.scenario.objective,
            obstacles: runtime.scenario.obstacles,
            title: runtime.scenario.title,
        },
        scorecard: {
            category: runtime.scorecard.category,
            description: runtime.scorecard.description,
            domain: runtime.scorecard.domain,
            id: runtime.scorecard.id,
            level: runtime.scorecard.level,
            name: runtime.scorecard.name,
            steps: scorecardSteps,
        },
        session: {
            completedAt: session.created_at ?? new Date().toISOString(),
            durationSeconds: session.duration_seconds,
            id: session.id,
            scenarioId: session.scenario_id,
            userId: session.user_id,
        },
        stepRefs,
        transcript: buildRoleplayNotationTranscriptText(transcription),
        transcription,
    };
}
