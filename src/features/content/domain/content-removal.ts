import { CONTENT_STATUS, type ContentStatus } from "./content-status";

export const CONTENT_REMOVAL_ACTION = {
    archive: "archive",
    delete: "delete",
} as const;

export type ContentRemovalAction =
    (typeof CONTENT_REMOVAL_ACTION)[keyof typeof CONTENT_REMOVAL_ACTION];

export interface ContentRemovalTarget {
    id: string;
    name: string;
    status: ContentStatus;
}

/**
 * A draft has no learner history and may be deleted permanently.
 * A published item must be archived so existing history remains readable.
 */
export function getContentRemovalAction(
    status: ContentStatus,
): ContentRemovalAction | null {
    if (status === CONTENT_STATUS.draft) return CONTENT_REMOVAL_ACTION.delete;
    if (status === CONTENT_STATUS.published) return CONTENT_REMOVAL_ACTION.archive;

    return null;
}

export function getContentRemovalErrorMessage(
    status: ContentStatus,
    entityLabel: string,
) {
    return getContentRemovalAction(status) === CONTENT_REMOVAL_ACTION.delete
        ? `Impossible de supprimer ${entityLabel}.`
        : `Impossible d’archiver ${entityLabel}.`;
}
