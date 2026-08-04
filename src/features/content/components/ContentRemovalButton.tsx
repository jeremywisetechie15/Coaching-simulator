import { Archive, Trash2 } from "lucide-react";
import {
    CONTENT_REMOVAL_ACTION,
    getContentRemovalAction,
    type ContentStatus,
} from "@/features/content/domain";
import { Button, InlineIcon } from "@/lib/ui/atoms";
import { ENTITY_ACTION_LABELS } from "@/lib/ui/domain/entity-action";
import { uiTokens } from "@/lib/ui/tokens";

interface ContentRemovalButtonProps {
    busy?: boolean;
    onClick: () => void;
    status: ContentStatus;
}

export function ContentRemovalButton({
    busy = false,
    onClick,
    status,
}: ContentRemovalButtonProps) {
    const action = getContentRemovalAction(status);
    if (!action) return null;

    const isDelete = action === CONTENT_REMOVAL_ACTION.delete;

    return (
        <Button
            disabled={busy}
            onClick={onClick}
            className={uiTokens.resourceDetailHeader.archiveButton}
        >
            <InlineIcon
                icon={isDelete ? Trash2 : Archive}
                className={uiTokens.resourceDetailHeader.icon}
            />
            {isDelete ? ENTITY_ACTION_LABELS.delete : ENTITY_ACTION_LABELS.archive}
        </Button>
    );
}
