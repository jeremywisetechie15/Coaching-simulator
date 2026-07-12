import { notFound, redirect } from "next/navigation";
import { getRoleplayMethod } from "@/features/roleplays/data/roleplays";
import { getMethodById } from "@/features/methods/server";
import { RoleplayStepsPage } from "@/features/roleplays/components";
import {
    findMockRoleplayById,
    isUuid,
    mapDbRoleplayToUi,
    mapMethodDetailToUi,
} from "@/features/roleplays/data/roleplay-ui-adapter";
import { getRoleplayById } from "@/features/roleplays/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo, withSearchParam } from "@/features/app-shell/domain";

interface PageProps {
    params: Promise<{ roleplayId: string }>;
    searchParams: Promise<{ coach?: string; returnTo?: string; sessionId?: string }>;
}

export async function generateMetadata() {
    return {
        title: `Étapes | Roleplays | MaiaCoach`,
    };
}

export default async function Page({ params, searchParams }: PageProps) {
    const { roleplayId } = await params;
    const { coach, returnTo, sessionId } = await searchParams;
    const variant = coach === "after" ? "improve" : "prepare";
    let profile;
    let dbMethodId: string | null = null;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            const stepsHref = coach === "after"
                ? withSearchParam(`/roleplays/${roleplayId}/steps`, "coach", "after")
                : `/roleplays/${roleplayId}/steps`;
            const sessionStepsHref = sessionId ? withSearchParam(stepsHref, "sessionId", sessionId) : stepsHref;
            redirect(buildAuthRedirectHref(withReturnTo(sessionStepsHref, returnTo)));
        }

        throw error;
    }

    let roleplay = findMockRoleplayById(roleplayId);

    try {
        if (isUuid(roleplayId)) {
            const dbRoleplay = await getRoleplayById(roleplayId);
            dbMethodId = dbRoleplay.methodId;
            roleplay = mapDbRoleplayToUi(dbRoleplay);
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

    let method = getRoleplayMethod(roleplay);

    if (dbMethodId) {
        try {
            method = mapMethodDetailToUi(await getMethodById(dbMethodId));
        } catch (error) {
            if (!(error instanceof NotFoundError)) {
                throw error;
            }
        }
    }

    if (!method) {
        notFound();
    }

    return (
        <RoleplayStepsPage
            profileValues={toProfileFormValues(profile)}
            roleplay={roleplay}
            method={method}
            referenceSessionId={sessionId}
            variant={variant}
        />
    );
}
