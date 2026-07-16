import { notFound, redirect } from "next/navigation";
import { RoleplayProgressPage } from "@/features/roleplays/components";
import { roleplayProgress } from "@/features/roleplays/data/progress";
import { findMockRoleplayById, isUuid, mapDbRoleplayToUi } from "@/features/roleplays/data/roleplay-ui-adapter";
import { getRoleplayById, getRoleplayProgress } from "@/features/roleplays/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo } from "@/features/app-shell/domain";

interface PageProps {
    params: Promise<{ roleplayId: string }>;
    searchParams?: Promise<{ returnTo?: string }>;
}

export async function generateMetadata() {
    return {
        title: `Progression | Roleplays | MaiaCoach`,
    };
}

export default async function Page({ params, searchParams }: PageProps) {
    const { roleplayId } = await params;
    const { returnTo } = searchParams ? await searchParams : {};
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(buildAuthRedirectHref(withReturnTo(`/roleplays/${roleplayId}/progress`, returnTo)));
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
                roleplayDetail.previewTitle || roleplayDetail.title,
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
