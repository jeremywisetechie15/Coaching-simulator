export const CONTENT_STATUS = {
    archived: "archived",
    draft: "draft",
    published: "published",
} as const;

export const CONTENT_STATUSES = [
    CONTENT_STATUS.draft,
    CONTENT_STATUS.published,
    CONTENT_STATUS.archived,
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_STATUS_FILTER = {
    all: "all",
    ...CONTENT_STATUS,
} as const;

export type ContentStatusFilter =
    (typeof CONTENT_STATUS_FILTER)[keyof typeof CONTENT_STATUS_FILTER];

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
    [CONTENT_STATUS.archived]: "Archivé",
    [CONTENT_STATUS.draft]: "Brouillon",
    [CONTENT_STATUS.published]: "Publié",
};

export const CONTENT_STATUS_FILTER_OPTIONS = [
    { label: "Tous les statuts de publication", value: CONTENT_STATUS_FILTER.all },
    { label: CONTENT_STATUS_LABELS[CONTENT_STATUS.draft], value: CONTENT_STATUS_FILTER.draft },
    { label: CONTENT_STATUS_LABELS[CONTENT_STATUS.published], value: CONTENT_STATUS_FILTER.published },
    { label: CONTENT_STATUS_LABELS[CONTENT_STATUS.archived], value: CONTENT_STATUS_FILTER.archived },
] satisfies Array<{ label: string; value: ContentStatusFilter }>;

export function isContentStatus(value: unknown): value is ContentStatus {
    return typeof value === "string" && CONTENT_STATUSES.includes(value as ContentStatus);
}

export function isContentStatusFilter(value: unknown): value is ContentStatusFilter {
    return value === CONTENT_STATUS_FILTER.all || isContentStatus(value);
}

export function matchesContentStatusFilter(
    status: ContentStatus,
    filter: ContentStatusFilter,
) {
    return filter === CONTENT_STATUS_FILTER.all || status === filter;
}

export function normalizeContentStatus(
    value: unknown,
    fallback: ContentStatus = CONTENT_STATUS.draft,
): ContentStatus {
    return isContentStatus(value) ? value : fallback;
}

export function isPublishedContent(status: ContentStatus) {
    return status === CONTENT_STATUS.published;
}
