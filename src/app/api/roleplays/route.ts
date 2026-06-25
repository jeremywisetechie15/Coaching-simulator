import { NextRequest, NextResponse } from "next/server";
import { createRoleplay, listRoleplays, parseSaveRoleplayRequest } from "@/features/roleplays/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const roleplays = await listRoleplays();

        return NextResponse.json({ roleplays });
    } catch (error) {
        return jsonError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const { input, uploadFilesByClientId } = await parseSaveRoleplayRequest(request);
        const roleplay = await createRoleplay(input, uploadFilesByClientId);

        return NextResponse.json({ roleplay }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
