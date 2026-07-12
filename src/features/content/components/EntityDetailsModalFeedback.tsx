import { AlertMessage, FormSkeleton } from "@/lib/ui/molecules";
import { Modal } from "@/lib/ui/organisms";

interface EntityDetailsModalFeedbackProps {
    error?: string | null;
    onClose: () => void;
    title: string;
}

export function EntityDetailsModalFeedback({ error, onClose, title }: EntityDetailsModalFeedbackProps) {
    return (
        <Modal title={title} description="Chargement des informations" onClose={onClose}>
            {error ? <AlertMessage message={error} /> : <FormSkeleton />}
        </Modal>
    );
}
