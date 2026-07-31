import {
    SKILL_LEVEL,
    type SkillLevel,
    type SkillType,
} from "@/features/skills/domain/skills";
import { uiTokens } from "@/lib/ui/tokens";

type SemanticTone = (typeof uiTokens.tone)[keyof typeof uiTokens.tone];

/** Présentation SSOT des niveaux de maîtrise. */
export const SKILL_LEVEL_STYLES: Record<
    SkillLevel,
    { badge: string; bar: string }
> = {
    [SKILL_LEVEL.weak]: {
        badge: "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]",
        bar: "#EF4444",
    },
    [SKILL_LEVEL.needsStrengthening]: {
        badge: "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]",
        bar: "#F59E0B",
    },
    [SKILL_LEVEL.progressing]: {
        badge: "border-[#BFDBFE] bg-[#EFF6FF] text-[#2563EB]",
        bar: "#3B82F6",
    },
    [SKILL_LEVEL.mastered]: {
        badge: "border-[#BBF7D0] bg-[#F0FDF4] text-[#16A34A]",
        bar: "#22C55E",
    },
};

/** Présentation SSOT des types de compétence, isolée de la couche domaine. */
export const SKILL_TYPE_TONES: Record<SkillType, SemanticTone> = {
    Métier: uiTokens.tone.info,
    Comportementale: uiTokens.tone.primary,
    Transversale: uiTokens.tone.success,
};
