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

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
    [CONTENT_STATUS.archived]: "Archivé",
    [CONTENT_STATUS.draft]: "Brouillon",
    [CONTENT_STATUS.published]: "Publié",
};

export function isContentStatus(value: unknown): value is ContentStatus {
    return typeof value === "string" && CONTENT_STATUSES.includes(value as ContentStatus);
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
