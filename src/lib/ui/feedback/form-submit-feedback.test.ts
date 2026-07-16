import { beforeEach, describe, expect, it, vi } from "vitest";
import { notify } from "./toast";
import {
    createFormSubmitApiError,
    createFormSubmitError,
    FORM_SUBMIT_ERROR_MESSAGES,
    FormSubmitError,
    getFormSubmitApiErrorMessage,
    getFormSubmitErrorMessage,
    getFormSubmitIssuesMessage,
    notifyFormSubmitError,
    notifyFormSubmitSuccess,
} from "./form-submit-feedback";

vi.mock("./toast", () => ({
    getHttpErrorToastType: (status: number | null | undefined) =>
        status === 401 || status === 403 ? "warning" : "error",
    notify: {
        error: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
    },
}));

describe("form submit feedback", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("preserves the HTTP status and detailed message", () => {
        const error = createFormSubmitError("Accès administrateur requis.", 403, "FORBIDDEN");

        expect(error).toBeInstanceOf(FormSubmitError);
        expect(error.code).toBe("FORBIDDEN");
        expect(error.status).toBe(403);
        expect(getFormSubmitErrorMessage(error, "Fallback")).toBe("Accès administrateur requis.");
    });

    it("uses the fallback for unknown errors", () => {
        expect(getFormSubmitErrorMessage(null, "Enregistrement impossible."))
            .toBe("Enregistrement impossible.");
    });

    it("deduplicates validation issues into one simple explanation", () => {
        expect(
            getFormSubmitIssuesMessage(
                [
                    { message: "Le nom est requis." },
                    { message: "Le titre d'étape est requis." },
                    { message: "Le nom est requis." },
                ],
                "Fallback",
            ),
        ).toBe("Le nom est requis. Le titre d'étape est requis.");
    });

    it("turns hidden server failures into a safe actionable message", () => {
        const payload = { code: "INTERNAL_SERVER_ERROR", error: "Erreur interne." };

        expect(getFormSubmitApiErrorMessage(payload, 500, "Fallback"))
            .toBe(FORM_SUBMIT_ERROR_MESSAGES.technical);
        expect(createFormSubmitApiError(payload, 500, "Fallback")).toMatchObject({
            code: "INTERNAL_SERVER_ERROR",
            message: FORM_SUBMIT_ERROR_MESSAGES.technical,
            status: 500,
        });
    });

    it("preserves precise API validation issues before generic messages", () => {
        expect(
            getFormSubmitApiErrorMessage(
                {
                    code: "VALIDATION_ERROR",
                    error: "Données invalides.",
                    issues: [{ message: "Le titre de chaque étape est requis." }],
                },
                400,
                "Fallback",
            ),
        ).toBe("Le titre de chaque étape est requis.");
    });

    it("uses a simple connection message for browser network failures", () => {
        expect(getFormSubmitErrorMessage(new TypeError("Failed to fetch"), "Fallback"))
            .toBe(FORM_SUBMIT_ERROR_MESSAGES.network);
    });

    it.each([401, 403])("uses the warning toast for authorization status %s", (status) => {
        notifyFormSubmitError(createFormSubmitError("Accès refusé.", status), "Fallback");

        expect(notify.warning).toHaveBeenCalledWith(
            "Action non autorisée",
            { description: "Accès refusé." },
        );
        expect(notify.error).not.toHaveBeenCalled();
    });

    it("uses the error toast for a business error", () => {
        notifyFormSubmitError(createFormSubmitError("Valeur invalide.", 422), "Fallback");

        expect(notify.error).toHaveBeenCalledWith(
            "Enregistrement impossible",
            { description: "Valeur invalide." },
        );
    });

    it("uses the success toast after a valid submission", () => {
        notifyFormSubmitSuccess();

        expect(notify.success).toHaveBeenCalledWith("Enregistrement effectué avec succès");
    });
});
