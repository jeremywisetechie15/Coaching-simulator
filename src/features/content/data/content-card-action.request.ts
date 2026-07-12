interface ApiErrorPayload {
    error?: string;
}

export async function requestContentCardAction(
    route: string,
    method: "DELETE" | "POST",
    fallbackMessage: string,
) {
    const response = await fetch(route, { method });
    const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

    if (!response.ok) {
        throw new Error(payload?.error ?? fallbackMessage);
    }
}
