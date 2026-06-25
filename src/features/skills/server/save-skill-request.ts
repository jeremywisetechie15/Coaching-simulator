import { NextRequest } from "next/server";
import { saveSkillDto, type SaveSkillDto } from "@/features/skills/dto";

export async function parseSaveSkillRequest(request: NextRequest): Promise<SaveSkillDto> {
    const payload = await request.json();

    return saveSkillDto.parse(payload);
}
