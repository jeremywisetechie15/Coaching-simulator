import { Box, Button, Text } from "@/lib/ui/atoms";

export type OrganizationDetailTab = "overview" | "groups" | "users" | "trainings";

interface OrganizationDetailTabsProps {
    activeTab: OrganizationDetailTab;
    onTabChange: (tab: OrganizationDetailTab) => void;
}

const tabs: Array<{ label: string; value: OrganizationDetailTab }> = [
    { label: "Informations de base", value: "overview" },
    { label: "Groupes", value: "groups" },
    { label: "Utilisateurs", value: "users" },
    { label: "Formations", value: "trainings" },
];

export function OrganizationDetailTabs({ activeTab, onTabChange }: OrganizationDetailTabsProps) {
    return (
        <Box className="flex overflow-x-auto border-b border-[#E4E7EE] px-6">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.value;

                return (
                    <Button
                        key={tab.value}
                        onClick={() => onTabChange(tab.value)}
                        className={`relative flex h-[58px] shrink-0 items-center px-5 text-[15px] font-bold transition ${
                            isActive ? "text-[#5140F0]" : "text-[#6F7787] hover:text-[#171B2A]"
                        }`}
                    >
                        <Text as="span">{tab.label}</Text>
                        {isActive && (
                            <Box className="absolute bottom-0 left-5 right-5 h-[3px] rounded-full bg-[#5140F0]" />
                        )}
                    </Button>
                );
            })}
        </Box>
    );
}
