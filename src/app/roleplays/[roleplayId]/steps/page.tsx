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

interface PageProps {
    params: Promise<{ roleplayId: string }>;
    searchParams: Promise<{ coach?: string }>;
}

export async function generateMetadata() {
    return {
        title: `Étapes | Roleplays | MaiaCoach`,
    };
}

export default async function Page({ params, searchParams }: PageProps) {
    const { roleplayId } = await params;
    const { coach } = await searchParams;
    const variant = coach === "after" ? "improve" : "prepare";
    let profile;
    let dbMethodId: string | null = null;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(`/auth?redirect=/roleplays/${roleplayId}/steps`);
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
            variant={variant}
        />
    );
}
