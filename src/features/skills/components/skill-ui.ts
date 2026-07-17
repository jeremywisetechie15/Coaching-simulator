import type { SkillType } from "@/features/skills/domain/skills";
import { uiTokens } from "@/lib/ui/tokens";

type SemanticTone = (typeof uiTokens.tone)[keyof typeof uiTokens.tone];

/** Présentation SSOT des types de compétence, isolée de la couche domaine. */
export const SKILL_TYPE_TONES: Record<SkillType, SemanticTone> = {
    Métier: uiTokens.tone.info,
    Comportementale: uiTokens.tone.primary,
    Transversale: uiTokens.tone.success,
};
