import { Search } from "lucide-react";
import {
    ORGANIZATION_STATUS_FILTER_OPTIONS,
    type OrganizationStatusFilter,
} from "@/features/organizations/domain/organization-list";
import { Box, CardSurface, InlineIcon, TextInput } from "@/lib/ui/atoms";
import { FilterSelect } from "@/lib/ui/molecules";

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
        <CardSurface className="mb-7 rounded-[14px] border border-[#E1E4EB] px-4 py-3 shadow-none md:px-5">
            <Box className="flex flex-col gap-3 md:flex-row">
                <Box className="relative min-w-0 flex-1">
                    <InlineIcon
                        icon={Search}
                        className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#99A1B2]"
                    />
                    <TextInput
                        aria-label="Rechercher une entreprise"
                        placeholder="Rechercher une entreprise..."
                        value={searchQuery}
                        onChange={(event) => onSearchQueryChange(event.target.value)}
                        hasLeadingIcon={false}
                        className="h-10 rounded-lg border-[#E1E4EB] bg-[#FBFCFE] pl-11 text-[14px] font-normal text-[#171B2A] shadow-none placeholder:text-[#82899A] focus:bg-white focus:ring-2"
                    />
                </Box>

                <Box className="min-w-[180px]">
                    <FilterSelect
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
