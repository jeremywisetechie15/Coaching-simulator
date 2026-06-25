import { NotFoundError } from "@/lib/server/errors";

export function assertHttpUrl(value: string, message = "URL de ressource invalide.") {
    let url: URL;

    try {
        url = new URL(value);
    } catch {
        throw new NotFoundError(message);
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new NotFoundError(message);
    }

    return url.toString();
}
