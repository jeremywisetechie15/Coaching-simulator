import { Fragment } from "react";
import { UsersRound } from "lucide-react";
import { Box, InlineIcon, Text } from "@/lib/ui/atoms";
import {
    DataTable,
    DataTableCell,
    DataTableFrame,
    DataTableHead,
    DataTableHeaderCell,
    DataTableRow,
    GroupedTableSectionHeader,
    PeopleCountTooltip,
} from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import type { OrganizationRoleplayRow } from "@/features/organizations/domain/organization-detail";

const columns = ["Titre", "Persona", "Groupe", "Apprenants", "Date d'assignation"];

const sectionLabels = {
    completed: "Roleplays terminés",
    in_progress: "Roleplays en cours",
    not_started: "Roleplays non commencés",
};

function groupRoleplays(roleplays: OrganizationRoleplayRow[]): Array<{
    roleplays: OrganizationRoleplayRow[];
    status: OrganizationRoleplayRow["status"];
}> {
    return [
        {
            roleplays: roleplays.filter((roleplay) => roleplay.status === "not_started"),
            status: "not_started",
        },
        {
            roleplays: roleplays.filter((roleplay) => roleplay.status === "in_progress"),
            status: "in_progress",
        },
        {
            roleplays: roleplays.filter((roleplay) => roleplay.status === "completed"),
            status: "completed",
        },
    ];
}

interface OrganizationDetailRoleplaysProps {
    roleplays?: OrganizationRoleplayRow[];
    title?: string;
}

export function OrganizationDetailRoleplays({
    roleplays = [],
    title = "Roleplays assignés (vue consolidée)",
}: OrganizationDetailRoleplaysProps) {
    const groupedRoleplays = groupRoleplays(roleplays);

    return (
        <Box className={uiTokens.organizationDetail.content.root}>
            <Text
                as="h2"
                className={uiTokens.organizationDetail.content.standaloneTitle}
            >
                {title}
            </Text>

            <DataTableFrame>
                <DataTable width="wide">
                    <DataTableHead>
                        <DataTableRow>
                            {columns.map((column) => (
                                <DataTableHeaderCell key={column}>
                                    {column}
                                </DataTableHeaderCell>
                            ))}
                        </DataTableRow>
                    </DataTableHead>
                    <Box as="tbody">
                        {groupedRoleplays.map((group) => (
                            <Fragment key={group.status}>
                                <GroupedTableSectionHeader
                                    colSpan={columns.length}
                                    count={group.roleplays.length}
                                    label={sectionLabels[group.status]}
                                />
                                {group.roleplays.map((roleplay) => (
                                    <DataTableRow
                                        key={roleplay.id}
                                        className={uiTokens.organizationDetail.table.row}
                                    >
                                        <DataTableCell nowrap>
                                            <Text className={uiTokens.dataTable.text.primary}>
                                                {roleplay.title}
                                            </Text>
                                        </DataTableCell>
                                        <DataTableCell nowrap>
                                            <Box className={uiTokens.organizationDetail.table.personaBadge}>
                                                {roleplay.persona}
                                            </Box>
                                        </DataTableCell>
                                        <DataTableCell nowrap>
                                            <Box className={uiTokens.organizationDetail.table.activityGroup}>
                                                <InlineIcon
                                                    icon={UsersRound}
                                                    className={uiTokens.organizationDetail.table.activityGroupIcon}
                                                />
                                                <Text className={uiTokens.dataTable.text.body}>
                                                    {roleplay.groupName}
                                                </Text>
                                            </Box>
                                        </DataTableCell>
                                        <DataTableCell nowrap>
                                            <PeopleCountTooltip
                                                count={roleplay.learnerCount}
                                                names={roleplay.learnerNames}
                                                pluralLabel="apprenants"
                                                singularLabel="apprenant"
                                            />
                                        </DataTableCell>
                                        <DataTableCell nowrap>
                                            <Text className={uiTokens.dataTable.text.secondary}>
                                                {roleplay.assignedAt}
                                            </Text>
                                        </DataTableCell>
                                    </DataTableRow>
                                ))}
                            </Fragment>
                        ))}
                        {roleplays.length === 0 && (
                            <DataTableRow>
                                <DataTableCell
                                    colSpan={columns.length}
                                    className={uiTokens.dataTable.emptyCell}
                                >
                                    <Text className={uiTokens.organizationDetail.content.emptyTitle}>
                                        Aucun roleplay assigné
                                    </Text>
                                    <Text className={uiTokens.organizationDetail.content.emptyDescription}>
                                        Aucun roleplay n&apos;est ciblé sur ce groupe.
                                    </Text>
                                </DataTableCell>
                            </DataTableRow>
                        )}
                    </Box>
                </DataTable>
            </DataTableFrame>
        </Box>
    );
}
