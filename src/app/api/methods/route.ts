import { NextRequest, NextResponse } from "next/server";
import { createMethod, listMethods, parseSaveMethodRequest } from "@/features/methods/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const methods = await listMethods();

        return NextResponse.json({ methods });
    } catch (error) {
        return jsonError(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const { input, uploadFilesByClientId } = await parseSaveMethodRequest(request);
        const method = await createMethod(input, uploadFilesByClientId);

        return NextResponse.json({ method }, { status: 201 });
    } catch (error) {
        return jsonError(error);
    }
}
