interface ShouldResetUserDraftInput {
    isEditing: boolean;
    nextUserId: string;
    previousUserId: string;
}

export function shouldResetUserDraft({
    isEditing,
    nextUserId,
    previousUserId,
}: ShouldResetUserDraftInput) {
    return !isEditing || nextUserId !== previousUserId;
}
