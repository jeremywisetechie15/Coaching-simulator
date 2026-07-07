import { notFound, redirect } from "next/navigation";
import { RoleplayProgressPage } from "@/features/roleplays/components";
import { roleplayProgress } from "@/features/roleplays/data/progress";
import { findMockRoleplayById, isUuid, mapDbRoleplayToUi } from "@/features/roleplays/data/roleplay-ui-adapter";
import { getRoleplayById, getRoleplayProgress } from "@/features/roleplays/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";

interface PageProps {
    params: Promise<{ roleplayId: string }>;
}

export async function generateMetadata() {
    return {
        title: `Progression | Roleplays | MaiaCoach`,
    };
}

export default async function Page({ params }: PageProps) {
    const { roleplayId } = await params;
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(`/auth?redirect=/roleplays/${roleplayId}/progress`);
        }

        throw error;
    }

    let roleplay = findMockRoleplayById(roleplayId);
    let progress = roleplayProgress;

    try {
        if (isUuid(roleplayId)) {
            const roleplayDetail = await getRoleplayById(roleplayId);
            roleplay = mapDbRoleplayToUi(roleplayDetail);
            progress = await getRoleplayProgress(
                roleplayId,
                roleplayDetail.objective || roleplayDetail.title,
                roleplayDetail.scorecardId,
                roleplayDetail.methodId,
            );
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

    return <RoleplayProgressPage profileValues={toProfileFormValues(profile)} progress={progress} roleplay={roleplay} />;
}
