import { NextRequest, NextResponse } from "next/server";
import {
    createSkill,
    listSkillsForCurrentUser,
    parseSaveSkillRequest,
} from "@/features/skills/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const skills = await listSkillsForCurrentUser();

        return NextResponse.json({ skills });
    } catch (error) {
        return jsonError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const input = await parseSaveSkillRequest(request);
        const skill = await createSkill(input);

        return NextResponse.json({ skill }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
