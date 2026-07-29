import { notFound, redirect } from "next/navigation";
import { isSelectableContent } from "@/features/content/domain";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { RoleplaySessionPage } from "@/features/roleplays/components";
import { findMockRoleplayById, isUuid, mapDbRoleplayToUi } from "@/features/roleplays/data/roleplay-ui-adapter";
import {
    getRoleplayById,
    listRoleplayCoachNotes,
} from "@/features/roleplays/server";
import type { RoleplayCoachNoteGroup } from "@/features/roleplays/domain";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo } from "@/features/app-shell/domain";

interface PageProps {
    params: Promise<{ roleplayId: string }>;
    searchParams?: Promise<{ returnTo?: string }>;
}

export async function generateMetadata() {
    return {
        title: `Simulation | Roleplays | MaiaCoach`,
    };
}

export default async function Page({ params, searchParams }: PageProps) {
    const { roleplayId } = await params;
    const { returnTo } = searchParams ? await searchParams : {};
    let profile;
    let noteGroups: RoleplayCoachNoteGroup[] = [];

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            redirect(buildAuthRedirectHref(withReturnTo(`/roleplays/${roleplayId}/session`, returnTo)));
        }

        throw error;
    }

    let roleplay = findMockRoleplayById(roleplayId);

    try {
        if (isUuid(roleplayId)) {
            const [dbRoleplay, savedNoteGroups] = await Promise.all([
                getRoleplayById(roleplayId),
                listRoleplayCoachNotes(roleplayId),
            ]);
            noteGroups = savedNoteGroups;
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

    if (!isSelectableContent(roleplay.status, roleplay.isActive)) {
        redirect(withReturnTo(`/roleplays/${roleplayId}`, returnTo));
    }

    return (
        <RoleplaySessionPage
            noteGroups={noteGroups}
            profileValues={toProfileFormValues(profile)}
            roleplay={roleplay}
        />
    );
}
