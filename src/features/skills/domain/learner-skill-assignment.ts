interface LearnerAssignedSkillSources {
    directSkillIds: readonly string[];
    quizSkillIds: readonly string[];
    roleplaySkillIds: readonly string[];
}

export function resolveLearnerAssignedSkillIds({
    directSkillIds,
    quizSkillIds,
    roleplaySkillIds,
}: LearnerAssignedSkillSources) {
    return Array.from(
        new Set(
            [...directSkillIds, ...roleplaySkillIds, ...quizSkillIds]
                .map((skillId) => skillId.trim())
                .filter(Boolean),
        ),
    );
}
