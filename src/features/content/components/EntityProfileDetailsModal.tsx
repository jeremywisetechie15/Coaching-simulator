import type { ReactNode } from "react";
import { CalendarPlus2, RefreshCw } from "lucide-react";
import { Box, InlineIcon, Text } from "@/lib/ui/atoms";
import { IconDetailField, type IconDetailFieldProps } from "@/lib/ui/molecules";
import { Modal } from "@/lib/ui/organisms";
import { uiTokens } from "@/lib/ui/tokens";
import { formatShortDateTime } from "@/lib/date/format-date-time";

export interface EntityProfileDetailSection {
    fields: IconDetailFieldProps[];
    title: string;
}

interface EntityProfileDetailsModalProps {
    avatarUrl?: string | null;
    createdAt?: string | null;
    description?: string;
    initials: string;
    name: string;
    onClose: () => void;
    sections: EntityProfileDetailSection[];
    status?: ReactNode;
    updatedAt?: string | null;
}

export function EntityProfileDetailsModal({
    avatarUrl,
    createdAt,
    description,
    initials,
    name,
    onClose,
    sections,
    status,
    updatedAt,
}: EntityProfileDetailsModalProps) {
    return (
        <Modal
            className="max-w-[900px]"
            title={name}
            description={description}
            onClose={onClose}
            headerAside={(
                <Box className={uiTokens.entityDetails.dates}>
                    <Text className={uiTokens.entityDetails.dateRow}>
                        <InlineIcon icon={CalendarPlus2} className="h-3.5 w-3.5" />
                        Créé le {formatShortDateTime(createdAt)}
                    </Text>
                    <Text className={uiTokens.entityDetails.dateRow}>
                        <InlineIcon icon={RefreshCw} className="h-3.5 w-3.5" />
                        Mis à jour le {formatShortDateTime(updatedAt)}
                    </Text>
                </Box>
            )}
        >
            <Box className={uiTokens.entityDetails.layout}>
                <Box className={uiTokens.entityDetails.sidebar}>
                    <Box className={uiTokens.entityDetails.avatar}>
                        {avatarUrl ? (
                            <Box
                                aria-label={name}
                                role="img"
                                className={uiTokens.entityDetails.avatarImage}
                                style={{ backgroundImage: `url(${avatarUrl})` }}
                            />
                        ) : (
                            <Text className={uiTokens.entityDetails.avatarInitials}>{initials}</Text>
                        )}
                    </Box>
                    {status}
                </Box>

                <Box className="min-w-0 space-y-5">
                    {sections.map((section) => (
                        <Box key={section.title} className={uiTokens.entityDetails.section}>
                            <Text as="h3" className={uiTokens.entityDetails.sectionTitle}>
                                {section.title}
                            </Text>
                            <Box className={uiTokens.entityDetails.grid}>
                                {section.fields.map((field) => (
                                    <IconDetailField key={`${section.title}-${field.label}`} {...field} />
                                ))}
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Modal>
    );
}
