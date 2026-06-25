import { CONTENT_STATUS, normalizeContentStatus } from "@/features/content/domain";
import {
    SKILL_CATEGORIES,
    SKILL_DIMENSIONS,
    type SkillCategory,
    type SkillDetail,
    type SkillDimension,
    type SkillDimensionItem,
    type SkillListItem,
} from "@/features/skills/domain/skills";

export interface SkillRow {
    category?: string | null;
    description?: string | null;
    domain?: string | null;
    functions?: string[] | null;
    id: string;
    is_active?: boolean | null;
    name: string;
    objective?: string | null;
    status?: string | null;
}

export interface SkillDimensionItemRow {
    dimension?: string | null;
    id: string;
    is_active?: boolean | null;
    item_order?: number | null;
    label: string;
    skill_id: string;
}

function normalizeCategory(value: string | null | undefined): SkillCategory {
    return SKILL_CATEGORIES.includes(value as SkillCategory) ? (value as SkillCategory) : "Métier";
}

function normalizeDimension(value: string | null | undefined): SkillDimension {
    return SKILL_DIMENSIONS.includes(value as SkillDimension) ? (value as SkillDimension) : "savoir";
}

function cleanArray(value: string[] | null | undefined) {
    return Array.isArray(value) ? value.filter((item) => item.trim().length > 0) : [];
}

export function mapSkillRowToListItem(row: SkillRow): SkillListItem {
    return {
        category: normalizeCategory(row.category),
        description: row.description ?? "",
        domain: row.domain ?? "",
        functions: cleanArray(row.functions),
        id: row.id,
        isActive: row.is_active ?? true,
        name: row.name,
        objective: row.objective ?? "",
        status: normalizeContentStatus(row.status, CONTENT_STATUS.draft),
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
