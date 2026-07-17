import { resolveRoleplayDerivedQuizAssignments } from "@/features/users/server/user-content-assignments.persistence";

interface ScenarioUserAssignmentRow {
    assigned_at: string;
    scenario_id: string;
    user_id: string;
}

interface ScenarioQuizRow {
    quiz_id: string;
    scenario_id: string;
}

interface ScenarioMethodRow {
    id: string;
    method_id: string | null;
}

interface MethodQuizRow {
    id: string;
    method_id: string | null;
}

export interface ExplicitUserAssignment {
    contentId: string;
    userId: string;
}

export function resolveBatchRoleplayDerivedQuizAssignments({
    methodQuizRows,
    scenarioAssignments,
    scenarioQuizRows,
    scenarioRows,
    userIds,
}: {
    methodQuizRows: MethodQuizRow[];
    scenarioAssignments: ScenarioUserAssignmentRow[];
    scenarioQuizRows: ScenarioQuizRow[];
    scenarioRows: ScenarioMethodRow[];
    userIds: string[];
}): ExplicitUserAssignment[] {
    const assignmentsByKey = new Map<string, ExplicitUserAssignment>();
    const scenarioAssignmentsByUserId = new Map<string, ScenarioUserAssignmentRow[]>();

    for (const assignment of scenarioAssignments) {
        const userAssignments = scenarioAssignmentsByUserId.get(assignment.user_id) ?? [];
        userAssignments.push(assignment);
        scenarioAssignmentsByUserId.set(assignment.user_id, userAssignments);
    }

    for (const userId of userIds) {
        const derivedAssignments = resolveRoleplayDerivedQuizAssignments({
            methodQuizRows,
            scenarioAssignments: scenarioAssignmentsByUserId.get(userId) ?? [],
            scenarioQuizRows,
            scenarioRows,
        });

        for (const derivedAssignment of derivedAssignments) {
            const assignment = { contentId: derivedAssignment.content_id, userId };
            assignmentsByKey.set(`${assignment.contentId}:${assignment.userId}`, assignment);
        }
    }

    return Array.from(assignmentsByKey.values());
}
