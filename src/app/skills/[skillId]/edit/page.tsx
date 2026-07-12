import { notFound, redirect } from "next/navigation";
import { AccessDeniedPage } from "@/features/app-shell/components";
import {
    APP_NAVIGATION_RESOURCE,
    canManageAppResource,
} from "@/features/auth/domain/access-control";
import { CreateSkillPage } from "@/features/skills/components";
import {
    getSkillById,
    listSkillGroupOptions,
    listSkillOrganizationOptions,
    listSkillUserOptions,
} from "@/features/skills/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { NotFoundError, UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo } from "@/features/app-shell/domain";

interface PageProps {
    params: Promise<{ skillId: string }>;
    searchParams?: Promise<{ returnTo?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { skillId } = await params;

    try {
        const skill = await getSkillById(skillId);

        return {
            title: `Modifier ${skill.name} | MaiaCoach`,
        };
    } catch {
        return {
            title: "Modifier une compétence | MaiaCoach",
        };
    }
}

export default async function Page({ params, searchParams }: PageProps) {
    const { skillId } = await params;
    const { returnTo } = searchParams ? await searchParams : {};
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(buildAuthRedirectHref(withReturnTo(`/skills/${skillId}/edit`, returnTo)));
    }

    const profileValues = toProfileFormValues(profile);

    if (!canManageAppResource(profileValues.platformRole, APP_NAVIGATION_RESOURCE.skills)) {
        return (
            <AccessDeniedPage
                activePrimaryItem="Compétences"
                profileValues={profileValues}
                searchPlaceholder="Rechercher..."
            />
        );
    }

    let skill;

    try {
        skill = await getSkillById(skillId);
    } catch (error) {
        if (error instanceof NotFoundError) {
            notFound();
        }

        throw error;
    }

    const [organizationOptions, groupOptions, userOptions] = await Promise.all([
        listSkillOrganizationOptions(),
        listSkillGroupOptions(),
        listSkillUserOptions(),
    ]);

    return (
        <CreateSkillPage
            groupOptions={groupOptions}
            initialSkill={skill}
            organizationOptions={organizationOptions}
            profileValues={profileValues}
            userOptions={userOptions}
        />
    );
}
