import { USERS_QUERY_KEY } from "@/features/users/domain/user-query";
import { ORGANIZATIONS_QUERY_KEY } from "@/features/organizations/domain/organization-query";

interface UserQueryInvalidator {
    invalidateQueries(options: { queryKey: readonly string[] }): Promise<unknown>;
}

interface UserPageRefresher {
    refresh(): void;
}

export function refreshUserViews(
    queryClient: UserQueryInvalidator,
    router: UserPageRefresher,
) {
    const invalidation = Promise.all([
        queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY }),
    ]);
    router.refresh();

    return invalidation;
}
