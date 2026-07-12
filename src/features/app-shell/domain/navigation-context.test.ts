import { describe, expect, it } from "vitest";
import {
    buildAuthRedirectHref,
    buildCurrentAppHref,
    buildPostSaveHref,
    getContextualBackLabel,
    isSafeInternalHref,
    resolveInternalHref,
    withReturnTo,
    withSearchParam,
    withSearchParams,
    withoutSearchParam,
} from "./navigation-context";

function readReturnTo(href: string) {
    return new URL(href, "https://maiacoach.local").searchParams.get("returnTo");
}

describe("navigation context", () => {
    it("accepts internal paths and rejects external redirects", () => {
        expect(isSafeInternalHref("/roleplays/session?tab=summary")).toBe(true);
        expect(isSafeInternalHref("https://example.com")).toBe(false);
        expect(isSafeInternalHref("//example.com/path")).toBe(false);
        expect(isSafeInternalHref("/\\example.com/path")).toBe(false);
        expect(isSafeInternalHref(" /roleplays")).toBe(false);
    });

    it("uses the canonical fallback for an invalid return path", () => {
        expect(resolveInternalHref("https://example.com", "/roleplays")).toBe("/roleplays");
        expect(resolveInternalHref(null, "https://example.com")).toBe("/");
    });

    it("builds a safe authentication redirect", () => {
        expect(buildAuthRedirectHref("/methods/method-1?returnTo=%2Froleplays%2Fr-1")).toBe(
            "/auth?redirect=%2Fmethods%2Fmethod-1%3FreturnTo%3D%252Froleplays%252Fr-1",
        );
        expect(buildAuthRedirectHref("https://example.com")).toBe("/auth?redirect=%2F");
    });

    it("adds an encoded return path without losing destination parameters", () => {
        expect(
            withReturnTo(
                "/evaluations/quiz-1/quiz?result=1",
                "/roleplays/roleplay-1?panel=quizzes",
            ),
        ).toBe(
            "/evaluations/quiz-1/quiz?result=1&returnTo=%2Froleplays%2Froleplay-1%3Fpanel%3Dquizzes",
        );
    });

    it("keeps nested navigation contexts", () => {
        const sessionHref = withReturnTo(
            "/roleplays/history/session-1",
            "/roleplays/history?scenario_id=roleplay-1",
        );

        expect(withReturnTo("/roleplays/roleplay-1/steps?coach=after", sessionHref)).toContain(
            "returnTo=%2Froleplays%2Fhistory%2Fsession-1%3FreturnTo%3D",
        );
    });

    it("returns from after-training coaching to the exact session through the steps list", () => {
        const historyHref = "/roleplays/history?scenario_id=roleplay-1";
        const sessionHref = withReturnTo("/roleplays/history/session-1", historyHref);
        const stepsHref = withReturnTo("/roleplays/roleplay-1/steps?coach=after", sessionHref);
        const coachHref = withReturnTo("/roleplays/roleplay-1/steps/2?coach=after", stepsHref);

        expect(readReturnTo(coachHref)).toBe(stepsHref);
        expect(readReturnTo(stepsHref)).toBe(sessionHref);
        expect(readReturnTo(sessionHref)).toBe(historyHref);
    });

    it("restores roleplay panels and organization tabs", () => {
        const roleplayHref = "/roleplays/roleplay-1?panel=quizzes";
        const quizHref = withReturnTo("/evaluations/quiz-1/quiz", roleplayHref);
        const groupHref = withReturnTo(
            "/organizations/org-1/groups/group-1?tab=members",
            "/organizations/org-1?tab=groups",
        );
        const userHref = withReturnTo("/users/user-1", groupHref);

        expect(readReturnTo(quizHref)).toBe(roleplayHref);
        expect(readReturnTo(userHref)).toBe(groupHref);
    });

    it("describes the actual contextual return destination", () => {
        expect(getContextualBackLabel("/methods/method-1")).toBe("Retour à la méthode");
        expect(getContextualBackLabel("/roleplays/roleplay-1")).toBe("Retour au scénario");
        expect(getContextualBackLabel("/roleplays/roleplay-1?panel=quizzes")).toBe(
            "Retour aux évaluations du scénario",
        );
        expect(getContextualBackLabel("/roleplays/history/session-1?returnTo=%2Froleplays")).toBe(
            "Retour à la session",
        );
        expect(getContextualBackLabel("/roleplays/roleplay-1/steps?coach=after")).toBe(
            "Retour au plan de progrès",
        );
        expect(getContextualBackLabel("/roles-permissions")).toBe("Retour aux rôles et permissions");
        expect(getContextualBackLabel("https://example.com")).toBe("Retour à la page précédente");
    });

    it("keeps the return chain after creating or editing content", () => {
        const scenarioHref = "/roleplays/roleplay-1?panel=quizzes";
        const methodDetailHref = withReturnTo("/methods/method-1", scenarioHref);

        expect(buildPostSaveHref("/methods/method-1", methodDetailHref, true)).toBe(methodDetailHref);
        expect(buildPostSaveHref("/methods/method-2", scenarioHref, false)).toBe(
            "/methods/method-2?returnTo=%2Froleplays%2Froleplay-1%3Fpanel%3Dquizzes",
        );
    });

    it("builds and cleans current application URLs", () => {
        expect(buildCurrentAppHref("/roleplays/roleplay-1", "panel=quizzes")).toBe(
            "/roleplays/roleplay-1?panel=quizzes",
        );
        expect(
            withoutSearchParam(
                "/roleplays/roleplay-1?panel=quizzes&returnTo=%2F",
                "panel",
            ),
        ).toBe("/roleplays/roleplay-1?returnTo=%2F");
        expect(withSearchParam("/roleplays/roleplay-1?returnTo=%2F", "panel", "quizzes")).toBe(
            "/roleplays/roleplay-1?returnTo=%2F&panel=quizzes",
        );
        expect(
            withSearchParams("/roleplays?domain=Commercial&category=Vente", {
                category: null,
                domain: "Management",
            }),
        ).toBe("/roleplays?domain=Management");
    });
});
