"use client";

import { useState } from "react";
import { Box, Button, InlineIcon, Text } from "@/lib/ui/atoms";
import { accountNavigation, logoutNavigation, primaryNavigation } from "./profileNavigation";

export function ProfileSidebar() {
    const [isAccountOpen, setIsAccountOpen] = useState(true);

    return (
        <Box
            as="aside"
            className="fixed left-0 top-0 z-30 hidden h-screen w-[280px] border-r border-[#E6E8EF] bg-white lg:flex lg:flex-col"
        >
            <Box className="flex h-[84px] items-center border-b border-[#EEF0F5] px-5">
                <Text className="text-[24px] font-black tracking-[-0.01em] text-[#5140F0]">MaiaCoach</Text>
            </Box>

            <Box as="nav" className="flex-1 space-y-1 overflow-y-auto px-4 pb-6 pt-4">
                {primaryNavigation.map((item) => (
                    <Button
                        key={item.label}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-[14px] font-normal leading-5 text-[#0A0A0A] transition hover:bg-[#F4F5FF] hover:text-[#5140F0]"
                    >
                        <InlineIcon icon={item.icon} className="h-5 w-5 shrink-0" />
                        <Text as="span">{item.label}</Text>
                    </Button>
                ))}

                <Box className="pt-1">
                    <Button
                        onClick={() => setIsAccountOpen((value) => !value)}
                        aria-expanded={isAccountOpen}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-[14px] font-normal leading-5 text-[#0A0A0A]"
                    >
                        <InlineIcon icon={accountNavigation.icon} className="h-5 w-5 shrink-0" />
                        <Text as="span">{accountNavigation.label}</Text>
                        <InlineIcon
                            icon={accountNavigation.trailingIcon}
                            className={`ml-auto h-4 w-4 transition-transform ${isAccountOpen ? "rotate-180" : ""}`}
                        />
                    </Button>

                    {isAccountOpen && (
                        <Box className="ml-7 mt-2 space-y-2">
                            {accountNavigation.items.map((item, index) => (
                                <Button
                                    key={item}
                                    className={
                                        index === 0
                                            ? "flex h-10 w-full items-center rounded-xl bg-[#EEF0FF] px-5 text-left text-[14px] font-normal leading-5 text-[#5140F0]"
                                            : "flex h-10 w-full items-center rounded-xl px-5 text-left text-[14px] font-normal leading-5 text-[#0A0A0A] transition hover:bg-[#F7F7FB]"
                                    }
                                >
                                    {item}
                                </Button>
                            ))}
                        </Box>
                    )}
                </Box>
            </Box>

            <Box className="border-t border-[#EEF0F5] px-5 py-3">
                <Button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-[14px] font-normal leading-5 text-[#0A0A0A] transition hover:bg-[#F7F7FB] hover:text-[#5140F0]">
                    <InlineIcon icon={logoutNavigation.icon} className="h-5 w-5 shrink-0" />
                    <Text as="span">{logoutNavigation.label}</Text>
                </Button>
            </Box>
        </Box>
    );
}
