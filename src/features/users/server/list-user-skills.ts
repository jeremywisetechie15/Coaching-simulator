import { requireAdmin, requirePlatformUser } from "@/features/auth/server";
import { MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS } from "@/features/roleplays/domain";
import type {
    UserSkillDimensionItemProgress,
    UserSkillDimensionKey,
    UserSkillDimensionProgress,
    UserSkillProgress,
} from "@/features/users/domain/users";
import { fetchCompletedQuizSkillCriteria } from "@/features/evaluations/server/quiz-skill-criteria";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWeightedProgressScore } from "./user-progress-score";

const USER_SKILL_DIMENSIONS: UserSkillDimensionKey[] = ["savoir", "savoir_faire", "savoir_etre"];

const USER_SKILL_DIMENSION_LABELS: Record<UserSkillDimensionKey, string> = {
    savoir: "Savoir",
    savoir_etre: "Savoir-être",
    savoir_faire: "Savoir-faire",
};

interface CriterionSkillRow {
    created_at?: string | null;
    dimension: string;
    dimension_item_id: string | null;
    points_awarded: number | string | null;
    points_max: number | string | null;
    score_percent: number | string | null;
    session_id?: string | null;
    skill_id: string | null;
}

interface SkillNameRow {
    id: string;
    name: string | null;
}

interface SkillDimensionItemRow {
    dimension: string;
    id: string;
    is_active?: boolean | null;
    item_order: number | null;
    label: string | null;
    skill_id: string | null;
}

interface BuildUserSkillProgressInput {
    criteria: CriterionSkillRow[];
    dimensionItems: SkillDimensionItemRow[];
    skillNamesById: Map<string, string>;
}

function normalizeDimension(value: string | null | undefined): UserSkillDimensionKey {
    if (value === "savoir_faire" || value === "savoir-faire") return "savoir_faire";
    if (value === "savoir_etre" || value === "savoir-être") return "savoir_etre";
    return "savoir";
}

