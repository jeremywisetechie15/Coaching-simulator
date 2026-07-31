import { Box, Button, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

export type OrganizationDetailTab = "overview" | "groups" | "users" | "roleplays" | "evaluations";

interface OrganizationDetailTabsProps {
    activeTab: OrganizationDetailTab;
    onTabChange: (tab: OrganizationDetailTab) => void;
}

export const ORGANIZATION_DETAIL_TABS: Array<{ label: string; value: OrganizationDetailTab }> = [
    { label: "Informations de base", value: "overview" },
    { label: "Groupes", value: "groups" },
    { label: "Utilisateurs", value: "users" },
    { label: "Roleplays", value: "roleplays" },
    { label: "Évaluations", value: "evaluations" },
];

export function OrganizationDetailTabs({ activeTab, onTabChange }: OrganizationDetailTabsProps) {
    return (
        <Box className={uiTokens.organizationDetail.tabs.scroll}>
            <Box className={uiTokens.organizationDetail.tabs.list}>
                {ORGANIZATION_DETAIL_TABS.map((tab) => {
                    const isActive = activeTab === tab.value;

                    return (
                        <Button
                            key={tab.value}
                            aria-pressed={isActive}
                            onClick={() => onTabChange(tab.value)}
                            className={cn(
                                uiTokens.organizationDetail.tabs.item,
                                isActive
                                    ? uiTokens.organizationDetail.tabs.active
                                    : uiTokens.organizationDetail.tabs.idle,
                            )}
                        >
                            <Text as="span">{tab.label}</Text>
                        </Button>
                    );
                })}
            </Box>
        </Box>
    );
}
