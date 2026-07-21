import { Archive, Copy, Edit3, MoreHorizontal } from "lucide-react";
import { withReturnTo } from "@/features/app-shell/domain";
import { SKILL_ROUTES, type SkillListItem } from "@/features/skills/domain/skills";
import { Box, Button, InlineIcon } from "@/lib/ui/atoms";
import { CardActionMenu, CardActionMenuButton, CardActionMenuLink } from "@/lib/ui/molecules";
import { ENTITY_ACTION_LABELS } from "@/lib/ui/domain/entity-action";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface SkillCardActionsProps {
    busy: boolean;
    currentHref: string;
    isMenuOpen: boolean;
    onArchive: () => void;
    onDuplicate: () => void;
    onToggleMenu: () => void;
    skill: SkillListItem;
}

export function SkillCardActions({
    busy,
    currentHref,
    isMenuOpen,
    onArchive,
    onDuplicate,
    onToggleMenu,
    skill,
}: SkillCardActionsProps) {
    return (
        <Box className="absolute right-4 top-4 z-10">
            <Button
                aria-label={`Actions pour ${skill.name}`}
                disabled={busy}
                onClick={onToggleMenu}
                className={cn(uiTokens.action.iconButtonGhost, "opacity-100")}
            >
                <InlineIcon icon={MoreHorizontal} className="h-4 w-4" />
            </Button>
            {isMenuOpen && (
                <CardActionMenu>
                    <CardActionMenuLink
                        href={withReturnTo(SKILL_ROUTES.app.edit(skill.id), currentHref)}
                        icon={Edit3}
                        label={ENTITY_ACTION_LABELS.modify}
                    />
                    <CardActionMenuButton
                        disabled={busy}
                        icon={Copy}
                        label={ENTITY_ACTION_LABELS.duplicate}
                        onClick={onDuplicate}
                    />
                    <CardActionMenuButton
                        danger
                        disabled={busy}
                        icon={Archive}
                        label={ENTITY_ACTION_LABELS.archive}
                        onClick={onArchive}
                    />
                </CardActionMenu>
            )}
        </Box>
    );
}
