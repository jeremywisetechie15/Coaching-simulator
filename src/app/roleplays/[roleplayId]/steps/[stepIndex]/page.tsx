import { notFound, redirect } from "next/navigation";
import { getRoleplayMethod } from "@/features/roleplays/data/roleplays";
import { getMethodById } from "@/features/methods/server";
import { RoleplayStepCoachPage } from "@/features/roleplays/components";
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
    params: Promise<{ roleplayId: string; stepIndex: string }>;
    searchParams: Promise<{ coach?: string; returnTo?: string; sessionId?: string }>;
}

export async function generateMetadata() {
    return {
        title: `Coach IA | Roleplays | MaiaCoach`,
    };
}

export default async function Page({ params, searchParams }: PageProps) {
    const { roleplayId, stepIndex } = await params;
    const { coach, returnTo, sessionId } = await searchParams;
    const variant = coach === "after" ? "improve" : "prepare";
    const coachSessionId = crypto.randomUUID();
    let profile;
    let dbMethodId: string | null = null;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            const stepHref = coach === "after"
                ? withSearchParam(`/roleplays/${roleplayId}/steps/${stepIndex}`, "coach", "after")
                : `/roleplays/${roleplayId}/steps/${stepIndex}`;
            const sessionStepHref = sessionId ? withSearchParam(stepHref, "sessionId", sessionId) : stepHref;
            redirect(buildAuthRedirectHref(withReturnTo(sessionStepHref, returnTo)));
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

    const stepNumber = Number(stepIndex);
    const step = Number.isInteger(stepNumber) ? method.steps[stepNumber - 1] : undefined;

    if (!step) {
        notFound();
    }

    return (
        <RoleplayStepCoachPage
            coachSessionId={coachSessionId}
            profileValues={toProfileFormValues(profile)}
            roleplay={roleplay}
            method={method}
            referenceSessionId={sessionId}
            step={step}
            stepNumber={stepNumber}
            variant={variant}
        />
    );
}
