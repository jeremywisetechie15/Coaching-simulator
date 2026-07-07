import type { UserListItem } from "@/features/users/domain/users";
import { listUsers } from "./list-users";

export async function getUserById(userId: string): Promise<UserListItem | null> {
    const users = await listUsers();

    return users.find((user) => user.id === userId) ?? null;
}
