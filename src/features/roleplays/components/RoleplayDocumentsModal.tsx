import type { PrepDocument } from "@/features/roleplays/data/preparation";
import { ContentResourcesModal } from "@/features/content/components";

interface RoleplayDocumentsModalProps {
    documents: PrepDocument[];
    onClose: () => void;
}

export function RoleplayDocumentsModal({ documents, onClose }: RoleplayDocumentsModalProps) {
    return (
        <ContentResourcesModal
            title="Documents de préparation"
            description="Consultez les documents, vidéos et articles pour vous préparer au scénario."
            onClose={onClose}
            emptyMessage="Aucun document de préparation n'est associé à ce scénario."
            documents={documents}
        />
    );
}
