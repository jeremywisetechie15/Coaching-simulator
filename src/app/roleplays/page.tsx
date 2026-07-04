import { redirect } from "next/navigation";
import { RoleplaysPage } from "@/features/roleplays/components";
import { mapDbRoleplayListToUi } from "@/features/roleplays/data/roleplay-ui-adapter";
import { listRoleplays } from "@/features/roleplays/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";

export const metadata = {
    title: "Roleplays | MaiaCoach",
};

export default async function Page() {
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/roleplays");
    }

    const roleplays = mapDbRoleplayListToUi(await listRoleplays());

    return <RoleplaysPage profileValues={toProfileFormValues(profile)} roleplays={roleplays} />;
}
