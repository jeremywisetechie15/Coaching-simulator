import { redirect } from "next/navigation";
import { SkillsPage } from "@/features/skills/components";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { listSkills } from "@/features/skills/server";
import { SKILL_ROUTES } from "@/features/skills/domain/skills";
import { UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo, withSearchParams } from "@/features/app-shell/domain";

interface PageProps {
    searchParams?: Promise<{
        category?: string;
        domain?: string;
        q?: string;
        returnTo?: string;
        type?: string;
    }>;
}

export const metadata = {
    title: "Compétences | MaiaCoach",
};

export default async function Page({ searchParams }: PageProps) {
    const filters = searchParams ? await searchParams : {};
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect(
            buildAuthRedirectHref(
                withReturnTo(
                    withSearchParams(SKILL_ROUTES.app.collection, {
                        category: filters.category,
                        domain: filters.domain,
                        q: filters.q,
                        type: filters.type,
                    }),
                    filters.returnTo,
                ),
            ),
        );
    }

    const skills = await listSkills();

    return <SkillsPage profileValues={toProfileFormValues(profile)} skills={skills} />;
}
