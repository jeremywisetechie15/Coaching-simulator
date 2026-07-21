import { NextRequest, NextResponse } from "next/server";
import { duplicateSkill } from "@/features/skills/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface DuplicateSkillRouteContext {
    params: Promise<{ skillId: string }>;
}

export async function POST(_request: NextRequest, context: DuplicateSkillRouteContext) {
    try {
        const { skillId } = await context.params;
        const skill = await duplicateSkill(skillId);

        return NextResponse.json({ skill }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
