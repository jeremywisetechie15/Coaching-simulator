import {
    CONTENT_STATUS,
    isContentCategoryForDomain,
    isContentDomain,
    normalizeContentStatus,
    type ContentCategory,
    type ContentDomain,
} from "@/features/content/domain";
import {
    SKILL_VISIBILITY_SCOPES,
    SKILL_DIMENSIONS,
    isSkillType,
    type SkillDetail,
    type SkillDimension,
    type SkillDimensionItem,
    type SkillListItem,
} from "@/features/skills/domain/skills";

export interface SkillRow {
    category?: string | null;
    assigned_user_id?: string | null;
    description?: string | null;
    domain?: string | null;
    group_id?: string | null;
    id: string;
    is_active?: boolean | null;
    name: string;
    organization_id?: string | null;
    status?: string | null;
    skill_type?: string | null;
    visibility_scope?: string | null;
}

export interface SkillDimensionItemRow {
    dimension?: string | null;
    id: string;
    is_active?: boolean | null;
    item_order?: number | null;
    label: string;
    skill_id: string;
}

function normalizeDomain(value: string | null | undefined): ContentDomain | null {
    return isContentDomain(value) ? value : null;
}

function normalizeCategory(
    domain: ContentDomain | null,
    value: string | null | undefined,
): ContentCategory | null {
    return isContentCategoryForDomain(domain, value) ? value : null;
}

function normalizeDimension(value: string | null | undefined): SkillDimension {
    return SKILL_DIMENSIONS.includes(value as SkillDimension) ? (value as SkillDimension) : "savoir";
}

function normalizeScope(value: string | null | undefined) {
    return SKILL_VISIBILITY_SCOPES.includes(value as (typeof SKILL_VISIBILITY_SCOPES)[number])
        ? (value as (typeof SKILL_VISIBILITY_SCOPES)[number])
        : "public";
}

export function mapSkillRowToListItem(row: SkillRow): SkillListItem {
    const domain = normalizeDomain(row.domain);

    return {
        assignedUserId: row.assigned_user_id ?? null,
        category: normalizeCategory(domain, row.category),
        description: row.description ?? "",
        domain,
        groupId: row.group_id ?? null,
        id: row.id,
        isActive: row.is_active ?? true,
        name: row.name,
        organizationId: row.organization_id ?? null,
        scope: normalizeScope(row.visibility_scope),
        status: normalizeContentStatus(row.status, CONTENT_STATUS.draft),
        type: isSkillType(row.skill_type) ? row.skill_type : "Métier",
    };
}

export function mapSkillDimensionItemRow(row: SkillDimensionItemRow): SkillDimensionItem {
    return {
        dimension: normalizeDimension(row.dimension),
        id: row.id,
        isActive: row.is_active ?? true,
        label: row.label,
        order: row.item_order ?? 1,
        skillId: row.skill_id,
    };
}

export function mapSkillRowsToDetail(
    row: SkillRow,
    dimensionRows: SkillDimensionItemRow[],
): SkillDetail {
    return {
        ...mapSkillRowToListItem(row),
        dimensionItems: dimensionRows
            .map(mapSkillDimensionItemRow)
            .sort((first, second) => {
                const dimensionOrder = SKILL_DIMENSIONS.indexOf(first.dimension) - SKILL_DIMENSIONS.indexOf(second.dimension);
                return dimensionOrder || first.order - second.order;
            }),
    };
}
