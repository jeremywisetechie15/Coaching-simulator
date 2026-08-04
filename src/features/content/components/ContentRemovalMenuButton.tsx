import { Archive, Trash2 } from "lucide-react";
import {
    CONTENT_REMOVAL_ACTION,
    getContentRemovalAction,
    type ContentStatus,
} from "@/features/content/domain";
import { CardActionMenuButton } from "@/lib/ui/molecules";
import { ENTITY_ACTION_LABELS } from "@/lib/ui/domain/entity-action";

interface ContentRemovalMenuButtonProps {
    busy?: boolean;
    onClick: () => void;
    status: ContentStatus;
}

export function ContentRemovalMenuButton({
    busy = false,
    onClick,
    status,
}: ContentRemovalMenuButtonProps) {
    const action = getContentRemovalAction(status);
    if (!action) return null;

    const isDelete = action === CONTENT_REMOVAL_ACTION.delete;

    return (
        <CardActionMenuButton
            danger
            disabled={busy}
            icon={isDelete ? Trash2 : Archive}
            label={isDelete ? ENTITY_ACTION_LABELS.delete : ENTITY_ACTION_LABELS.archive}
            onClick={onClick}
        />
    );
}
