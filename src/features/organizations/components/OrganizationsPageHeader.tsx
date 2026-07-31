import { ArrowLeft, Plus } from "lucide-react";
import { ContextualBackLink } from "@/features/app-shell/components";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";

interface OrganizationsPageHeaderProps {
    onCreateClick: () => void;
    showCreateButton?: boolean;
}

export function OrganizationsPageHeader({
    onCreateClick,
    showCreateButton = true,
}: OrganizationsPageHeaderProps) {
    return (
        <Box className={uiTokens.organizations.header.root}>
            <Box className={uiTokens.organizations.header.titleGroup}>
                <ContextualBackLink
                    fallbackHref="/"
                    aria-label="Retour"
                    className={uiTokens.organizations.header.back}
                >
                    <InlineIcon
                        icon={ArrowLeft}
                        className={uiTokens.organizations.header.backIcon}
                    />
                </ContextualBackLink>
                <Text as="h1" className={uiTokens.organizations.header.title}>
                    Organisations
                </Text>
            </Box>

            {showCreateButton && (
                <Button
                    onClick={onCreateClick}
                    className={uiTokens.organizations.header.create}
                >
                    <InlineIcon
                        icon={Plus}
                        className={uiTokens.organizations.header.createIcon}
                    />
                    Créer une organisation
                </Button>
            )}
        </Box>
    );
}
