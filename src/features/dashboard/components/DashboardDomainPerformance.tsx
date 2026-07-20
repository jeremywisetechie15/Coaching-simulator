"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
    roundDashboardScore,
    type DashboardDomainGroup,
} from "@/features/dashboard/domain";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";

interface DashboardDomainPerformanceProps {
    groups: DashboardDomainGroup[];
    scoreLabel: string;
}

export function DashboardDomainPerformance({ groups, scoreLabel }: DashboardDomainPerformanceProps) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
        const firstExpandableGroup = groups.find((group) => group.items?.length);
        return new Set(firstExpandableGroup ? [firstExpandableGroup.id] : []);
    });

    function toggleGroup(groupId: string) {
        setExpandedIds((current) => {
            const next = new Set(current);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    }

    return (
        <Box className={uiTokens.dashboard.domain.table}>
            <Box className={uiTokens.dashboard.domain.header}>
                <span>Domaine</span>
                <span className="text-center">{scoreLabel}</span>
            </Box>

            {groups.length === 0 ? (
                <Text className={uiTokens.dashboard.domain.empty}>
                    Pas encore de donnée pour cette période.
                </Text>
            ) : groups.map((group) => {
                const canExpand = Boolean(group.items?.length);
                const isExpanded = canExpand && expandedIds.has(group.id);

                return (
                    <Box key={group.id}>
                        <Button
                            aria-expanded={canExpand ? isExpanded : undefined}
                            className={cn(uiTokens.dashboard.domain.row, !canExpand && "cursor-default")}
                            disabled={!canExpand}
                            onClick={() => toggleGroup(group.id)}
                        >
                            <Text className={uiTokens.dashboard.domain.label}>{group.label}</Text>
                            <Box className="flex items-center justify-end gap-3">
                                <Text
                                    aria-label={`${scoreLabel}, ${group.score === null ? "pas encore de donnée" : `${roundDashboardScore(group.score)} pour cent`}`}
                                    className={uiTokens.dashboard.domain.score}
                                >
                                    {group.score === null ? "-" : `${roundDashboardScore(group.score)}%`}
                                </Text>
                                {canExpand && (
                                    <InlineIcon
                                        icon={ChevronDown}
                                        className={cn(uiTokens.dashboard.domain.chevron, isExpanded && "rotate-180")}
                                    />
                                )}
                            </Box>
                        </Button>
                        {isExpanded && group.items?.map((item) => (
                            <Box className={uiTokens.dashboard.domain.childRow} key={item.label}>
                                <Text className={uiTokens.dashboard.domain.childLabel}>{item.label}</Text>
                                <Box className="flex justify-end pr-7">
                                    <Text className={uiTokens.dashboard.domain.score}>
                                        {roundDashboardScore(item.score)}%
                                    </Text>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                );
            })}
        </Box>
    );
}
