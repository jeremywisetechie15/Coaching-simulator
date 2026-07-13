import type { ContentStatus } from "@/features/content/domain";
import type { SaveCoachDto } from "@/features/coaches/dto/save-coach.dto";

interface CoachInsertContext {
    avatarUrl: string | null;
    backgroundImagePath: string | null;
    createdBy: string;
    id: string;
    now: string;
    status: ContentStatus;
}

export function createCoachInsert(input: SaveCoachDto, context: CoachInsertContext) {
    return {
        avatar_url: context.avatarUrl,
        background_image_path: context.backgroundImagePath,
        certifications: input.certifications || null,
        coaching_style: input.coachingStyle || null,
        created_at: context.now,
        created_by: context.createdBy,
        diploma: input.diploma || null,
        disc_profile: input.discProfile || null,
        expertise_domain: input.expertiseDomain || null,
        id: context.id,
        name: input.name,
        status: context.status,
        system_instructions: input.systemInstructions,
        updated_at: context.now,
        voice_id: input.voiceId,
    };
}
