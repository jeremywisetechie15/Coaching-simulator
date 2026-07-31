import { Building2, ChevronLeft, ChevronRight, Eye, Pencil } from "lucide-react";
import { ContextualLink } from "@/features/app-shell/components";
import { Box, Button, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import {
    DataTable,
    DataTableCell,
    DataTableHead,
    DataTableHeaderCell,
    DataTableRow,
} from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";
import { cn } from "@/lib/ui/utils/cn";
import type { OrganizationListItem } from "@/features/organizations/domain/organization-list";
import { OrganizationStatusBadge } from "./OrganizationStatusBadge";

interface OrganizationsTableProps {
    organizations: OrganizationListItem[];
    totalOrganizationCount: number;
}

const columns = [
    "Entreprise",
    "Groupes",
    "Utilisateurs",
    "Roleplays",
    "Quiz",
    "Date de création",
    "Statut",
    "Actions",
];

export function OrganizationsTable({ organizations, totalOrganizationCount }: OrganizationsTableProps) {
    const hasOrganizations = organizations.length > 0;

    return (
        <CardSurface className={uiTokens.dataTable.frame}>
            <Box className={uiTokens.dataTable.scroll}>
                <DataTable width="extraWide">
                    <DataTableHead>
                        <DataTableRow>
                            {columns.map((column) => (
                                <DataTableHeaderCell
                                    key={column}
                                    className={cn(
                                        ["Groupes", "Utilisateurs", "Roleplays", "Quiz", "Statut", "Actions"].includes(column)
                                            && uiTokens.organizations.table.centerCell,
                                    )}
                                >
                                    {column}
                                </DataTableHeaderCell>
                            ))}
                        </DataTableRow>
                    </DataTableHead>

                    <Box as="tbody">
                        {hasOrganizations ? (
                            organizations.map((organization) => (
                                <DataTableRow
                                    key={organization.id}
                                    className={uiTokens.organizations.table.row}
                                >
                                    <DataTableCell className={uiTokens.organizations.table.companyCell}>
                                        <Box className={uiTokens.organizations.table.companyLayout}>
                                            <Box className={uiTokens.organizations.table.companyIcon}>
                                                <InlineIcon
                                                    icon={Building2}
                                                    className={uiTokens.organizations.table.companyIconGlyph}
                                                />
                                            </Box>
                                            <Text className={uiTokens.dataTable.text.primary}>
                                                {organization.name}
                                            </Text>
                                        </Box>
                                    </DataTableCell>
                                    <DataTableCell className={uiTokens.organizations.table.centerCell}>
                                        <Text className={uiTokens.dataTable.text.body}>
                                            {organization.groupCount}
                                        </Text>
                                    </DataTableCell>
                                    <DataTableCell className={uiTokens.organizations.table.centerCell}>
                                        <Text className={uiTokens.dataTable.text.body}>
                                            {organization.userCount}
                                        </Text>
                                    </DataTableCell>
                                    <DataTableCell className={uiTokens.organizations.table.centerCell}>
                                        <Text className={uiTokens.dataTable.text.body}>
                                            {organization.roleplayCount}
                                        </Text>
                                    </DataTableCell>
                                    <DataTableCell className={uiTokens.organizations.table.centerCell}>
                                        <Text className={uiTokens.dataTable.text.body}>
                                            {organization.quizCount}
                                        </Text>
                                    </DataTableCell>
                                    <DataTableCell nowrap>
                                        <Text className={uiTokens.dataTable.text.secondary}>
                                            {organization.createdAt}
                                        </Text>
                                    </DataTableCell>
                                    <DataTableCell className={uiTokens.organizations.table.statusCell}>
                                        <OrganizationStatusBadge status={organization.status} />
                                    </DataTableCell>
                                    <DataTableCell className={uiTokens.organizations.table.actionsCell}>
                                        <Box className={uiTokens.organizations.table.actions}>
                                            <ContextualLink
                                                href={`/organizations/${organization.id}`}
                                                aria-label={`Voir ${organization.name}`}
                                                className={uiTokens.organizations.table.action}
                                            >
                                                <InlineIcon
                                                    icon={Eye}
                                                    className={uiTokens.organizations.table.actionIcon}
                                                />
                                            </ContextualLink>
                                            <ContextualLink
                                                href={`/organizations/${organization.id}?edit=1`}
                                                aria-label={`Modifier ${organization.name}`}
                                                className={uiTokens.organizations.table.action}
                                            >
                                                <InlineIcon
                                                    icon={Pencil}
                                                    className={uiTokens.organizations.table.actionIcon}
                                                />
                                            </ContextualLink>
                                        </Box>
                                    </DataTableCell>
                                </DataTableRow>
                            ))
                        ) : (
                            <DataTableRow>
                                <DataTableCell
                                    colSpan={columns.length}
                                    className={uiTokens.organizations.table.emptyCell}
                                >
                                    <Box className={uiTokens.organizations.table.emptyContent}>
                                        <InlineIcon
                                            icon={Building2}
                                            className={uiTokens.organizations.table.emptyIcon}
                                        />
                                        <Text className={uiTokens.organizations.table.emptyTitle}>
                                            Aucune entreprise trouvée
                                        </Text>
                                        <Text className={uiTokens.organizations.table.emptyDescription}>
                                            Essayez de modifier vos filtres
                                        </Text>
                                    </Box>
                                </DataTableCell>
                            </DataTableRow>
                        )}
                    </Box>
                </DataTable>
            </Box>

            <Box className={uiTokens.organizations.table.footer}>
                <Text className={uiTokens.organizations.table.footerText}>
                    {hasOrganizations
                        ? `Affichage 1-${organizations.length} sur ${totalOrganizationCount} organisations`
                        : `Affichage 0 sur ${totalOrganizationCount} organisations`}
                </Text>

                <Box className={uiTokens.organizations.table.pagination}>
                    <Button
                        aria-label="Page précédente"
                        className={uiTokens.organizations.table.paginationButton}
                    >
                        <InlineIcon
                            icon={ChevronLeft}
                            className={uiTokens.organizations.table.paginationIcon}
                        />
                    </Button>
                    <Button
                        aria-label="Page 1"
                        aria-current="page"
                        className={uiTokens.organizations.table.paginationActive}
                    >
                        1
                    </Button>
                    <Button
                        aria-label="Page suivante"
                        className={uiTokens.organizations.table.paginationButton}
                    >
                        <InlineIcon
                            icon={ChevronRight}
                            className={uiTokens.organizations.table.paginationIcon}
                        />
                    </Button>
                </Box>
            </Box>
        </CardSurface>
    );
}
