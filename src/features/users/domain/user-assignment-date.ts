export function resolveUserAssignmentDate(
    contentAssignedAt: string | null | undefined,
    userCreatedAt: string | null | undefined,
) {
    return contentAssignedAt ?? userCreatedAt ?? null;
}
