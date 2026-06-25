import { redirect } from "next/navigation";
import { listQuizOptions } from "@/features/evaluations/server";
import { CreateMethodPage } from "@/features/methods/components";
import { listOrganizations } from "@/features/organizations/server";
import { toProfileFormValues } from "@/features/profile/domain/profile";
import { getCurrentProfile } from "@/features/profile/server";
import { UnauthorizedError } from "@/lib/server/errors";

export const metadata = {
    title: "Ajouter une méthode | MaiaCoach",
};

export default async function Page() {
    let profile;

    try {
        profile = await getCurrentProfile();
    } catch (error) {
        if (!(error instanceof UnauthorizedError)) {
            throw error;
        }

        redirect("/auth?redirect=/methods/new");
    }

    const [organizations, quizOptions] = await Promise.all([
        listOrganizations(),
        listQuizOptions({ unassignedOnly: true }),
    ]);
    const organizationOptions = organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
    }));

    return (
        <CreateMethodPage
            organizationOptions={organizationOptions}
            profileValues={toProfileFormValues(profile)}
            quizOptions={quizOptions}
        />
    );
}
