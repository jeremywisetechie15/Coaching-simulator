import { removeContent } from "@/features/content/server";

export async function removeSkill(skillId: string) {
    return removeContent({
        archiveChanges: { is_active: false },
        dependencyChecks: [
            { column: "skill_id", table: "scorecard_criteria" },
            { column: "competence_id", table: "quiz_step_competencies" },
            { column: "competence_id", table: "quiz_questions" },
            { column: "skill_id", table: "roleplay_session_criterion_results" },
        ],
        entityId: skillId,
        entityLabel: "Compétence",
        table: "skills",
    });
}
