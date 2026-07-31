import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
    USER_CONTENT_ASSIGNMENT_SOURCE,
    type UserAssignedQuiz,
} from "@/features/users/domain";
import { uiTokens } from "@/lib/ui/tokens";
import { EvaluationsTab } from "./UserDetailPage";

const quizzes: UserAssignedQuiz[] = [
    {
        assignmentSource: USER_CONTENT_ASSIGNMENT_SOURCE.visibility,
        assignedAt: "31 juillet 2026",
        attempts: 2,
        id: "quiz-validated",
        score: 75,
        status: "completed",
        title: "Quiz validé",
        type: "Quiz de Connaissance",
        validationThreshold: 70,
    },
    {
        assignmentSource: USER_CONTENT_ASSIGNMENT_SOURCE.visibility,
        assignedAt: "31 juillet 2026",
        attempts: 1,
        id: "quiz-to-improve",
        score: 75,
        status: "completed",
        title: "Quiz à renforcer",
        type: "Quiz de Connaissance",
        validationThreshold: 80,
    },
];

describe("UserDetailPage evaluations table", () => {
    it("explains the score and applies each quiz validation threshold", () => {
        const html = renderToStaticMarkup(
            <EvaluationsTab onAssign={() => undefined} quizzes={quizzes} />,
        );

        expect(html).toContain(
            'title="Meilleur score obtenu sur les tentatives terminées."',
        );
        expect(html).toContain(
            'title="Seuil recommandé pour être validé : 70%"',
        );
        expect(html).toContain(
            'title="Seuil recommandé pour être validé : 80%"',
        );
        expect(html).toContain(uiTokens.userDetail.pill.scoreSuccess);
        expect(html).toContain(uiTokens.userDetail.pill.scoreWarning);
        expect(html).toContain("2 tentatives");
        expect(html).toContain("1 tentative");
    });
});
