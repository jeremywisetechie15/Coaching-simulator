import { redirect } from "next/navigation";
import { RoleplaysPage } from "@/features/roleplays/components";
import { mapDbRoleplayListToUi } from "@/features/roleplays/data/roleplay-ui-adapter";
import { listRoleplays } from "@/features/roleplays/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";
import { buildAuthRedirectHref, withReturnTo, withSearchParams } from "@/features/app-shell/domain";

interface PageProps {
    searchParams?: Promise<{
        category?: string;
        disc?: string;
        domain?: string;
        level?: string;
        returnTo?: string;
    }>;
}

export const metadata = {
    title: "Roleplays | MaiaCoach",
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
                    withSearchParams("/roleplays", {
                        category: filters.category,
                        disc: filters.disc,
                        domain: filters.domain,
                        level: filters.level,
                    }),
                    filters.returnTo,
                ),
            ),
        );
    }

    const roleplays = mapDbRoleplayListToUi(await listRoleplays());

    return <RoleplaysPage profileValues={toProfileFormValues(profile)} roleplays={roleplays} />;
}
