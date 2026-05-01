import type { ProfileFormValues } from "@/features/profile/domain/profile";
import { ProfileLayout } from "./ProfileLayout";
import { ProfilePageContent } from "./ProfilePageContent";

interface ProfilePageProps {
    initialProfileValues: ProfileFormValues;
}

export function ProfilePage({ initialProfileValues }: ProfilePageProps) {
    return (
        <ProfileLayout profileValues={initialProfileValues}>
            <ProfilePageContent initialProfileValues={initialProfileValues} />
        </ProfileLayout>
    );
}
