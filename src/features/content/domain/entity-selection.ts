import { CONTENT_STATUS, type ContentStatus } from "./content-status";

export interface EntitySelectionAvailability {
    isSelectable?: boolean;
}

export const SELECTABLE_CONTENT_IS_ACTIVE = true;
export const UNAVAILABLE_ENTITY_LABEL_SUFFIX = "indisponible";

export function isSelectableContent(
    status: ContentStatus,
    isActive = SELECTABLE_CONTENT_IS_ACTIVE,
) {
    return status === CONTENT_STATUS.published && isActive;
}

export function isEntitySelectionAvailable(option: EntitySelectionAvailability) {
    return option.isSelectable !== false;
}

export function getEntitySelectionLabel(
    label: string,
    option: EntitySelectionAvailability,
) {
    return isEntitySelectionAvailable(option)
        ? label
        : `${label} (${UNAVAILABLE_ENTITY_LABEL_SUFFIX})`;
}
