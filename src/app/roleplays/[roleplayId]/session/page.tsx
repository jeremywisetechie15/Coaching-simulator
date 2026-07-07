import { notFound, redirect } from "next/navigation";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { RoleplaySessionPage } from "@/features/roleplays/components";
import { findMockRoleplayById, isUuid, mapDbRoleplayToUi } from "@/features/roleplays/data/roleplay-ui-adapter";
import { getRoleplayById } from "@/features/roleplays/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{ roleplayId: string }>;
}

export async function generateMetadata() {
    return {
        title: `Simulation | Roleplays | MaiaCoach`,
    };
}

export default async function Page({ params }: PageProps) {
    const { roleplayId } = await params;
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(`/auth?redirect=/roleplays/${roleplayId}/session`);
        }

        throw error;
    }

    let roleplay = findMockRoleplayById(roleplayId);

    try {
        if (isUuid(roleplayId)) {
            roleplay = mapDbRoleplayToUi(await getRoleplayById(roleplayId));
        }
    } catch (error) {
        if (error instanceof NotFoundError) {
            roleplay = findMockRoleplayById(roleplayId);
        } else {
            throw error;
        }
    }

    if (!roleplay) {
        notFound();
    }

    return <RoleplaySessionPage profileValues={toProfileFormValues(profile)} roleplay={roleplay} />;
}
