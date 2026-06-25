import { NextRequest, NextResponse } from "next/server";
import { archiveSkill, getSkillById, parseSaveSkillRequest, updateSkill } from "@/features/skills/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface SkillRouteContext {
    params: Promise<{ skillId: string }>;
}

export async function GET(_request: NextRequest, context: SkillRouteContext) {
    try {
        const { skillId } = await context.params;
        const skill = await getSkillById(skillId);

        return NextResponse.json({ skill });
    } catch (error) {
        return jsonError(error);
    }
}

export async function PATCH(request: NextRequest, context: SkillRouteContext) {
    try {
        const { skillId } = await context.params;
        const input = await parseSaveSkillRequest(request);
        const skill = await updateSkill(skillId, input);

        return NextResponse.json({ skill });
    } catch (error) {
        return jsonError(error);
    }
}

export async function DELETE(_request: NextRequest, context: SkillRouteContext) {
    try {
        const { skillId } = await context.params;
        await archiveSkill(skillId);

        return NextResponse.json({ ok: true });
    } catch (error) {
        return jsonError(error);
    }
}
