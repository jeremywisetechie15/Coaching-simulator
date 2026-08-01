import {
    CONTENT_REMOVAL_ACTION,
    getContentRemovalAction,
    type ContentStatus,
} from "@/features/content/domain";
import { ArchiveContentConfirmationModal } from "./ArchiveContentConfirmationModal";
import { DeleteContentConfirmationModal } from "./DeleteContentConfirmationModal";

interface ContentRemovalConfirmationModalProps {
    busy: boolean;
    entityLabel: string;
    error?: string | null;
    name: string;
    onCancel: () => void;
    onConfirm: () => void;
    status: ContentStatus;
}

export function ContentRemovalConfirmationModal({
    busy,
    entityLabel,
    error,
    name,
    onCancel,
    onConfirm,
    status,
}: ContentRemovalConfirmationModalProps) {
    const action = getContentRemovalAction(status);
    if (!action) return null;

    if (action === CONTENT_REMOVAL_ACTION.delete) {
        return (
            <DeleteContentConfirmationModal
                busy={busy}
                description={`Confirmez la suppression définitive de ${name}.`}
                entityLabel={entityLabel}
                error={error}
                name={name}
                onCancel={onCancel}
                onConfirm={onConfirm}
                warning="Ce brouillon n’a jamais été utilisé. Sa suppression est définitive."
            />
        );
    }

    return (
        <ArchiveContentConfirmationModal
            busy={busy}
            entityLabel={entityLabel}
            error={error}
            name={name}
            onCancel={onCancel}
            onConfirm={onConfirm}
        />
    );
}
