"use client";

import { useId, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

export type RoleplayGuidanceTabTone = keyof typeof uiTokens.stepBlock.tone;

export interface RoleplayGuidanceTab {
    icon: LucideIcon;
    italic?: boolean;
    items: string[];
    key: string;
    label: string;
    tone: RoleplayGuidanceTabTone;
}

interface RoleplayGuidanceTabsPanelProps {
    ariaLabel: string;
    initialTab: string;
    tabs: RoleplayGuidanceTab[];
}

function GuidanceBulletList({ tab }: { tab: RoleplayGuidanceTab }) {
    if (tab.items.length === 0) {
        return <Text className={uiTokens.stepTabs.empty}>Aucune information renseignée pour cette section.</Text>;
    }

    const palette = uiTokens.stepBlock.tone[tab.tone];

    return (
        <Box className={uiTokens.stepTabs.list}>
            {tab.items.map((item, index) => (
                <Box key={`${tab.key}-${index}`} className={uiTokens.stepTabs.item}>
                    <Box className={cn(uiTokens.stepTabs.listDot, palette.dot)} />
                    <Text className={cn(uiTokens.stepTabs.itemText, tab.italic && "italic")}>{item}</Text>
                </Box>
            ))}
        </Box>
    );
}

export function RoleplayGuidanceTabsPanel({
    ariaLabel,
    initialTab,
    tabs,
}: RoleplayGuidanceTabsPanelProps) {
    const panelId = useId();
    const [activeTabKey, setActiveTabKey] = useState(initialTab);
    const activeTab = tabs.find((tab) => tab.key === activeTabKey) ?? tabs[0];

    if (!activeTab) return null;

    const tabPanelId = `${panelId}-panel`;

    return (
        <CardSurface className={uiTokens.stepTabs.panel}>
            <Box role="tablist" aria-label={ariaLabel} className={uiTokens.stepTabs.tabList}>
                {tabs.map((tab) => {
                    const isActive = tab.key === activeTab.key;
                    const palette = uiTokens.stepBlock.tone[tab.tone];
                    const tabId = `${panelId}-${tab.key}-tab`;

                    return (
                        <button
                            key={tab.key}
                            id={tabId}
                            type="button"
                            role="tab"
                            aria-controls={tabPanelId}
                            aria-selected={isActive}
                            onClick={() => setActiveTabKey(tab.key)}
                            className={cn(
                                uiTokens.stepTabs.button,
                                isActive ? palette.solid : uiTokens.stepTabs.buttonIdle,
                            )}
                        >
                            <InlineIcon icon={tab.icon} className="h-4 w-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </Box>
            <Box
                id={tabPanelId}
                role="tabpanel"
                aria-labelledby={`${panelId}-${activeTab.key}-tab`}
                className="mt-4"
            >
                <GuidanceBulletList tab={activeTab} />
            </Box>
        </CardSurface>
    );
}
