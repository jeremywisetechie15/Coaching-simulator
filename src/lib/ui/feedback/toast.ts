import { toast } from "sonner";

export const notify = toast;

export function getHttpErrorToastType(status: number | null | undefined) {
    return status === 401 || status === 403 ? "warning" : "error";
}

export function notifyHttpError(message: string, status?: number | null) {
    if (getHttpErrorToastType(status) === "warning") {
        notify.warning(message);
        return;
    }

    notify.error(message);
}
