import { requireAdmin } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import { resolveDuplicateName } from "@/features/content/server";
import { SKILL_DIMENSIONS, type SkillDimensions } from "@/features/skills/domain/skills";
import { saveSkillDto } from "@/features/skills/dto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSkill } from "./create-skill";
import { fetchSkillDetail } from "./skill-query";

export async function duplicateSkill(skillId: string) {
    await requireAdmin();
    const adminSupabase = createAdminClient();
    const source = await fetchSkillDetail(adminSupabase, skillId);
    const duplicateName = await resolveDuplicateName(adminSupabase, {
        column: "name",
        maxLength: 180,
        sourceName: source.name,
        table: "skills",
    });
    const dimensionItems = SKILL_DIMENSIONS.reduce<SkillDimensions>(
        (dimensions, dimension) => ({
            ...dimensions,
            [dimension]: source.dimensionItems
                .filter((item) => item.dimension === dimension && item.isActive)
                .sort((first, second) => first.order - second.order)
                .map((item) => item.label),
        }),
        { savoir: [], savoir_etre: [], savoir_faire: [] },
    );
    const input = saveSkillDto.parse({
        assignedUserId: source.assignedUserId,
        category: source.category ?? "",
        description: source.description,
        dimensionItems: Object.fromEntries(
            SKILL_DIMENSIONS.map((dimension) => [
                dimension,
                dimensionItems[dimension].map((label) => ({ label })),
            ]),
        ),
        domain: source.domain ?? "",
        groupId: source.groupId,
        name: duplicateName,
        organizationId: source.organizationId,
        scope: source.scope,
        status: CONTENT_STATUS.draft,
        type: source.type,
    });

    return createSkill(input);
}
