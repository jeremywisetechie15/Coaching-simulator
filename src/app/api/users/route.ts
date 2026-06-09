import { NextResponse } from "next/server";
import { jsonError } from "@/lib/server/http";
import { listUsers } from "@/features/users/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const users = await listUsers();

        return NextResponse.json({ users });
    } catch (error) {
        return jsonError(error);
    }
}
