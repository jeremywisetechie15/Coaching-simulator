import { notFound, redirect } from "next/navigation";
import { RoleplayDetailPage } from "@/features/roleplays/components";
import { findMockRoleplayById, isUuid, mapDbRoleplayToUi } from "@/features/roleplays/data/roleplay-ui-adapter";
import type { RoleplayCoachNoteGroup } from "@/features/roleplays/domain";
import { getRoleplayById, listRoleplayCoachNotes } from "@/features/roleplays/server";
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
        title: `Roleplay | MaiaCoach`,
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
            redirect(buildAuthRedirectHref(withReturnTo(`/roleplays/${roleplayId}`, returnTo)));
        }

        throw error;
    }

    let roleplay = findMockRoleplayById(roleplayId);
    let noteGroups: RoleplayCoachNoteGroup[] = [];

    try {
        if (isUuid(roleplayId)) {
            const [dbRoleplay, savedNoteGroups] = await Promise.all([
                getRoleplayById(roleplayId),
                listRoleplayCoachNotes(roleplayId),
            ]);
            roleplay = mapDbRoleplayToUi(dbRoleplay);
            noteGroups = savedNoteGroups;
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

    return (
        <RoleplayDetailPage
            noteGroups={noteGroups}
            profileValues={toProfileFormValues(profile)}
            roleplay={roleplay}
        />
    );
}
