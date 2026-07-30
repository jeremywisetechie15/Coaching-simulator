export function hideSystemInstructionsFromLearner<
    T extends { systemInstructions: string },
>(detail: T, isAdmin: boolean): T {
    if (isAdmin) {
        return detail;
    }

    return {
        ...detail,
        systemInstructions: "",
    };
}
