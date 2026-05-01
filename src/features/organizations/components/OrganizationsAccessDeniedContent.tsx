import { ShieldAlert } from "lucide-react";
import { Box, CardSurface, InlineIcon, Text } from "@/lib/ui/atoms";
import { OrganizationsPageHeader } from "./OrganizationsPageHeader";

export function OrganizationsAccessDeniedContent() {
    return (
        <Box as="main" className="px-5 pb-12 md:px-9 lg:px-12">
            <Box className="mx-auto max-w-[1260px]">
                <OrganizationsPageHeader onCreateClick={() => undefined} showCreateButton={false} />
                <CardSurface className="rounded-[14px] border border-[#E1E4EB] px-8 py-14 text-center shadow-none">
                    <Box className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF0FF] text-[#5140F0]">
                        <InlineIcon icon={ShieldAlert} className="h-7 w-7" />
                    </Box>
                    <Text as="h2" className="text-[20px] font-extrabold text-[#171B2A]">
                        Accès admin requis
                    </Text>
                    <Text className="mt-2 text-[14px] font-semibold text-[#737B8E]">
                        Ton compte doit être admin pour voir et gérer les organisations.
                    </Text>
                </CardSurface>
            </Box>
        </Box>
    );
}
