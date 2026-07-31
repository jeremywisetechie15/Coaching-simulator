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
import type { OrganizationEvaluationRow } from "@/features/organizations/domain/organization-detail";

const columns = ["Titre", "Type", "Groupe", "Apprenants", "Date d'assignation"];

const sectionLabels = {
    completed: "Évaluations terminées",
    in_progress: "Évaluations en cours",
    not_started: "Évaluations non commencées",
};

function groupEvaluations(evaluations: OrganizationEvaluationRow[]): Array<{
    evaluations: OrganizationEvaluationRow[];
    status: OrganizationEvaluationRow["status"];
}> {
    return [
        {
            evaluations: evaluations.filter((evaluation) => evaluation.status === "not_started"),
            status: "not_started",
        },
        {
            evaluations: evaluations.filter((evaluation) => evaluation.status === "in_progress"),
            status: "in_progress",
        },
        {
            evaluations: evaluations.filter((evaluation) => evaluation.status === "completed"),
            status: "completed",
        },
    ];
}

interface OrganizationDetailEvaluationsProps {
    evaluations?: OrganizationEvaluationRow[];
    title?: string;
}

export function OrganizationDetailEvaluations({
    evaluations = [],
    title = "Évaluations assignées (vue consolidée)",
}: OrganizationDetailEvaluationsProps) {
    const groupedEvaluations = groupEvaluations(evaluations);

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
                        {groupedEvaluations.map((group) => (
                            <Fragment key={group.status}>
                                <GroupedTableSectionHeader
                                    colSpan={columns.length}
                                    count={group.evaluations.length}
                                    label={sectionLabels[group.status]}
                                />
                                {group.evaluations.map((evaluation) => (
                                    <DataTableRow
                                        key={evaluation.id}
                                        className={uiTokens.organizationDetail.table.row}
                                    >
                                        <DataTableCell nowrap>
                                            <Text className={uiTokens.dataTable.text.primary}>
                                                {evaluation.title}
                                            </Text>
                                        </DataTableCell>
                                        <DataTableCell nowrap>
                                            <Box className={uiTokens.organizationDetail.table.evaluationBadge}>
                                                {evaluation.type}
                                            </Box>
                                        </DataTableCell>
                                        <DataTableCell nowrap>
                                            <Box className={uiTokens.organizationDetail.table.activityGroup}>
                                                <InlineIcon
                                                    icon={UsersRound}
                                                    className={uiTokens.organizationDetail.table.activityGroupIcon}
                                                />
                                                <Text className={uiTokens.dataTable.text.body}>
                                                    {evaluation.groupName}
                                                </Text>
                                            </Box>
                                        </DataTableCell>
                                        <DataTableCell nowrap>
                                            <PeopleCountTooltip
                                                count={evaluation.learnerCount}
                                                names={evaluation.learnerNames}
                                                pluralLabel="apprenants"
                                                singularLabel="apprenant"
                                            />
                                        </DataTableCell>
                                        <DataTableCell nowrap>
                                            <Text className={uiTokens.dataTable.text.secondary}>
                                                {evaluation.assignedAt}
                                            </Text>
                                        </DataTableCell>
                                    </DataTableRow>
                                ))}
                            </Fragment>
                        ))}
                        {evaluations.length === 0 && (
                            <DataTableRow>
                                <DataTableCell
                                    colSpan={columns.length}
                                    className={uiTokens.dataTable.emptyCell}
                                >
                                    <Text className={uiTokens.organizationDetail.content.emptyTitle}>
                                        Aucune évaluation assignée
                                    </Text>
                                    <Text className={uiTokens.organizationDetail.content.emptyDescription}>
                                        Aucune évaluation n&apos;est ciblée sur ce groupe.
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