function uniqueValues(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function groupBy<T>(items: T[], keyOf: (item: T) => string) {
    const groups = new Map<string, T[]>();
    for (const item of items) {
        const key = keyOf(item);
        groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return groups;
}

function dateValue(value: string | null | undefined) {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
}

function criterionSessionScores(rows: CriterionSkillRow[]) {
    return Array.from(groupBy(rows, (row) => row.session_id || "__sessionless__").values())
        .flatMap((sessionRows) => {
            const score = getWeightedProgressScore(sessionRows.map((row) => ({
                pointsAwarded: row.points_awarded,
                pointsMax: row.points_max,
                scorePercent: row.score_percent,
            })));

            if (score === null) return [];

            const dates = sessionRows.map((row) => dateValue(row.created_at)).filter((value) => value > 0);

            return [{
                createdAt: dates.length > 0 ? Math.min(...dates) : 0,
                score,
            }];
        })
        .sort((first, second) => first.createdAt - second.createdAt);
}

function criterionScore(rows: CriterionSkillRow[]) {
    const scores = criterionSessionScores(rows).map((sessionScore) => sessionScore.score);

    if (scores.length === 0) return null;

    return Math.max(...scores);
}

function criterionInitialScore(rows: CriterionSkillRow[]) {
    const scores = criterionSessionScores(rows);

    return scores[0]?.score ?? null;
}

function roundProgressScore(value: number) {
    return Math.round(Math.max(0, Math.min(100, value)));
}

function averageItemScores(
    items: SkillDimensionItemRow[],
    scoreForItem: (item: SkillDimensionItemRow) => number | null,
) {
    if (items.length === 0) return null;

    const scores = items.map(scoreForItem);
    if (!scores.some((score) => score !== null)) return null;

    return roundProgressScore(
        scores.reduce<number>(
            (total, score) => total + (score ?? 0),
            0,
        ) / items.length,
    );
}

function mappedCriteriaForItems(
    criteria: CriterionSkillRow[],
    items: SkillDimensionItemRow[],
) {
    const itemIds = new Set(items.map((item) => item.id));

    return criteria.filter(
        (criterion) =>
            criterion.dimension_item_id !== null &&
            itemIds.has(criterion.dimension_item_id),
    );
}

function coverageAdjustedScore(
    criteria: CriterionSkillRow[],
    items: SkillDimensionItemRow[],
) {
    if (items.length === 0) return criterionScore(criteria);

    const mappedCriteria = mappedCriteriaForItems(criteria, items);
    if (mappedCriteria.length === 0) {
        return criterionScore(
            criteria.filter((criterion) => criterion.dimension_item_id === null),
        );
    }

    return averageItemScores(items, (item) =>
        criterionScore(
            mappedCriteria.filter(
                (criterion) => criterion.dimension_item_id === item.id,
            ),
        ),
    );
}

function coverageAdjustedInitialScore(
    criteria: CriterionSkillRow[],
    items: SkillDimensionItemRow[],
) {
    if (items.length === 0) return criterionInitialScore(criteria);

    const mappedCriteria = mappedCriteriaForItems(criteria, items);
    if (mappedCriteria.length === 0) {
        return criterionInitialScore(
            criteria.filter((criterion) => criterion.dimension_item_id === null),
        );
    }

    const sessionGroups = Array.from(
        groupBy(
            mappedCriteria,
            (criterion) => criterion.session_id || "__sessionless__",
        ).values(),
    ).sort((first, second) => {
        const firstDates = first
            .map((criterion) => dateValue(criterion.created_at))
            .filter((value) => value > 0);
        const secondDates = second
            .map((criterion) => dateValue(criterion.created_at))
            .filter((value) => value > 0);

        return (
            (firstDates.length > 0 ? Math.min(...firstDates) : 0) -
            (secondDates.length > 0 ? Math.min(...secondDates) : 0)
        );
    });

    for (const sessionCriteria of sessionGroups) {
        const score = averageItemScores(items, (item) =>
            getWeightedProgressScore(
                sessionCriteria
                    .filter(
                        (criterion) =>
                            criterion.dimension_item_id === item.id,
                    )
                    .map((criterion) => ({
                        pointsAwarded: criterion.points_awarded,
                        pointsMax: criterion.points_max,
                        scorePercent: criterion.score_percent,
                    })),
            ),
        );

        if (score !== null) return score;
    }

    return null;
}

function scoreDelta(score: number | null, initialScore: number | null) {
    if (score === null || initialScore === null) return null;
    return score - initialScore;
}

function itemLabel(item: SkillDimensionItemRow) {
    return item.label?.trim() || "Item non renseigné";
}

function createDimensionProgress(
    dimension: UserSkillDimensionKey,
    criteria: CriterionSkillRow[],
    items: SkillDimensionItemRow[],
): UserSkillDimensionProgress {
    const dimensionItems = items.filter(
        (item) => normalizeDimension(item.dimension) === dimension,
    );
    const dimensionCriteria = criteria.filter(
        (criterion) => normalizeDimension(criterion.dimension) === dimension,
    );

    return {
        itemCount: dimensionItems.length,
        key: dimension,
        label: USER_SKILL_DIMENSION_LABELS[dimension],
        score: coverageAdjustedScore(dimensionCriteria, dimensionItems),
    };
}

function createItemProgress(item: SkillDimensionItemRow, criteria: CriterionSkillRow[]): UserSkillDimensionItemProgress {
    return {
        dimension: normalizeDimension(item.dimension),
        id: item.id,
        label: itemLabel(item),
        score: criterionScore(criteria.filter((criterion) => criterion.dimension_item_id === item.id)),
    };
}

export function buildUserSkillProgresses({
    criteria,
    dimensionItems,
    skillNamesById,
}: BuildUserSkillProgressInput): UserSkillProgress[] {
    const itemById = new Map(dimensionItems.map((item) => [item.id, item]));
    const criteriaWithSkill = criteria.flatMap((criterion) => {
        const skillId = criterion.skill_id ?? (criterion.dimension_item_id ? itemById.get(criterion.dimension_item_id)?.skill_id : null);
        if (!skillId) return [];

        return [{ ...criterion, skill_id: skillId }];
    });
    const criteriaBySkillId = groupBy(criteriaWithSkill, (criterion) => criterion.skill_id ?? "");
    const itemsBySkillId = groupBy(
        dimensionItems.filter((item) => item.skill_id),
        (item) => item.skill_id ?? "",
    );

    return Array.from(new Set([...criteriaBySkillId.keys(), ...itemsBySkillId.keys()]))
        .filter(Boolean)
        .map((skillId) => {
            const skillCriteria = criteriaBySkillId.get(skillId) ?? [];
            const skillItems = (itemsBySkillId.get(skillId) ?? []).slice().sort((first, second) => {
                const dimensionOrder = USER_SKILL_DIMENSIONS.indexOf(normalizeDimension(first.dimension)) -
                    USER_SKILL_DIMENSIONS.indexOf(normalizeDimension(second.dimension));
                if (dimensionOrder !== 0) return dimensionOrder;
                return (first.item_order ?? 0) - (second.item_order ?? 0);
            });
            const score = coverageAdjustedScore(skillCriteria, skillItems);
            const initialScore = coverageAdjustedInitialScore(skillCriteria, skillItems);

            return {
                delta: scoreDelta(score, initialScore),
                dimensions: USER_SKILL_DIMENSIONS.map((dimension) =>
                    createDimensionProgress(dimension, skillCriteria, skillItems),
                ),
                id: skillId,
                initialScore,
                items: skillItems.map((item) => createItemProgress(item, skillCriteria)),
                label: skillNamesById.get(skillId) || "Compétence non renseignée",
                score,
            };
        })
        .sort((first, second) => first.label.localeCompare(second.label, "fr"));
}

async function loadUserSkillProgresses(userId: string): Promise<UserSkillProgress[]> {
    const supabase = createAdminClient();
    const [{ data: roleplayCriteria, error: criteriaError }, quizCriteria] = await Promise.all([
        supabase
            .from("roleplay_session_criterion_results")
            .select("session_id, skill_id, dimension, dimension_item_id, score_percent, points_awarded, points_max, created_at, sessions!inner(duration_seconds)")
            .eq("user_id", userId)
            .gte("sessions.duration_seconds", MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS)
            .returns<CriterionSkillRow[]>(),
        fetchCompletedQuizSkillCriteria(supabase, { userId }),
    ]);

    if (criteriaError) throw criteriaError;

    const criterionRows = [
        ...(roleplayCriteria ?? []),
        ...quizCriteria.map((criterion): CriterionSkillRow => ({
            created_at: criterion.createdAt,
            dimension: criterion.dimension,
            dimension_item_id: criterion.dimensionItemId,
            points_awarded: criterion.pointsAwarded,
            points_max: criterion.pointsMax,
            score_percent: criterion.scorePercent,
            session_id: criterion.sourceId,
            skill_id: criterion.skillId,
        })),
    ];
    if (criterionRows.length === 0) return [];

    const criterionItemIds = uniqueValues(criterionRows.map((row) => row.dimension_item_id));
    const criterionItemResult =
        criterionItemIds.length > 0
            ? await supabase
                  .from("skill_dimension_items")
                  .select("id, skill_id, dimension, label, item_order, is_active")
                  .in("id", criterionItemIds)
                  .returns<SkillDimensionItemRow[]>()
            : { data: [] as SkillDimensionItemRow[], error: null };

    if (criterionItemResult.error) throw criterionItemResult.error;

    const skillIds = uniqueValues([
        ...criterionRows.map((row) => row.skill_id),
        ...(criterionItemResult.data ?? []).map((item) => item.skill_id),
    ]);

    if (skillIds.length === 0) return [];

    const [skillsResult, dimensionItemsResult] = await Promise.all([
        supabase.from("skills").select("id, name").in("id", skillIds).returns<SkillNameRow[]>(),
        supabase
            .from("skill_dimension_items")
            .select("id, skill_id, dimension, label, item_order, is_active")
            .in("skill_id", skillIds)
            .eq("is_active", true)
            .order("skill_id", { ascending: true })
            .order("dimension", { ascending: true })
            .order("item_order", { ascending: true })
            .returns<SkillDimensionItemRow[]>(),
    ]);

    if (skillsResult.error) throw skillsResult.error;
    if (dimensionItemsResult.error) throw dimensionItemsResult.error;

    return buildUserSkillProgresses({
        criteria: criterionRows,
        dimensionItems: dimensionItemsResult.data ?? [],
        skillNamesById: new Map((skillsResult.data ?? []).map((skill) => [skill.id, skill.name ?? ""])),
    });
}

export async function listCurrentUserSkillProgresses(): Promise<UserSkillProgress[]> {
    const auth = await requirePlatformUser();

    return loadUserSkillProgresses(auth.userId);
}

export async function listUserSkillProgresses(userId: string): Promise<UserSkillProgress[]> {
    await requireAdmin();

    return loadUserSkillProgresses(userId);
}
