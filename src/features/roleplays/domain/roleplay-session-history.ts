export const ROLEPLAY_SESSION_HISTORY_ALL_VALUE = "all";

export interface RoleplaySessionHistoryFilters {
    category: string;
    dateFrom: string;
    dateTo: string;
    domain: string;
    level: string;
    roleplayId: string;
}

export const DEFAULT_ROLEPLAY_SESSION_HISTORY_FILTERS: RoleplaySessionHistoryFilters = {
    category: ROLEPLAY_SESSION_HISTORY_ALL_VALUE,
    dateFrom: "",
    dateTo: "",
    domain: ROLEPLAY_SESSION_HISTORY_ALL_VALUE,
    level: ROLEPLAY_SESSION_HISTORY_ALL_VALUE,
    roleplayId: ROLEPLAY_SESSION_HISTORY_ALL_VALUE,
};

interface RoleplaySessionHistoryFilterCandidate {
    occurredAt: string;
    roleplay: {
        category: string;
        difficulty: string;
        domain: string;
        id: string;
        name: string;
        title?: string;
    };
}

export function isRoleplaySessionHistoryDate(
    value: string | null | undefined,
): value is string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const parsedDate = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
}

export function filterRoleplaySessionHistory<T extends RoleplaySessionHistoryFilterCandidate>(
    sessions: readonly T[],
    filters: RoleplaySessionHistoryFilters,
) {
    const dateFrom = isRoleplaySessionHistoryDate(filters.dateFrom)
        ? new Date(`${filters.dateFrom}T00:00:00`)
        : null;
    const dateTo = isRoleplaySessionHistoryDate(filters.dateTo)
        ? new Date(`${filters.dateTo}T23:59:59.999`)
        : null;

    return sessions.filter((item) => {
        const matchesRoleplay =
            filters.roleplayId === ROLEPLAY_SESSION_HISTORY_ALL_VALUE ||
            item.roleplay.id === filters.roleplayId;
        const matchesDomain =
            filters.domain === ROLEPLAY_SESSION_HISTORY_ALL_VALUE ||
            item.roleplay.domain === filters.domain;
        const matchesCategory =
            filters.category === ROLEPLAY_SESSION_HISTORY_ALL_VALUE ||
            item.roleplay.category === filters.category;
        const matchesLevel =
            filters.level === ROLEPLAY_SESSION_HISTORY_ALL_VALUE ||
            item.roleplay.difficulty === filters.level;
        const occurredAt = new Date(item.occurredAt);
        const occurredAtTimestamp = occurredAt.getTime();
        const matchesDateFrom =
            !dateFrom ||
            (!Number.isNaN(occurredAtTimestamp) && occurredAtTimestamp >= dateFrom.getTime());
        const matchesDateTo =
            !dateTo ||
            (!Number.isNaN(occurredAtTimestamp) && occurredAtTimestamp <= dateTo.getTime());

        return matchesRoleplay && matchesDomain && matchesCategory && matchesLevel && matchesDateFrom && matchesDateTo;
    });
}

export function countActiveRoleplaySessionHistoryFilters(filters: RoleplaySessionHistoryFilters) {
    const selectFilterCount = [
        filters.category,
        filters.domain,
        filters.level,
        filters.roleplayId,
    ].filter((value) => value !== ROLEPLAY_SESSION_HISTORY_ALL_VALUE).length;

    return selectFilterCount + Number(Boolean(filters.dateFrom || filters.dateTo));
}

export function listRoleplaySessionHistoryRoleplays<T extends RoleplaySessionHistoryFilterCandidate>(
    sessions: readonly T[],
) {
    return Array.from(
        new Map(
            sessions.map((item) => [
                item.roleplay.id,
                {
                    label: item.roleplay.title?.trim() || item.roleplay.name,
                    value: item.roleplay.id,
                },
            ]),
        ).values(),
    ).sort((left, right) => left.label.localeCompare(right.label, "fr"));
}
