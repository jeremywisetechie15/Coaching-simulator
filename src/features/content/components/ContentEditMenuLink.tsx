import { Edit3 } from "lucide-react";
import { canEditContent, type ContentStatus } from "@/features/content/domain";
import { ENTITY_ACTION_LABELS } from "@/lib/ui/domain/entity-action";
import { CardActionMenuLink } from "@/lib/ui/molecules";

interface ContentEditMenuLinkProps {
    href: string;
    status: ContentStatus;
}

export function ContentEditMenuLink({ href, status }: ContentEditMenuLinkProps) {
    if (!canEditContent(status)) return null;

    return (
        <CardActionMenuLink
            href={href}
            icon={Edit3}
            label={ENTITY_ACTION_LABELS.modify}
        />
    );
}
