import { requireAdmin } from "@/features/auth/server";
import type { UserContentAssignmentCandidate } from "@/features/users/domain";
import type { UserContentAssignmentDto } from "@/features/users/dto";
import { ConflictError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";

interface AssignmentRow {
    assigned_at: string;
}

interface ContentAssignmentRow extends AssignmentRow {
    content_id: string;
}

interface ScenarioAssignmentRow {
    assigned_at: string;
    scenario_id: string;
}

interface QuizAssignmentRow {
    assigned_at: string;
    quiz_id: string;
}

interface ScenarioMethodRow {
    id: string;
    method_id: string | null;
}

interface ScenarioQuizRow {
    quiz_id: string;
    scenario_id: string;
}

interface MethodQuizRow {
    id: string;
    method_id: string | null;
}

interface CandidateRow {
    assigned_user_id: string | null;
    description: string | null;
    id: string;
    title: string;
    visibility_scope: string | null;
}

interface ProfileRow {
    id: string;
}

interface DatabaseErrorLike {
    code?: string;
}

const CONTENT_SELECT = "id, title, description, visibility_scope, assigned_user_id";

async function ensureUserProfileExists(userId: string) {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle<ProfileRow>();

    if (error) throw error;
    if (!data) throw new NotFoundError("Utilisateur introuvable.");
}

function mapCandidate(row: CandidateRow): UserContentAssignmentCandidate {
    return {
        description: row.description?.trim() ?? "",
        id: row.id,
        title: row.title,
    };
}

export function filterAssignableContentRows(
    rows: CandidateRow[],
    explicitlyAssignedIds: string[],
    userId: string,
) {
    const explicitlyAssignedIdSet = new Set(explicitlyAssignedIds);

    return rows
        .filter((row) => !explicitlyAssignedIdSet.has(row.id))
        .filter((row) => row.visibility_scope !== "user" || row.assigned_user_id !== userId)
        .map(mapCandidate);
}

async function listScenarioAssignmentRows(userId: string): Promise<ScenarioAssignmentRow[]> {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("scenario_user_assignments")
        .select("scenario_id, assigned_at")
        .eq("user_id", userId)
        .returns<ScenarioAssignmentRow[]>();

    if (error) throw error;
    return data ?? [];
}

async function listQuizAssignmentRows(userId: string): Promise<QuizAssignmentRow[]> {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("quiz_user_assignments")
        .select("quiz_id, assigned_at")
        .eq("user_id", userId)
        .returns<QuizAssignmentRow[]>();

    if (error) throw error;
    return data ?? [];
}

export async function listExplicitScenarioAssignments(userId: string): Promise<ContentAssignmentRow[]> {
    return (await listScenarioAssignmentRows(userId)).map((assignment) => ({
        assigned_at: assignment.assigned_at,
        content_id: assignment.scenario_id,
    }));
}

export async function listExplicitQuizAssignments(userId: string): Promise<ContentAssignmentRow[]> {
    return (await listQuizAssignmentRows(userId)).map((assignment) => ({
        assigned_at: assignment.assigned_at,
        content_id: assignment.quiz_id,
    }));
}

export function resolveRoleplayDerivedQuizAssignments({
    methodQuizRows,
    scenarioAssignments,
    scenarioQuizRows,
    scenarioRows,
}: {
    methodQuizRows: MethodQuizRow[];
    scenarioAssignments: ScenarioAssignmentRow[];
    scenarioQuizRows: ScenarioQuizRow[];
    scenarioRows: ScenarioMethodRow[];
}): ContentAssignmentRow[] {
    const assignedAtByScenarioId = new Map(
        scenarioAssignments.map((assignment) => [assignment.scenario_id, assignment.assigned_at]),
    );
    const activeScenarioIds = new Set(scenarioRows.map((scenario) => scenario.id));
    const assignedAtByQuizId = new Map<string, string>();

    for (const row of scenarioQuizRows) {
        if (!activeScenarioIds.has(row.scenario_id)) continue;
        const assignedAt = assignedAtByScenarioId.get(row.scenario_id);
        const currentAssignedAt = assignedAtByQuizId.get(row.quiz_id);
        if (assignedAt && (!currentAssignedAt || assignedAt > currentAssignedAt)) {
            assignedAtByQuizId.set(row.quiz_id, assignedAt);
        }
    }

    const scenarioIdsByMethodId = new Map<string, string[]>();
    for (const scenario of scenarioRows) {
        if (!scenario.method_id) continue;
        scenarioIdsByMethodId.set(scenario.method_id, [
            ...(scenarioIdsByMethodId.get(scenario.method_id) ?? []),
            scenario.id,
        ]);
    }

    for (const methodQuiz of methodQuizRows) {
        if (!methodQuiz.method_id) continue;
        const assignedAt = (scenarioIdsByMethodId.get(methodQuiz.method_id) ?? [])
            .map((scenarioId) => assignedAtByScenarioId.get(scenarioId))
            .filter((value): value is string => Boolean(value))
            .sort((first, second) => second.localeCompare(first))[0];
        const currentAssignedAt = assignedAtByQuizId.get(methodQuiz.id);
        if (assignedAt && (!currentAssignedAt || assignedAt > currentAssignedAt)) {
            assignedAtByQuizId.set(methodQuiz.id, assignedAt);
        }
    }

    return [...assignedAtByQuizId].map(([content_id, assigned_at]) => ({
        assigned_at,
        content_id,
    }));
}

export async function listRoleplayDerivedQuizAssignments(userId: string): Promise<ContentAssignmentRow[]> {
    const adminSupabase = createAdminClient();
    const scenarioAssignments = await listScenarioAssignmentRows(userId);
    const scenarioIds = scenarioAssignments.map((assignment) => assignment.scenario_id);

    if (scenarioIds.length === 0) return [];

    const [scenarioQuizResult, scenarioResult] = await Promise.all([
        adminSupabase
            .from("scenario_quizzes")
            .select("scenario_id, quiz_id")
            .in("scenario_id", scenarioIds)
            .returns<ScenarioQuizRow[]>(),
        adminSupabase
            .from("scenarios")
            .select("id, method_id")
            .in("id", scenarioIds)
            .eq("is_active", true)
            .eq("status", "published")
            .returns<ScenarioMethodRow[]>(),
    ]);

    if (scenarioQuizResult.error) throw scenarioQuizResult.error;
    if (scenarioResult.error) throw scenarioResult.error;

    const scenarioIdsByMethodId = new Map<string, string[]>();
    for (const scenario of scenarioResult.data ?? []) {
        if (!scenario.method_id) continue;
        scenarioIdsByMethodId.set(scenario.method_id, [
            ...(scenarioIdsByMethodId.get(scenario.method_id) ?? []),
            scenario.id,
        ]);
    }

    const methodIds = [...scenarioIdsByMethodId.keys()];
    let methodQuizRows: MethodQuizRow[] = [];
    if (methodIds.length > 0) {
        const { data, error: methodQuizError } = await adminSupabase
            .from("quizzes")
            .select("id, method_id")
            .in("method_id", methodIds)
            .eq("quiz_kind", "method_knowledge")
            .eq("is_active", true)
            .eq("status", "published")
            .returns<MethodQuizRow[]>();

        if (methodQuizError) throw methodQuizError;
        methodQuizRows = data ?? [];
    }

    return resolveRoleplayDerivedQuizAssignments({
        methodQuizRows,
        scenarioAssignments,
        scenarioQuizRows: scenarioQuizResult.data ?? [],
        scenarioRows: scenarioResult.data ?? [],
    });
}

export async function listAssignableRoleplays(userId: string): Promise<UserContentAssignmentCandidate[]> {
    await requireAdmin();
    await ensureUserProfileExists(userId);

    const adminSupabase = createAdminClient();
    const [assignmentRows, contentResult] = await Promise.all([
        listScenarioAssignmentRows(userId),
        adminSupabase
            .from("scenarios")
            .select(CONTENT_SELECT)
            .eq("status", "published")
            .eq("is_active", true)
            .order("title", { ascending: true })
            .returns<CandidateRow[]>(),
    ]);

    if (contentResult.error) throw contentResult.error;

    return filterAssignableContentRows(
        contentResult.data ?? [],
        assignmentRows.map((assignment) => assignment.scenario_id),
        userId,
    );
}

export async function listAssignableQuizzes(userId: string): Promise<UserContentAssignmentCandidate[]> {
    await requireAdmin();
    await ensureUserProfileExists(userId);

    const adminSupabase = createAdminClient();
    const [assignmentRows, contentResult] = await Promise.all([
        listQuizAssignmentRows(userId),
        adminSupabase
            .from("quizzes")
            .select(CONTENT_SELECT)
            .eq("status", "published")
            .eq("is_active", true)
            .order("title", { ascending: true })
            .returns<CandidateRow[]>(),
    ]);

    if (contentResult.error) throw contentResult.error;

    return filterAssignableContentRows(
        contentResult.data ?? [],
        assignmentRows.map((assignment) => assignment.quiz_id),
        userId,
    );
}

async function ensurePublishedActiveContent(
    table: "quizzes" | "scenarios",
    contentId: string,
    notFoundMessage: string,
) {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from(table)
        .select("id")
        .eq("id", contentId)
        .eq("status", "published")
        .eq("is_active", true)
        .maybeSingle<{ id: string }>();

    if (error) throw error;
    if (!data) throw new NotFoundError(notFoundMessage);
}

async function insertAssignment({
    assignedBy,
    contentColumn,
    contentId,
    table,
    userId,
}: {
    assignedBy: string;
    contentColumn: "quiz_id" | "scenario_id";
    contentId: string;
    table: "quiz_user_assignments" | "scenario_user_assignments";
    userId: string;
}) {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase.from(table).insert({
        assigned_by: assignedBy,
        [contentColumn]: contentId,
        user_id: userId,
    });

    if ((error as DatabaseErrorLike | null)?.code === "23505") {
        throw new ConflictError("Ce contenu est déjà affecté à cet utilisateur.");
    }

    if (error) throw error;
}

export async function assignRoleplayToUser(userId: string, input: UserContentAssignmentDto) {
    const context = await requireAdmin();
    await ensureUserProfileExists(userId);
    await ensurePublishedActiveContent("scenarios", input.contentId, "Roleplay publié introuvable.");
    await insertAssignment({
        assignedBy: context.userId,
        contentColumn: "scenario_id",
        contentId: input.contentId,
        table: "scenario_user_assignments",
        userId,
    });
}

export async function assignQuizToUser(userId: string, input: UserContentAssignmentDto) {
    const context = await requireAdmin();
    await ensureUserProfileExists(userId);
    await ensurePublishedActiveContent("quizzes", input.contentId, "Quiz publié introuvable.");
    await insertAssignment({
        assignedBy: context.userId,
        contentColumn: "quiz_id",
        contentId: input.contentId,
        table: "quiz_user_assignments",
        userId,
    });
}

async function deleteAssignment({
    contentColumn,
    contentId,
    table,
    userId,
}: {
    contentColumn: "quiz_id" | "scenario_id";
    contentId: string;
    table: "quiz_user_assignments" | "scenario_user_assignments";
    userId: string;
}) {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from(table)
        .delete()
        .eq("user_id", userId)
        .eq(contentColumn, contentId)
        .select(contentColumn)
        .maybeSingle<Record<string, string>>();

    if (error) throw error;
    if (!data) throw new NotFoundError("Affectation explicite introuvable.");
}

export async function removeRoleplayUserAssignment(userId: string, input: UserContentAssignmentDto) {
    await requireAdmin();
    await deleteAssignment({
        contentColumn: "scenario_id",
        contentId: input.contentId,
        table: "scenario_user_assignments",
        userId,
    });
}

export async function removeQuizUserAssignment(userId: string, input: UserContentAssignmentDto) {
    await requireAdmin();
    await deleteAssignment({
        contentColumn: "quiz_id",
        contentId: input.contentId,
        table: "quiz_user_assignments",
        userId,
    });
}
