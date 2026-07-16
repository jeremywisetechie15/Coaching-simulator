import { getHttpErrorToastType, notify } from "./toast";

export const FORM_SUBMIT_FEEDBACK_MESSAGES = {
    error: "Enregistrement impossible",
    success: "Enregistrement effectué avec succès",
    unauthorized: "Action non autorisée",
} as const;

export const FORM_SUBMIT_ERROR_MESSAGES = {
    invalidData: "Certains champs sont incomplets ou invalides. Vérifiez le formulaire.",
    network: "La connexion au serveur a été interrompue. Vérifiez votre connexion et réessayez.",
    technical: "Le serveur n'a pas pu terminer cette action. Réessayez dans quelques instants.",
    tooLarge: "Un fichier est trop volumineux. Vérifiez la taille maximale indiquée sous le champ.",
} as const;

export interface FormSubmitIssueLike {
    message?: string | null;
}

export interface FormSubmitApiErrorPayload {
    code?: string | null;
    error?: string | null;
    issues?: FormSubmitIssueLike[] | null;
}

export class FormSubmitError extends Error {
    readonly code: string | null;
    readonly status: number | null;

    constructor(message: string, status?: number | null, code?: string | null) {
        super(message);
        this.name = "FormSubmitError";
        this.code = code ?? null;
        this.status = status ?? null;
    }
}

export function createFormSubmitError(message: string, status?: number | null, code?: string | null) {
    return new FormSubmitError(message, status, code);
}

export function getFormSubmitIssuesMessage(
    issues: readonly FormSubmitIssueLike[] | null | undefined,
    fallback: string,
) {
    const messages = Array.from(
        new Set(
            (issues ?? [])
                .map((issue) => issue.message?.trim() ?? "")
                .filter(Boolean),
        ),
    );

    return messages.length > 0 ? messages.join(" ") : fallback;
}

export function getFormSubmitApiErrorMessage(
    payload: FormSubmitApiErrorPayload | null | undefined,
    status: number,
    fallback: string,
) {
    const issuesMessage = getFormSubmitIssuesMessage(payload?.issues, "");
    if (issuesMessage) return issuesMessage;

    const apiMessage = payload?.error?.trim() ?? "";
    if (
        apiMessage &&
        apiMessage !== "Erreur interne." &&
        apiMessage !== "Données invalides."
    ) {
        return apiMessage;
    }

    if (payload?.code === "VALIDATION_ERROR") {
        return FORM_SUBMIT_ERROR_MESSAGES.invalidData;
    }

    if (status === 413) {
        return FORM_SUBMIT_ERROR_MESSAGES.tooLarge;
    }

    if (status >= 500 || payload?.code === "INTERNAL_SERVER_ERROR") {
        return FORM_SUBMIT_ERROR_MESSAGES.technical;
    }

    return fallback;
}

export function createFormSubmitApiError(
    payload: FormSubmitApiErrorPayload | null | undefined,
    status: number,
    fallback: string,
) {
    return createFormSubmitError(
        getFormSubmitApiErrorMessage(payload, status, fallback),
        status,
        payload?.code,
    );
}

export function getFormSubmitErrorMessage(error: unknown, fallback: string) {
    if (!(error instanceof Error) || !error.message.trim()) return fallback;

    const detail = error.message.trim();
    const normalizedDetail = detail.toLowerCase();
    if (
        normalizedDetail.includes("failed to fetch") ||
        normalizedDetail.includes("load failed") ||
        normalizedDetail.includes("networkerror")
    ) {
        return FORM_SUBMIT_ERROR_MESSAGES.network;
    }

    if (detail === "Erreur interne.") {
        return FORM_SUBMIT_ERROR_MESSAGES.technical;
    }

    return detail;
}

function getFormSubmitErrorStatus(error: unknown) {
    if (error instanceof FormSubmitError) return error.status;
    if (typeof error !== "object" || error === null || !("status" in error)) return null;

    return typeof error.status === "number" ? error.status : null;
}

export function notifyFormSubmitError(error: unknown, fallback: string) {
    const detail = getFormSubmitErrorMessage(error, fallback);
    const status = getFormSubmitErrorStatus(error);

    if (getHttpErrorToastType(status) === "warning") {
        notify.warning(FORM_SUBMIT_FEEDBACK_MESSAGES.unauthorized, { description: detail });
        return detail;
    }

    notify.error(FORM_SUBMIT_FEEDBACK_MESSAGES.error, { description: detail });
    return detail;
}

export function notifyFormSubmitSuccess() {
    notify.success(FORM_SUBMIT_FEEDBACK_MESSAGES.success);
}
