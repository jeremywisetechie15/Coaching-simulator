import { ChevronDown, Search } from "lucide-react";
import { Box, Button, CardSurface, InlineIcon, Text, TextInput } from "@/lib/ui/atoms";

interface OrganizationsFilterBarProps {
    onSearchQueryChange: (value: string) => void;
    searchQuery: string;
}

export function OrganizationsFilterBar({ onSearchQueryChange, searchQuery }: OrganizationsFilterBarProps) {
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

                <Button className="flex h-10 min-w-[180px] items-center justify-between rounded-lg border border-[#E1E4EB] bg-[#FBFCFE] px-4 text-left text-[14px] font-semibold text-[#202636] transition hover:bg-white">
                    <Text as="span">Tous statuts</Text>
                    <InlineIcon icon={ChevronDown} className="h-5 w-5 text-[#B5BBC8]" />
                </Button>
            </Box>
        </CardSurface>
    );
}
