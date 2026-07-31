import { Search } from "lucide-react";
import {
    ORGANIZATION_STATUS_FILTER_OPTIONS,
    type OrganizationStatusFilter,
} from "@/features/organizations/domain/organization-list";
import { Box, CardSurface, InlineIcon, TextInput } from "@/lib/ui/atoms";
import { FilterSelect } from "@/lib/ui/molecules";
import { uiTokens } from "@/lib/ui/tokens";

interface OrganizationsFilterBarProps {
    onSearchQueryChange: (value: string) => void;
    onStatusFilterChange: (value: OrganizationStatusFilter) => void;
    searchQuery: string;
    statusFilter: OrganizationStatusFilter;
}

export function OrganizationsFilterBar({
    onSearchQueryChange,
    onStatusFilterChange,
    searchQuery,
    statusFilter,
}: OrganizationsFilterBarProps) {
    return (
        <CardSurface className={uiTokens.organizations.filter.surface}>
            <Box className={uiTokens.organizations.filter.layout}>
                <Box className={uiTokens.organizations.filter.search}>
                    <InlineIcon
                        icon={Search}
                        className={uiTokens.organizations.filter.searchIcon}
                    />
                    <TextInput
                        aria-label="Rechercher une entreprise"
                        placeholder="Rechercher une entreprise..."
                        value={searchQuery}
                        onChange={(event) => onSearchQueryChange(event.target.value)}
                        hasLeadingIcon={false}
                        className={uiTokens.organizations.filter.searchInput}
                    />
                </Box>

                <Box className={uiTokens.organizations.filter.status}>
                    <FilterSelect
                        appearance="library"
                        ariaLabel="Filtrer les organisations par statut"
                        onChange={(value) => onStatusFilterChange(value as OrganizationStatusFilter)}
                        options={ORGANIZATION_STATUS_FILTER_OPTIONS}
                        value={statusFilter}
                    />
                </Box>
            </Box>
        </CardSurface>
    );
}
