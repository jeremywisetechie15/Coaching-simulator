import { isPlatformAdmin } from "@/features/auth/domain/access-control";
import { requireAuth } from "@/features/auth/server";
import {
    CONTENT_STATUS,
    CONTENT_VISIBILITY_SCOPE,
} from "@/features/content/domain";
import { resolveLearnerAssignedSkillIds } from "@/features/skills/domain/learner-skill-assignment";
import type { SkillDetail, SkillListItem } from "@/features/skills/domain/skills";
import {
    listCurrentUserAssignedContentIds,
    listCurrentUserSkillProgresses,
} from "@/features/users/server";
import type { UserSkillProgress } from "@/features/users/domain/users";
import { NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapSkillRowToListItem, type SkillRow } from "./skill.mapper";
import { fetchSkillDetail } from "./skill-query";
import { SKILL_SELECT } from "./skills.persistence";
import { getSkillById } from "./get-skill-by-id";
import { listSkills } from "./list-skills";

interface IdRow {
    id: string;
}

interface ScenarioScorecardRow {
    scorecard_id: string | null;
}

interface ScorecardStepRow {
    id: string;
}

interface ScorecardCriterionSkillRow {
    skill_id: string | null;
}

interface QuizStepRow {
    id: string;
}

interface QuizSkillRow {
    competence_id: string | null;
}

export interface CurrentSkillPageData {
    progress: UserSkillProgress | null;
    skill: SkillDetail;
}

interface LearnerSkillData {
    progress: UserSkillProgress | null;
    skill: SkillListItem;
}

function uniqueValues(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

async function listDirectLearnerSkillIds(userId: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("skills")
        .select("id")
        .eq("visibility_scope", CONTENT_VISIBILITY_SCOPE.user)
        .eq("assigned_user_id", userId)
        .eq("status", CONTENT_STATUS.published)
        .eq("is_active", true)
        .returns<IdRow[]>();

    if (error) throw error;

    return (data ?? []).map((skill) => skill.id);
}

async function listRoleplaySkillIds(roleplayIds: string[]) {
    if (roleplayIds.length === 0) return [];

    const supabase = createAdminClient();
    const { data: scenarios, error: scenariosError } = await supabase
        .from("scenarios")
        .select("scorecard_id")
        .in("id", roleplayIds)
        .returns<ScenarioScorecardRow[]>();

    if (scenariosError) throw scenariosError;

    const scorecardIds = uniqueValues((scenarios ?? []).map((scenario) => scenario.scorecard_id));
    if (scorecardIds.length === 0) return [];

    const { data: steps, error: stepsError } = await supabase
        .from("scorecard_steps")
        .select("id")
        .in("scorecard_id", scorecardIds)
        .returns<ScorecardStepRow[]>();

    if (stepsError) throw stepsError;

    const stepIds = (steps ?? []).map((step) => step.id);
    if (stepIds.length === 0) return [];

    const { data: criteria, error: criteriaError } = await supabase
        .from("scorecard_criteria")
        .select("skill_id")
        .in("scorecard_step_id", stepIds)
        .returns<ScorecardCriterionSkillRow[]>();

    if (criteriaError) throw criteriaError;

    return uniqueValues((criteria ?? []).map((criterion) => criterion.skill_id));
}

async function listQuizSkillIds(quizIds: string[]) {
    if (quizIds.length === 0) return [];

    const supabase = createAdminClient();
    const { data: steps, error: stepsError } = await supabase
        .from("quiz_steps")
        .select("id")
        .in("quiz_id", quizIds)
        .returns<QuizStepRow[]>();

    if (stepsError) throw stepsError;

    const stepIds = (steps ?? []).map((step) => step.id);
    if (stepIds.length === 0) return [];

    const [stepSkillsResult, questionSkillsResult] = await Promise.all([
        supabase
            .from("quiz_step_competencies")
            .select("competence_id")
            .in("step_id", stepIds)
            .returns<QuizSkillRow[]>(),
        supabase
            .from("quiz_questions")
            .select("competence_id")
            .in("step_id", stepIds)
            .returns<QuizSkillRow[]>(),
    ]);

    if (stepSkillsResult.error) throw stepSkillsResult.error;
    if (questionSkillsResult.error) throw questionSkillsResult.error;

    return uniqueValues([
        ...(stepSkillsResult.data ?? []).map((row) => row.competence_id),
        ...(questionSkillsResult.data ?? []).map((row) => row.competence_id),
    ]);
}

async function listLearnerSkillData(): Promise<LearnerSkillData[]> {
    const [assignments, progresses] = await Promise.all([
        listCurrentUserAssignedContentIds(),
        listCurrentUserSkillProgresses(),
    ]);
    const [directSkillIds, roleplaySkillIds, quizSkillIds] = await Promise.all([
        listDirectLearnerSkillIds(assignments.userId),
        listRoleplaySkillIds(assignments.roleplayIds),
        listQuizSkillIds(assignments.quizIds),
    ]);
    const assignedSkillIds = resolveLearnerAssignedSkillIds({
        directSkillIds,
        quizSkillIds,
        roleplaySkillIds,
    });

    if (assignedSkillIds.length === 0) return [];

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("skills")
        .select(SKILL_SELECT)
        .in("id", assignedSkillIds)
        .eq("status", CONTENT_STATUS.published)
        .eq("is_active", true)
        .order("name", { ascending: true })
        .returns<SkillRow[]>();

    if (error) throw error;

    const progressBySkillId = new Map(
        progresses.map((progress) => [progress.id, progress]),
    );

    return (data ?? []).map((row) => {
        const skill = mapSkillRowToListItem(row);

        return {
            progress: progressBySkillId.get(skill.id) ?? null,
            skill,
        };
    });
}

export async function listSkillsForCurrentUser(): Promise<SkillListItem[]> {
    const auth = await requireAuth();

    if (isPlatformAdmin(auth.platformRole)) {
        return listSkills();
    }

    return (await listLearnerSkillData()).map(({ skill }) => skill);
}

export async function getCurrentSkillPageData(skillId: string): Promise<CurrentSkillPageData> {
    const auth = await requireAuth();

    if (isPlatformAdmin(auth.platformRole)) {
        return {
            progress: null,
            skill: await getSkillById(skillId),
        };
    }

    const learnerSkill = (await listLearnerSkillData())
        .find(({ skill }) => skill.id === skillId);

    if (!learnerSkill) {
        throw new NotFoundError("Compétence introuvable.");
    }

    return {
        progress: learnerSkill.progress,
        skill: await fetchSkillDetail(createAdminClient(), skillId),
    };
}
