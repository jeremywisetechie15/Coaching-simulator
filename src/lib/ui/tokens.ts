export const uiTokens = {
    motion: {
        cardGridReveal: "app-card-grid-reveal",
        modalOverlayReveal: "app-modal-overlay-reveal",
        modalPanelReveal: "app-modal-panel-reveal",
        sidebarItemsReveal: "app-sidebar-items-reveal",
        sidebarReveal: "app-sidebar-reveal",
    },
    auth: {
        card: "max-w-[400px] rounded-[18px] border border-white px-6 py-7 shadow-[0_20px_45px_rgba(15,23,42,0.11)] sm:px-7 sm:py-8",
        container: "min-h-[calc(100vh-4rem)] max-w-5xl",
        description: "mt-2 text-[13px] font-semibold tracking-normal text-[#6B7280] sm:text-[14px]",
        eyebrow: "text-[24px] font-black tracking-normal text-[#5140F0] sm:text-[26px]",
        header: "mb-6 text-center",
        link: "font-semibold text-[#5140F0] transition hover:text-[#4635E7] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0] focus-visible:ring-offset-2",
        page: "bg-[#F7F8FB] px-5 py-8 text-[#111827]",
        title: "mt-6 text-[20px] font-extrabold tracking-normal text-[#111827] sm:text-[22px]",
    },
    dashboard: {
        page: "px-4 pb-12 md:px-6 lg:px-8",
        container: "mx-auto max-w-[1440px] space-y-4",
        panel:
            "rounded-2xl border border-[#F3F4F6] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)]",
        sectionTitle: "text-[16px] font-semibold leading-6 text-[#111827]",
        header: {
            title: "text-[24px] font-bold leading-8 text-[#111827]",
            date: "mt-0.5 text-[14px] font-normal capitalize leading-5 text-[#9CA3AF]",
            primaryAction:
                "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#5140F0] px-4 py-2 text-[14px] font-medium leading-5 text-white shadow-[0_8px_18px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0] focus-visible:ring-offset-2",
            secondaryAction:
                "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-[14px] font-medium leading-5 text-[#4B5563] transition hover:border-[#C9C2FB] hover:text-[#5140F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[#E5E7EB] disabled:hover:text-[#4B5563]",
            periodControl:
                "h-10 rounded-lg border border-[#E5E7EB] bg-white pl-3 pr-9 text-[14px] font-medium text-[#4B5563] outline-none transition hover:border-[#C9C2FB] focus:border-[#5140F0] focus:ring-4 focus:ring-[#5140F0]/10",
            periodIcon: "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]",
            infoIcon: "h-4 w-4 text-[#98A2B3]",
            fetching: "text-[12px] font-medium text-[#6B7280]",
        },
        metric: {
            card: "min-h-[165px] rounded-xl border border-[#F3F4F6] bg-white p-4",
            icon: "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            label: "line-clamp-2 min-w-0 text-[14px] font-normal leading-[19px] text-[#4B5563]",
            value: "text-[30px] font-bold leading-none text-[#111827]",
            detail: "text-[14px] font-normal leading-5 text-[#9CA3AF]",
            trend:
                "mt-3 inline-flex min-h-5 w-fit items-center rounded bg-[#ECFDF5] px-2 py-0.5 text-[11px] font-medium leading-4 text-[#059669]",
            infoIcon: "flex h-5 w-5 items-center justify-center rounded-full text-[#D1D5DB]",
            tone: {
                blue: "bg-[#EFF6FF] text-[#3B82F6]",
                green: "bg-[#ECFDF5] text-[#10B981]",
                orange: "bg-[#FFF7ED] text-[#F97316]",
            },
        },
        scoreCard: {
            root: "min-h-[155px] rounded-xl border border-[#E5E7EB] bg-white p-3.5",
            header: "mb-4 flex items-center gap-2",
            icon: "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            label: "text-[14px] font-normal leading-5 text-[#4B5563]",
            value: "mb-2 text-[24px] font-bold leading-8 text-[#111827]",
            trend:
                "inline-flex min-h-5 w-fit items-center rounded bg-[#ECFDF5] px-2 py-0.5 text-[11px] font-medium leading-4 text-[#059669]",
            limited: "mt-1 inline-flex text-[11px] font-normal text-[#9CA3AF]",
            tone: {
                roleplay: "bg-[#EFF6FF] text-[#3B82F6]",
                quiz: "bg-[#ECFDF5] text-[#10B981]",
            },
        },
        chart: {
            grid: "stroke-[#F3F4F6]",
            axisLabel: "fill-[#9CA3AF] text-[11px] font-normal",
            roleplay: "text-[#3B82F6]",
            quiz: "text-[#0D9488]",
            legend: "flex items-center gap-1.5 text-[12px] font-normal text-[#4B5563]",
            footnote: "mt-4 flex items-start gap-1.5 border-t border-[#F9FAFB] pt-4 text-[11px] font-normal leading-4 text-[#9CA3AF]",
            empty: "mt-5 flex min-h-[200px] items-center justify-center rounded-xl bg-[#F9FAFB] text-[14px] font-normal text-[#6B7280]",
        },
        domain: {
            grid: "grid max-h-[360px] flex-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2",
            table: "self-start overflow-hidden rounded-xl border border-[#E5E7EB] bg-white",
            header:
                "sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_130px] gap-3 border-b border-[#F3F4F6] bg-white px-4 py-2.5 text-[10px] font-semibold uppercase tracking-normal text-[#9CA3AF]",
            row:
                "grid min-h-[42px] w-full grid-cols-[minmax(0,1fr)_130px] items-center gap-3 border-b border-[#F9FAFB] bg-[#F9FAFB] px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-[#F3F4F6] disabled:cursor-default disabled:opacity-100",
            childRow:
                "grid min-h-[42px] grid-cols-[minmax(0,1fr)_130px] items-center gap-3 border-b border-[#F3F4F6] bg-white px-4 py-2.5 text-left last:border-b-0",
            label: "line-clamp-2 text-[12px] font-semibold leading-[16px] text-[#111827]",
            childLabel: "line-clamp-2 text-[12px] font-medium leading-4 text-[#4B5563]",
            chevron: "h-3.5 w-3.5 text-[#9CA3AF] transition-transform",
            empty: "px-4 py-10 text-center text-[12px] font-normal text-[#6B7280]",
            score:
                "inline-flex min-h-5 min-w-[48px] items-center justify-center rounded-full border border-[#D1D5DB] bg-transparent px-2.5 py-0.5 text-[12px] font-semibold leading-4 text-[#374151]",
        },
        activityList: {
            tab:
                "inline-flex min-h-7 items-center justify-center rounded-lg border px-3 py-1.5 text-[12px] font-medium leading-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0] focus-visible:ring-offset-2",
            tabActive: "border-[#5140F0] bg-[#5140F0] text-white",
            tabIdle: "border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F9FAFB]",
            list: "mt-4 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white",
            row: "flex min-h-[76px] items-center gap-3 border-b border-[#F3F4F6] p-4 last:border-b-0",
            avatar: "h-11 w-11 shrink-0 rounded-full border border-[#E5E7EB] bg-[#F3F4F6] bg-cover bg-center",
            quizIcon: "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#5140F0]",
            badge: "inline-flex min-h-5 items-center rounded-md bg-[#EDE9FE] px-1.5 py-0.5 text-[10px] font-medium leading-4 text-[#6D28D9]",
            statusBadge: "inline-flex min-h-5 items-center rounded-md bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] font-medium leading-4 text-[#4B5563]",
            title: "line-clamp-2 text-[14px] font-semibold leading-5 text-[#111827]",
            meta: "mt-1 flex flex-wrap items-center gap-3 text-[11px] font-normal text-[#9CA3AF]",
            metaIcon: "h-3 w-3 text-[#9CA3AF]",
            subtitle: "mt-1 line-clamp-2 text-[14px] font-semibold leading-[19px] text-[#111827]",
            score:
                "inline-flex min-h-7 min-w-[48px] items-center justify-center rounded-md bg-[#D1FAE5] px-2.5 py-1 text-[12px] font-semibold leading-4 text-[#047857]",
            scoreRetry: "bg-[#FFEDD5] text-[#C2410C]",
            action:
                "inline-flex min-h-8 items-center justify-center gap-1 rounded-lg bg-[#5140F0] px-3.5 py-2 text-[12px] font-medium leading-4 text-white transition hover:bg-[#4635E7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0] focus-visible:ring-offset-2",
            empty: "py-10 text-center text-[14px] font-normal text-[#6B7280]",
            viewAll: "text-[12px] font-medium text-[#5140F0] transition hover:text-[#4635E7] hover:underline",
        },
        state: {
            error:
                "rounded-[14px] border border-[#FECACA] bg-white px-6 py-10 text-center shadow-[0_1px_2px_rgba(17,24,39,0.03)]",
            errorIcon: "mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#DC2626]",
            errorText: "mx-auto mt-3 max-w-[520px] text-[13px] font-medium leading-5 text-[#667085]",
            retry:
                "mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#5140F0] px-4 text-[12px] font-bold text-white transition hover:bg-[#4635E7]",
            skeleton: "animate-pulse rounded-[10px] border border-[#E4E7EC] bg-[#F8F9FB]",
        },
    },
    entityHeader: {
        root:
            "relative isolate flex min-h-[94px] flex-col items-stretch justify-between gap-4 overflow-hidden rounded-[16px] border px-6 py-7 sm:flex-row sm:items-center",
        title:
            "relative z-10 text-[20px] font-[var(--entity-header-title-weight)] leading-[30px] tracking-normal text-white drop-shadow-sm",
        actions: "relative z-10 flex shrink-0 flex-wrap items-center gap-2",
        haloPrimary:
            "pointer-events-none absolute -left-10 -top-16 h-64 w-64 rounded-full blur-3xl",
        haloSecondary:
            "pointer-events-none absolute -top-10 right-10 h-72 w-72 rounded-full blur-3xl",
        haloTertiary:
            "pointer-events-none absolute -bottom-24 left-1/3 h-80 w-80 rounded-full blur-3xl",
        waves:
            "pointer-events-none absolute inset-x-0 bottom-0 h-24 overflow-hidden text-white",
        wave: "absolute bottom-0 left-0 h-24 w-[200%]",
        action: {
            primary:
                "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-white px-3 text-[14px] font-medium text-[var(--entity-header-action-text)] shadow-[0_4px_12px_rgba(30,27,75,0.12)] transition hover:bg-[var(--entity-header-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--entity-header-action-ring)]",
        },
        tone: {
            coach:
                "border-white/20 [--entity-header-action-hover:#FFF1F2] [--entity-header-action-ring:#BE123C] [--entity-header-action-text:#BE123C] [--entity-header-gradient-from:#BE123C] [--entity-header-gradient-middle:#E11D48] [--entity-header-gradient-to:#FB7185] [--entity-header-glow-primary:rgba(251,113,133,0.85)] [--entity-header-glow-secondary:rgba(244,63,94,0.8)] [--entity-header-glow-tertiary:rgba(253,164,175,0.8)] [--entity-header-title-weight:400]",
            method:
                "border-white/20 [--entity-header-action-hover:#FAF5FF] [--entity-header-action-ring:#6D28D9] [--entity-header-action-text:#6D28D9] [--entity-header-gradient-from:#6D28D9] [--entity-header-gradient-middle:#9333EA] [--entity-header-gradient-to:#DB2777] [--entity-header-glow-primary:rgba(167,139,250,0.85)] [--entity-header-glow-secondary:rgba(217,70,239,0.8)] [--entity-header-glow-tertiary:rgba(244,114,182,0.8)] [--entity-header-title-weight:400]",
            persona:
                "border-white/20 [--entity-header-action-hover:#FAF5FF] [--entity-header-action-ring:#7C3AED] [--entity-header-action-text:#7C3AED] [--entity-header-gradient-from:#7C3AED] [--entity-header-gradient-middle:#C026D3] [--entity-header-gradient-to:#6366F1] [--entity-header-glow-primary:rgba(217,70,239,0.85)] [--entity-header-glow-secondary:rgba(167,139,250,0.8)] [--entity-header-glow-tertiary:rgba(129,140,248,0.8)] [--entity-header-title-weight:400]",
            quiz:
                "border-white/20 [--entity-header-action-hover:#F0FDFA] [--entity-header-action-ring:#0F766E] [--entity-header-action-text:#0F766E] [--entity-header-gradient-from:#0F766E] [--entity-header-gradient-middle:#0891B2] [--entity-header-gradient-to:#22C55E] [--entity-header-glow-primary:rgba(45,212,191,0.85)] [--entity-header-glow-secondary:rgba(56,189,248,0.8)] [--entity-header-glow-tertiary:rgba(74,222,128,0.8)] [--entity-header-title-weight:400]",
            roleplay:
                "border-[#818CF8]/30 [--entity-header-action-hover:#EEF2FF] [--entity-header-action-ring:#4338CA] [--entity-header-action-text:#4338CA] [--entity-header-gradient-from:#4338CA] [--entity-header-gradient-middle:#6D28D9] [--entity-header-gradient-to:#0EA5E9] [--entity-header-glow-primary:rgba(129,140,248,0.9)] [--entity-header-glow-secondary:rgba(56,189,248,0.85)] [--entity-header-glow-tertiary:rgba(192,132,252,0.8)] [--entity-header-title-weight:700]",
            scorecard:
                "border-white/20 [--entity-header-action-hover:#FFFBEB] [--entity-header-action-ring:#B45309] [--entity-header-action-text:#B45309] [--entity-header-gradient-from:#B45309] [--entity-header-gradient-middle:#EA580C] [--entity-header-gradient-to:#F59E0B] [--entity-header-glow-primary:rgba(251,191,36,0.85)] [--entity-header-glow-secondary:rgba(251,146,60,0.8)] [--entity-header-glow-tertiary:rgba(253,224,71,0.8)] [--entity-header-title-weight:400]",
            skill:
                "border-white/20 [--entity-header-action-hover:#EFF6FF] [--entity-header-action-ring:#1D4ED8] [--entity-header-action-text:#1D4ED8] [--entity-header-gradient-from:#1D4ED8] [--entity-header-gradient-middle:#2563EB] [--entity-header-gradient-to:#06B6D4] [--entity-header-glow-primary:rgba(96,165,250,0.85)] [--entity-header-glow-secondary:rgba(56,189,248,0.8)] [--entity-header-glow-tertiary:rgba(34,211,238,0.8)] [--entity-header-title-weight:400]",
        },
    },
    adminDashboard: {
        page: "px-4 pb-14 md:px-6 lg:px-8 print:px-0",
        container: "mx-auto max-w-[1460px] space-y-4",
        panelContent:
            "rounded-2xl border border-[#F3F4F6] bg-white p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]",
        sectionHeader: "flex min-h-6 flex-wrap items-start justify-between gap-3",
        sectionTitle: "text-[16px] font-semibold leading-6 text-[#111827]",
        summary: {
            panel:
                "rounded-2xl border border-[#F3F4F6] bg-white p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]",
            metricsGrid: "grid gap-3 sm:grid-cols-2 xl:grid-cols-6",
            aiTitle: "mb-3 mt-5 text-[16px] font-semibold leading-6 text-[#111827]",
            aiGrid: "grid gap-3 sm:grid-cols-2 xl:grid-cols-6",
        },
        layout: {
            middle: "grid gap-5 xl:grid-cols-2",
            bottom: "grid gap-4 xl:grid-cols-2",
        },
        loading: {
            layout: "space-y-4",
            summary:
                "space-y-5 rounded-2xl border border-[#F3F4F6] bg-white p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]",
            aiGrid: "grid gap-3 sm:grid-cols-2 xl:grid-cols-6",
        },
        header: {
            layout: "flex flex-col gap-5 py-1 xl:flex-row xl:items-end xl:justify-between",
            title: "text-[24px] font-bold leading-8 text-[#111827]",
            date: "mt-0.5 text-[14px] font-normal leading-5 text-[#9CA3AF]",
            controls: "flex flex-wrap items-center gap-3 print:hidden",
            controlWrapper: "relative inline-flex",
            button:
                "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-[14px] font-medium text-[#4B5563] transition hover:border-[#C9C2FB] hover:bg-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B32FF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
            periodSelect:
                "!h-10 min-w-[200px] !appearance-none !rounded-lg !border !border-[#E5E7EB] !bg-white !pl-3 !pr-16 !text-[14px] !font-medium !text-[#4B5563] !shadow-none !outline-none transition hover:!border-[#C9C2FB] focus:!border-[#4B32FF] focus:!ring-4 focus:!ring-[#4B32FF]/10",
            organizationSelect:
                "!h-10 min-w-[190px] !appearance-none !rounded-lg !border !border-[#E5E7EB] !bg-white !pl-3 !pr-9 !text-[14px] !font-medium !text-[#4B5563] !shadow-none !outline-none transition hover:!border-[#C9C2FB] focus:!border-[#4B32FF] focus:!ring-4 focus:!ring-[#4B32FF]/10",
            selectIcon: "pointer-events-none absolute right-9 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]",
            chevron: "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]",
        },
        metric: {
            card: "min-h-[150px] rounded-xl border border-[#F3F4F6] bg-white p-4",
            header: "flex items-start justify-between gap-2",
            heading: "flex min-w-0 items-center gap-2.5",
            icon: "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            label: "line-clamp-2 text-[14px] font-normal leading-[19px] text-[#4B5563]",
            infoIcon: "flex h-5 w-5 shrink-0 cursor-help items-center justify-center text-[#D1D5DB]",
            value: "text-[30px] font-bold leading-none text-[#111827]",
            detail: "mt-2 line-clamp-2 text-[12px] font-normal leading-[15px] text-[#9CA3AF]",
            tone: {
                blue: "bg-[#EFF6FF] text-[#3B82F6]",
                green: "bg-[#ECFDF5] text-[#10B981]",
                orange: "bg-[#FFF7ED] text-[#F97316]",
                purple: "bg-[#F5F3FF] text-[#7C3AED]",
                red: "bg-[#FFF1F2] text-[#F43F5E]",
            },
        },
        chart: {
            grid: "stroke-[#E7EAF2]",
            axisLabel: "fill-[#9CA3AF] text-[11px] font-normal",
            connections: "text-[#4B32FF]",
            roleplays: "text-[#FF4B1F]",
            quizzes: "text-[#16A34A]",
            legend: "flex items-center gap-2 text-[12px] font-normal text-[#4B5563]",
            footnote: "mt-3 flex items-center gap-2 text-[11px] font-normal text-[#9CA3AF]",
            empty: "flex min-h-[230px] items-center justify-center text-[14px] font-normal text-[#6B7280]",
        },
        ai: {
            table: "overflow-hidden bg-white",
            tableMinWidth: "min-w-[1050px]",
            columns:
                "grid-cols-[minmax(130px,1.2fr)_0.55fr_0.65fr_0.65fr_0.65fr_0.65fr_0.65fr_0.6fr]",
        },
        table: {
            root: "overflow-hidden bg-white",
            scrollArea: "mt-4 overflow-x-auto",
            topRoleplaysMinWidth: "min-w-[520px]",
            performanceMinWidth: "min-w-[500px]",
            topRoleplaysColumns: "grid-cols-[28px_minmax(150px,1fr)_76px_64px_78px]",
            performanceColumns: "grid-cols-[minmax(150px,1fr)_92px_92px_78px]",
            header:
                "grid min-h-[54px] items-center gap-3 border-b border-[#F3F4F6] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-normal text-[#9CA3AF]",
            row:
                "grid min-h-[49px] items-center gap-3 border-b border-[#F9FAFB] px-4 py-3 text-[14px] font-normal leading-5 text-[#4B5563] transition-colors last:border-b-0 hover:bg-[#F9FAFB]",
            rank: "flex h-6 w-6 items-center justify-center rounded-full bg-[#5140F0] text-[12px] font-semibold text-white",
            scoreGood: "inline-flex min-w-[44px] justify-center rounded-md bg-[#D1FAE5] px-2.5 py-1 text-[12px] font-semibold leading-4 text-[#047857]",
            scoreWarning: "inline-flex min-w-[44px] justify-center rounded-md bg-[#FEF3C7] px-2.5 py-1 text-[12px] font-semibold leading-4 text-[#B45309]",
            scoreDanger: "inline-flex min-w-[44px] justify-center rounded-md bg-[#FEE2E2] px-2.5 py-1 text-[12px] font-semibold leading-4 text-[#DC2626]",
            empty: "flex min-h-32 items-center justify-center px-4 text-center text-[14px] font-normal text-[#6B7280]",
            link: "line-clamp-2 font-normal leading-5 text-[#111827] transition hover:text-[#4B32FF] hover:underline",
            viewAll: "text-[14px] font-medium leading-5 text-[#5140F0] transition hover:text-[#4635E7] hover:underline",
            centerStrong: "text-center font-normal text-[#4B5563]",
            rightStrong: "text-right font-normal text-[#4B5563]",
            strong: "font-semibold text-[#111827]",
        },
        state: {
            skeleton: "animate-pulse rounded-[11px] border border-[#E1E5EF] bg-[#F7F8FC]",
            error: "rounded-[13px] border border-[#FECACA] bg-white px-6 py-10 text-center",
            errorText: "mt-2 text-[12px] font-medium text-[#667085]",
        },
    },
    badge: {
        stepNumber:
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5140F0] text-[13px] font-bold text-white",
        stepNumberMuted:
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[13px] font-bold text-[#9CA3AF]",
    },
    contentStatus: {
        badge:
            "inline-flex h-7 items-center rounded-lg border px-2.5 text-[11px] font-bold",
    },
    metadata: {
        dateBadge:
            "inline-flex h-7 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#F7F8FB] px-2.5 text-[12px] font-bold text-[#4B5563]",
        dateBadgeIcon: "h-3.5 w-3.5 text-[#9CA3AF]",
    },
    discProfile: {
        badge: "inline-flex items-center rounded-lg border px-2.5 font-bold",
        grid: "grid gap-3 sm:grid-cols-2",
        option:
            "min-h-[84px] rounded-[12px] border px-4 py-4 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0]/40",
        optionIdle: "border-[#E5E7EB] bg-white text-[#111827] hover:border-[#D5D7DE]",
        selected: {
            blue: "border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]",
            green: "border-[#16A34A] bg-[#F0FDF4] text-[#15803D]",
            neutral: "border-[#9CA3AF] bg-[#F3F4F6] text-[#4B5563]",
            red: "border-[#DC2626] bg-[#FEF2F2] text-[#B91C1C]",
            yellow: "border-[#EAB308] bg-[#FEFCE8] text-[#A16207]",
        },
    },
    learnerContentStatus: {
        badge: "inline-flex h-7 items-center rounded-md border px-2.5 text-[12px] font-bold",
    },
    quizBadge: {
        base:
            "inline-flex min-h-7 items-center rounded-lg border px-3 py-1 text-[12px] font-bold",
    },
    quizLibraryCard: {
        action:
            "mt-auto flex h-9 w-full items-center justify-center gap-2 rounded-lg border-2 border-[#4F46E5] bg-white px-4 text-[14px] font-medium text-[#4F46E5] transition hover:bg-[#EEF2FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2",
        actionIcon: "h-4 w-4",
        attemptBadge:
            "inline-flex h-7 min-w-10 items-center justify-center gap-1 rounded-lg border border-white/25 bg-white/15 px-2 text-[12px] font-bold text-white backdrop-blur-sm",
        badge:
            "!h-[22px] !min-h-[22px] !rounded-lg !px-2 !py-0.5 !text-[12px] !font-medium !leading-4",
        badgeRow: "mb-4 flex flex-wrap items-start gap-2",
        body: "flex flex-1 flex-col px-6 pb-6 pt-3",
        category:
            "inline-flex h-6 w-fit max-w-[220px] items-center truncate rounded-md bg-white/95 px-2 text-[12px] font-medium text-[#0F766E]",
        categoryPosition: "absolute left-3 top-3",
        description:
            "mb-6 line-clamp-2 min-h-10 text-[14px] font-normal leading-5 text-[#4B5563]",
        header:
            "relative h-16 shrink-0 rounded-t-[14px] [background:linear-gradient(120deg,#0F766E_0%,#0891B2_55%,#22C55E_100%)]",
        menuButton:
            "flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        menuIcon: "h-4 w-4",
        menuPosition: "absolute right-3 top-3 z-20 flex items-center gap-1.5",
        metadata: "mb-4 space-y-2",
        metadataIcon: "h-4 w-4 shrink-0 text-[#6B7280]",
        metadataMethod: "text-[#4F46E5]",
        metadataRow:
            "flex min-h-5 items-center gap-2 text-[14px] font-normal leading-5 text-[#4B5563]",
        root:
            "relative flex min-h-[484px] flex-col gap-6 rounded-[14px] border border-[#E5E7EB] bg-white shadow-none transition-shadow hover:shadow-lg",
        stat: "min-w-0 flex-1 text-center",
        statInfo:
            "flex h-4 w-4 items-center justify-center rounded-full text-[#9CA3AF]",
        statInfoIcon: "h-3 w-3",
        statLabel: "text-[12px] font-normal leading-4 text-[#6B7280]",
        statLabelRow: "flex items-center justify-center gap-1",
        stats: "mt-auto flex items-start justify-center gap-10 pb-4 pt-1",
        statValue: "mt-0.5 text-[16px] font-semibold leading-6 text-[#111827]",
        title: "mb-2 text-[18px] font-semibold leading-7 text-[#111827]",
    },
    quizHistory: {
        archivedResult: "text-[12px] font-semibold text-[#6B7280]",
        action:
            "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#5140F0] px-5 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(81,64,240,0.18)] transition hover:bg-[#4635E7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0] focus-visible:ring-offset-2",
        actionIcon: "h-4 w-4",
        attemptBadge:
            "inline-flex h-6 items-center rounded-md border border-[#E5E7EB] bg-[#F7F8FB] px-2 text-[11px] font-bold text-[#667085]",
        badge: "!min-h-6 !px-2 !py-0.5 !text-[11px]",
        badgeRow: "mt-2.5 flex flex-wrap items-center gap-2",
        card:
            "flex flex-col gap-5 rounded-[14px] border border-[#E1E4EA] bg-white p-5 shadow-none transition duration-200 hover:border-[#C9CED8] hover:shadow-[0_12px_28px_rgba(17,24,39,0.07)] md:flex-row md:items-center md:justify-between",
        content: "flex min-w-0 items-start gap-4",
        icon: "flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#EAF7F5] text-[#0F766E]",
        iconGlyph: "h-5 w-5",
        meta: "mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-semibold text-[#667085]",
        metaIcon: "h-3.5 w-3.5 text-[#98A2B3]",
        page: "px-5 pb-12 md:px-9 lg:px-12",
        pageBack:
            "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#111827] transition hover:bg-white",
        pageBackIcon: "h-5 w-5",
        pageContainer: "mx-auto max-w-[1260px]",
        pageHeader: "mb-7 flex items-start gap-5",
        pageSubtitle: "mt-2 text-[14px] font-semibold leading-6 text-[#667085]",
        pageTitle: "text-[28px] font-extrabold leading-tight text-[#111827] md:text-[32px]",
        result: "flex items-center justify-between gap-4 md:shrink-0 md:justify-end",
        scoreRing: "relative h-[66px] w-[66px] shrink-0",
        scoreTrack: "stroke-[#ECEEF3]",
        scoreValue:
            "absolute inset-0 flex items-center justify-center text-[14px] font-extrabold text-[#111827]",
        title: "truncate text-[16px] font-extrabold text-[#111827]",
        empty:
            "rounded-[14px] border border-[#E1E4EA] bg-white px-8 py-16 text-center shadow-none",
        emptyIcon: "mx-auto mb-4 h-11 w-11 text-[#C9CED8]",
        emptyText: "text-[15px] font-extrabold text-[#111827]",
        emptyDescription: "mt-2 text-[13px] font-semibold text-[#737B8E]",
    },
    quizDetail: {
        page: "px-5 pb-16 md:px-9 lg:px-12",
        container: "mx-auto max-w-[1260px]",
        topActions: "mb-5 flex items-center justify-between",
        shell:
            "rounded-[18px] border border-[#E1E4EA] bg-white px-6 py-7 shadow-[0_1px_2px_rgba(17,24,39,0.03)] sm:px-8 sm:py-9",
        badgeRow: "flex flex-wrap items-center gap-2",
        description: "mt-4 text-[15px] font-medium leading-7 text-[#4B5563]",
        factsPanel: "mt-6 space-y-3 rounded-[14px] bg-[#F7F8FA] px-5 py-5",
        factIcon: "h-[18px] w-[18px] shrink-0 text-[#7A8494]",
        factRow: "flex items-center gap-3 text-[14px] text-[#374151]",
        factStrong: "font-extrabold",
        sectionTitle: "text-[16px] font-extrabold text-[#111827]",
        statsSection: "mt-7",
        statsGrid: "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
        statCell:
            "flex min-h-[112px] flex-col items-center justify-center rounded-[12px] border border-[#D9DDE5] bg-white px-4 py-4 text-center",
        statHelper: "mt-2 text-[11px] font-semibold text-[#7A8494]",
        statLabel: "text-[13px] font-bold text-[#4B5563]",
        statValue: "mt-2 text-[22px] font-extrabold leading-none",
        statValueAccent: "text-[#5140F0]",
        statValueDefault: "text-[#111827]",
        statValueMuted: "text-[#98A2B3]",
        methodPanel:
            "mt-6 flex flex-col gap-4 rounded-[14px] border border-[#E1E4EA] bg-[#FAFAFB] px-5 py-5 sm:flex-row sm:items-center sm:justify-between",
        methodText: "text-[14px] font-medium text-[#111827]",
        methodLink:
            "inline-flex shrink-0 items-center gap-2 text-[14px] font-extrabold text-[#5140F0] transition hover:text-[#4433D8]",
        methodLinkIcon: "h-4 w-4",
        stepsAccordion:
            "mt-6 overflow-hidden rounded-[14px] border border-[#E1E4EA] bg-white",
        stepsHeader:
            "flex min-h-[82px] flex-col gap-3 bg-[#FAFAFB] px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        stepsHeading: "text-[14px] font-medium text-[#6B7280]",
        stepsHeadingStrong: "font-bold text-[#111827]",
        stepsToggle:
            "inline-flex h-9 w-fit shrink-0 items-center gap-2 text-[14px] font-extrabold text-[#5140F0] transition hover:text-[#4433D8]",
        stepsToggleIcon: "h-4 w-4 transition-transform",
        stepsBody: "border-t border-[#E1E4EA] px-5 py-6",
        stepsDescription: "text-[14px] font-medium leading-6 text-[#6B7280]",
        stepList: "mt-5 space-y-3",
        stepItem: "overflow-hidden rounded-[12px] border border-[#D9DDE5] bg-white",
        stepItemHeader:
            "flex min-h-[62px] items-center gap-3 border-b border-[#D5DCFC] bg-[#EEF1FF] px-4 py-3",
        stepNumber:
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5140F0] text-[13px] font-extrabold text-white",
        stepTitle: "min-w-0 flex-1 text-[14px] font-bold leading-5 text-[#302B89]",
        stepWeight:
            "inline-flex h-7 shrink-0 items-center rounded-full border border-[#BFCBFF] bg-[#E7ECFF] px-2.5 text-[12px] font-bold text-[#5140F0]",
        stepCompetencies:
            "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3",
        stepCompetenciesLabel: "shrink-0 text-[12px] font-semibold text-[#98A2B3]",
        stepCompetencyList: "flex min-w-0 flex-wrap gap-2",
        stepCompetency:
            "inline-flex min-h-7 items-center gap-1.5 rounded-full border border-[#BFCBFF] bg-[#F4F6FF] px-3 py-1 text-[12px] font-semibold text-[#4338CA]",
        stepCompetencyIcon: "h-3.5 w-3.5 shrink-0 text-[#6F80FF]",
        stepCompetencyEmpty: "text-[12px] font-semibold text-[#98A2B3]",
        stepsEmpty: "mt-5 text-[13px] font-semibold text-[#98A2B3]",
        actions: "mt-7 flex flex-wrap gap-3",
        primaryAction:
            "flex h-11 items-center justify-center rounded-xl px-6 text-[14px] font-bold text-white transition",
        secondaryAction: "h-11 gap-2 px-5",
    },
    quizQuestionEditor: {
        actionIcon: "h-4 w-4",
        actions: "flex shrink-0 items-center gap-1",
        attachmentBadge:
            "inline-flex min-h-6 items-center gap-1.5 rounded-md border border-[#C9C2FB] bg-[#F4F3FE] px-2 text-[11px] font-bold text-[#5140F0]",
        body: "mt-4 space-y-4 border-t border-[#E5E7EB] pt-4",
        header: "flex items-start justify-between gap-3",
        identity: "min-w-0 flex-1",
        metadata: "mt-2 flex flex-wrap items-center gap-2",
        metadataBadge:
            "inline-flex min-h-6 items-center rounded-md border border-[#E5E7EB] bg-white px-2 text-[11px] font-bold text-[#667085]",
        metadataIcon: "h-3.5 w-3.5",
        prompt: "mt-1.5 truncate text-[13px] font-semibold text-[#4B5563]",
        title: "text-[14px] font-extrabold text-[#111827]",
    },
    detailField: {
        icon: "h-4 w-4",
        iconBox: "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F4F3FE] text-[#5140F0]",
        label: "text-[11px] font-bold uppercase text-[#8A91A0]",
        root: "flex min-w-0 items-start gap-3 py-3",
        value: "mt-1 break-words text-[13px] font-semibold leading-5 text-[#374151]",
    },
    entityDetails: {
        avatar: "flex h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-full border-[3px] border-[#E7EAFF] bg-[#F1F2F6]",
        avatarFallback: "flex h-full w-full items-center justify-center bg-[#F1F2F6]",
        avatarImage: "h-full w-full bg-cover bg-center",
        avatarInitials: "text-[24px] font-extrabold text-[#5140F0]",
        backgroundPreview:
            "h-[72px] w-[124px] overflow-hidden rounded-[10px] border border-[#E1E4EB] bg-[#F1F2F6] bg-cover bg-center shadow-[0_8px_18px_rgba(17,24,39,0.10)]",
        backgroundPreviewLabel:
            "mb-1.5 text-center text-[10px] font-bold uppercase tracking-[0.04em] text-[#8A91A0]",
        backgroundPreviewWrapper: "mt-1",
        dates: "hidden max-w-[190px] space-y-1.5 text-right sm:block",
        dateRow: "flex items-center justify-end gap-1.5 text-[11px] font-semibold text-[#737B8E]",
        content:
            "min-h-0 min-w-0 space-y-5 overflow-y-auto pr-2 [scrollbar-gutter:stable]",
        grid: "grid gap-x-6 sm:grid-cols-2",
        layout:
            "grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-6 md:grid-cols-[140px_minmax(0,1fr)] md:grid-rows-1",
        section: "border-t border-[#ECEEF3] pt-5 first:border-t-0 first:pt-0",
        sectionTitle: "mb-1 text-[14px] font-extrabold text-[#111827]",
        sidebar: "flex flex-col items-center gap-3",
    },
    toast: {
        actionButton:
            "!inline-flex !h-8 !items-center !justify-center !rounded-lg !border-0 !bg-[linear-gradient(135deg,#5140F0_0%,#7C3AED_100%)] !px-3 !font-bold !text-white !shadow-[0_6px_16px_rgba(81,64,240,0.24)] transition hover:!brightness-95",
        cancelButton:
            "!inline-flex !h-8 !items-center !justify-center !rounded-lg !border !border-[#E5E7EB] !bg-white/75 !px-3 !font-bold !text-[#4B5563] transition hover:!bg-white",
        closeButton:
            "!absolute !left-auto !right-2 !top-2 !flex !h-7 !w-7 !transform-none !cursor-pointer !items-center !justify-center !rounded-full !border !border-white/80 !bg-white/80 !p-0 !text-[#6B7280] !opacity-70 !shadow-[0_4px_12px_rgba(17,24,39,0.08)] !backdrop-blur-md transition hover:!border-white hover:!text-[#111827] hover:!opacity-100",
        content: "!flex !min-w-0 !flex-1 !flex-col !gap-1 !pr-4",
        description: "!text-[12px] !font-semibold !leading-[18px] !text-current !opacity-80",
        icon: "h-[18px] w-[18px]",
        iconSlot:
            "!m-0 !flex !h-9 !w-9 !shrink-0 !items-center !justify-center !rounded-[10px] !border !border-white/90 !bg-white/70 !text-current !shadow-[0_6px_16px_rgba(17,24,39,0.08)]",
        loadingIcon: "h-[18px] w-[18px] animate-spin",
        root:
            "!relative !flex !w-full !items-start !gap-3 !overflow-hidden !rounded-[14px] !border !px-4 !py-4 !shadow-[0_18px_46px_rgba(17,24,39,0.16)] transition-shadow data-[type=action]:!border-[#E5E7EB] data-[type=action]:!bg-white data-[type=action]:!text-[#111827] data-[type=default]:!border-[#E5E7EB] data-[type=default]:!bg-white data-[type=default]:!text-[#111827] data-[type=normal]:!border-[#E5E7EB] data-[type=normal]:!bg-white data-[type=normal]:!text-[#111827] hover:!shadow-[0_22px_54px_rgba(17,24,39,0.20)]",
        title: "!text-[14px] !font-extrabold !leading-5 !tracking-normal !text-current",
        tone: {
            error:
                "!border-[var(--feedback-danger-border)] !bg-[var(--feedback-danger-surface)] !text-[var(--feedback-danger-foreground)]",
            info:
                "!border-[var(--feedback-info-border)] !bg-[var(--feedback-info-surface)] !text-[var(--feedback-info-foreground)]",
            loading:
                "!border-[#DDD6FE] !bg-[#F5F3FF] !text-[#5140F0]",
            success:
                "!border-[var(--feedback-success-border)] !bg-[var(--feedback-success-surface)] !text-[var(--feedback-success-foreground)]",
            warning:
                "!border-[var(--feedback-warning-border)] !bg-[var(--feedback-warning-surface)] !text-[var(--feedback-warning-foreground)]",
        },
    },
    voice: {
        field: "flex min-w-0 items-center gap-2",
        previewButton:
            "flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 text-[13px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        previewButtonActive: "border-[#C9C2FB] bg-[#F4F3FE] text-[#5140F0]",
        previewButtonIdle: "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#C9C2FB] hover:text-[#5140F0]",
        previewIcon: "h-4 w-4 shrink-0",
        recommendedBadge: "inline-flex h-6 items-center rounded-lg border px-2.5 text-[11px] font-bold",
        select: "min-w-0 flex-1",
    },
    coachCard: {
        badge: "inline-flex h-7 max-w-[190px] items-center rounded-lg border px-2.5 text-[12px] font-bold",
        badgeDivider: "mx-auto h-[3px] w-16 rounded-full bg-[#E5E7EB]",
        badgeLabel: "min-w-0 truncate",
        badgesContainer: "mt-3 space-y-4",
        certificationBadge: "border-[#E5E7EB] bg-[#F7F8FB] text-[#4B5563]",
        diplomaBadge: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
        discBadge: "h-7 px-2.5 text-[12px]",
        expertiseBadge: "border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9]",
        primaryBadges: "flex flex-wrap items-center justify-center gap-2",
        profileBadges: "flex flex-wrap items-center justify-center gap-2",
        root:
            "relative cursor-pointer overflow-hidden rounded-[14px] border border-[#E1E4EB] bg-cover bg-center bg-no-repeat px-5 pb-6 pt-5 text-center shadow-none transition duration-200 hover:-translate-y-0.5 hover:border-[#D8DCE6] hover:shadow-[0_14px_34px_rgba(17,24,39,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0]/40",
        styleBadge: "border-[#E5E7EB] bg-white text-[#111827]",
    },
    progress: {
        /** Remplissage couleur primaire (défaut). */
        fill: "absolute inset-y-0 left-0 rounded-full bg-[#5140F0]",
        /** Remplissage sans couleur — la teinte est fournie en style inline (ex. par niveau). */
        fillBase: "absolute inset-y-0 left-0 rounded-full",
        track: "relative h-1.5 overflow-hidden rounded-full bg-[#E5E7EB]",
    },
    avatarSource: {
        controls: "min-w-0 space-y-4",
        gallery: "grid grid-cols-3 gap-3 sm:grid-cols-6",
        galleryImage: "absolute inset-0 bg-cover bg-center",
        galleryOption: "relative aspect-square min-w-0 overflow-hidden rounded-xl border-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0]/40",
        galleryOptionActive: "border-[#5140F0] shadow-[0_8px_18px_rgba(81,64,240,0.20)]",
        galleryOptionIdle: "border-transparent hover:border-[#E5E7EB]",
        initials: "text-[24px] font-extrabold text-[#5140F0]",
        layout: "grid gap-6 md:grid-cols-[132px_minmax(0,1fr)] md:items-start",
        preview: "flex h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-full border-[3px] border-[#E7DCFB] bg-[#F1F2F6] shadow-[0_8px_18px_rgba(139,47,214,0.18)]",
        previewColumn: "flex flex-col items-center gap-2",
        previewImage: "h-full w-full bg-cover bg-center",
        previewLabel: "text-[12px] font-semibold text-[#9CA3AF]",
        removeButton: "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-semibold text-[#6B7280] transition hover:bg-[#FEF2F2] hover:text-[#DC2626] disabled:cursor-not-allowed disabled:opacity-60",
        removeIcon: "h-3.5 w-3.5",
    },
    interaction: {
        button: "cursor-pointer disabled:cursor-not-allowed",
    },
    dataTable: {
        cell: "px-6 py-4",
        cellNowrap: "whitespace-nowrap",
        emptyCell: "py-12 text-center",
        frame: "overflow-hidden rounded-xl border border-[#E5E7EB] bg-white",
        groupHeader: {
            button:
                "flex w-full items-center gap-2 text-left transition-colors hover:text-[#374151]",
            cell: "px-6 py-3",
            icon: "h-4 w-4 shrink-0 text-[#4B5563]",
            label: "text-[14px] font-medium leading-5 text-[#111827]",
            layout: "flex items-center gap-2",
            row: "border-b border-[#E5E7EB] bg-[#F9FAFB]",
        },
        header: "border-b border-[#E5E7EB] bg-[#F9FAFB]",
        headerCell:
            "px-6 py-3 text-left text-[12px] font-medium uppercase tracking-wider text-[#6B7280]",
        headerInfoButton:
            "inline-flex h-5 w-5 items-center justify-center rounded-full text-[#6B7280]",
        headerInfoIcon: "h-3.5 w-3.5",
        headerLabelWithInfo: "inline-flex items-center gap-1.5",
        row: "transition-colors hover:bg-[#F9FAFB]",
        scroll: "overflow-x-auto",
        table: "w-full",
        text: {
            body: "text-[14px] font-normal text-[#111827]",
            muted: "text-[14px] font-normal text-[#9CA3AF]",
            primary: "text-[14px] font-medium text-[#111827]",
            secondary: "text-[14px] font-normal text-[#4B5563]",
        },
        width: {
            extraWide: "min-w-[1030px]",
            standard: "min-w-[720px]",
            wide: "min-w-[900px]",
        },
    },
    organizations: {
        page: "px-4 pb-12 sm:px-6",
        container: "mx-auto max-w-7xl space-y-6 pt-6",
        error:
            "rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] font-medium text-[#B91C1C]",
        header: {
            root:
                "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
            titleGroup: "flex min-w-0 items-center gap-3",
            back:
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-white hover:text-[#111827]",
            backIcon: "h-4 w-4",
            title:
                "text-[20px] font-medium leading-[30px] text-[#6B7280]",
            create:
                "inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg bg-[#4F46E5] px-6 py-2.5 text-[14px] font-medium leading-5 text-white transition-colors hover:bg-[#4338CA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2 sm:self-auto",
            createIcon: "h-4 w-4",
        },
        filter: {
            surface:
                "rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-none",
            layout:
                "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center",
            search: "relative min-w-0 flex-1 sm:min-w-[300px]",
            searchIcon:
                "pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]",
            searchInput:
                "h-9 border-[#E5E7EB] bg-[#F9FAFB] py-1 pl-9 pr-3 text-[14px] font-normal text-[#111827] shadow-none placeholder:text-[#9CA3AF] focus:bg-[#F9FAFB] focus:ring-0",
            status: "w-full sm:w-40",
        },
        table: {
            row: "border-b border-[#E5E7EB] last:border-b-0",
            companyCell: "whitespace-nowrap",
            companyLayout: "flex items-center gap-3",
            companyIcon:
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E0E7FF] text-[#4F46E5]",
            companyIconGlyph: "h-4 w-4",
            centerCell: "text-center",
            statusCell: "text-center",
            actionsCell: "text-center",
            actions: "flex justify-center gap-2 text-[#4B5563]",
            action:
                "inline-flex h-7 w-7 items-center justify-center rounded text-[#4B5563] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-1",
            actionIcon: "h-4 w-4",
            emptyCell: "h-[260px] px-6 py-12",
            emptyContent:
                "flex flex-col items-center justify-center text-center",
            emptyIcon: "mb-4 h-12 w-12 text-[#D1D5DB]",
            emptyTitle:
                "text-[14px] font-medium leading-5 text-[#111827]",
            emptyDescription:
                "mt-2 text-[14px] font-normal text-[#9CA3AF]",
            footer:
                "flex flex-col gap-4 border-t border-[#E5E7EB] px-6 py-4 sm:flex-row sm:items-center sm:justify-between",
            footerText:
                "text-[14px] font-normal leading-5 text-[#6B7280]",
            pagination: "flex items-center gap-2",
            paginationButton:
                "inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-[#E5E7EB] bg-white px-3 text-[14px] font-medium text-[#6B7280] transition-colors hover:bg-[#F9FAFB] hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-1",
            paginationActive:
                "inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-[#4F46E5] px-3 text-[14px] font-medium text-white",
            paginationIcon: "h-4 w-4",
        },
        status: {
            base:
                "inline-flex items-center rounded-md px-2.5 py-1 text-[12px] font-normal leading-4",
            active: "bg-[#DCFCE7] text-[#15803D]",
            suspended: "bg-[#F3F4F6] text-[#4B5563]",
        },
    },
    organizationDetail: {
        page: "px-4 pb-12 sm:px-6",
        container: "mx-auto max-w-7xl space-y-6 pt-6",
        surface:
            "overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-none",
        header: {
            root:
                "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
            titleGroup: "flex min-w-0 items-center gap-4",
            back:
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#111827] transition-colors hover:bg-white/80",
            backIcon: "h-4 w-4",
            title:
                "truncate text-[24px] font-medium leading-9 text-[#111827]",
            actions: "flex flex-wrap items-center gap-3",
            action:
                "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-[14px] font-medium leading-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            actionIcon: "h-4 w-4",
            cancel:
                "border border-[#D1D5DB] bg-white text-[#374151] hover:bg-[#F9FAFB] focus-visible:ring-[#6B7280]",
            primary:
                "bg-[#4F46E5] text-white hover:bg-[#4338CA] focus-visible:ring-[#4F46E5]",
            danger:
                "bg-[#DC2626] text-white hover:bg-[#B91C1C] focus-visible:ring-[#DC2626]",
        },
        tabs: {
            scroll: "overflow-x-auto border-b border-[#E5E7EB]",
            list: "flex min-w-max gap-8 px-6",
            item:
                "shrink-0 border-b-2 py-4 text-[14px] font-medium leading-5 transition-colors",
            active: "border-[#4F46E5] text-[#4F46E5]",
            idle:
                "border-transparent text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#374151]",
        },
        content: {
            root: "p-6",
            sectionHeader:
                "mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
            sectionTitle:
                "text-[16px] font-semibold leading-6 text-[#111827]",
            standaloneTitle:
                "mb-6 text-[16px] font-semibold leading-6 text-[#111827]",
            subtleAction:
                "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#E0E7FF] px-6 py-2.5 text-[14px] font-medium leading-5 text-[#4338CA] transition-colors hover:bg-[#C7D2FE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2",
            subtleActionIcon: "h-4 w-4",
            error:
                "mb-5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] font-medium text-[#B91C1C]",
            success:
                "mb-5 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-[13px] font-medium text-[#15803D]",
            loading: "text-[14px] font-normal text-[#6B7280]",
            emptyTitle:
                "text-[14px] font-medium leading-5 text-[#111827]",
            emptyDescription:
                "mt-2 text-[14px] font-normal leading-5 text-[#9CA3AF]",
        },
        overview: {
            form: "p-6",
            baseLayout:
                "flex flex-col gap-6 md:flex-row md:items-start",
            icon:
                "flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[#E0E7FF] text-[#4F46E5]",
            iconGlyph: "h-10 w-10",
            detailGrid:
                "grid min-w-0 flex-1 gap-6 md:grid-cols-2",
            section:
                "mt-6 border-t border-[#E5E7EB] pt-6",
            sectionTitle:
                "mb-4 text-[16px] font-semibold leading-6 text-[#111827]",
            sectionGrid: "grid gap-6 md:grid-cols-2",
            label:
                "text-[14px] font-medium leading-5 text-[#111827]",
            value:
                "mt-1 text-[14px] font-normal leading-5 text-[#4B5563]",
            status:
                "mt-1 inline-flex items-center rounded-md px-2.5 py-1 text-[12px] font-normal leading-4",
            statusActive: "bg-[#DCFCE7] text-[#15803D]",
            statusSuspended: "bg-[#F3F4F6] text-[#4B5563]",
            editField: "space-y-1.5",
            editLabel:
                "text-[14px] font-medium leading-5 text-[#111827]",
            editControl:
                "h-9 rounded-lg border-[#D1D5DB] bg-white px-3 text-[14px] font-normal text-[#111827] shadow-none focus:ring-2",
            editControlError:
                "border-[#F87171] ring-2 ring-[#FEE2E2]",
            editError:
                "text-[12px] font-medium leading-4 text-[#B91C1C]",
            editSelectWrapper: "relative",
            selectIcon:
                "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]",
        },
        groupOverview: {
            error:
                "rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] font-medium text-[#B91C1C] md:col-span-2",
            fullSpan: "md:col-span-2",
            grid: "grid gap-6 md:grid-cols-2",
            readGrid: "grid gap-6 p-6 md:grid-cols-2",
            textArea:
                "min-h-[112px] w-full resize-none rounded-lg border border-[#D1D5DB] bg-white px-3 py-2.5 text-[14px] font-normal leading-5 text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15",
        },
        table: {
            row: "border-b border-[#E5E7EB] last:border-b-0",
            companyLayout: "flex items-center gap-3",
            groupIcon:
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E0E7FF] text-[#4F46E5]",
            groupIconGlyph: "h-4 w-4",
            userAvatar:
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6]",
            userInitials:
                "text-[12px] font-medium leading-4 text-[#4B5563]",
            roleBadge:
                "inline-flex items-center rounded-md border border-[#D1D5DB] bg-transparent px-2.5 py-1 text-[12px] font-normal leading-4 text-[#374151]",
            statusBadge:
                "inline-flex items-center rounded-md bg-[#DCFCE7] px-2.5 py-1 text-[12px] font-normal leading-4 text-[#15803D]",
            actions: "flex items-center gap-2",
            action:
                "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-[#9CA3AF] transition-colors hover:bg-[#EEF2FF] hover:text-[#4F46E5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60",
            dangerAction:
                "hover:bg-[#FEF2F2] hover:text-[#DC2626] focus-visible:ring-[#DC2626]",
            actionIcon: "h-4 w-4",
            actionLoading: "animate-spin",
            activityGroup: "flex items-center gap-2",
            activityGroupIcon: "h-4 w-4 shrink-0 text-[#4F46E5]",
            personaBadge:
                "inline-flex items-center rounded-full bg-[#E0E7FF] px-2.5 py-0.5 text-[12px] font-medium leading-4 text-[#4338CA]",
            evaluationBadge:
                "inline-flex items-center rounded-full bg-[#DBEAFE] px-2.5 py-0.5 text-[12px] font-medium leading-4 text-[#1D4ED8]",
        },
    },
    userDetail: {
        action: {
            cancel:
                "flex h-[42px] items-center justify-center gap-2.5 rounded-[10px] border border-[#DADDE4] bg-white px-5 text-[15px] font-extrabold text-[#111827] transition hover:bg-[#F7F8FB]",
            icon: "h-4 w-4",
            light:
                "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#E0E7FF] px-6 text-[14px] font-medium text-[#4338CA] transition hover:bg-[#C7D2FE] disabled:cursor-not-allowed disabled:opacity-60",
            primary:
                "flex h-[42px] items-center justify-center gap-2.5 rounded-[10px] bg-[#5140F0] px-5 text-[15px] font-extrabold text-white shadow-[0_12px_24px_rgba(81,64,240,0.22)] transition hover:bg-[#4635E7]",
            primaryWide:
                "flex h-[42px] items-center justify-center gap-3 rounded-[10px] bg-[#5140F0] px-5 text-[15px] font-extrabold text-white shadow-[0_12px_24px_rgba(81,64,240,0.22)] transition hover:bg-[#4635E7]",
        },
        aiInteraction: {
            card: "rounded-lg border border-[#E5E7EB] bg-white p-4",
            cardGrid: "grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
            cardIcon: "mb-3 flex h-8 w-8 items-center justify-center rounded-lg",
            cardLabel: "text-[13px] font-normal text-[#6B7280]",
            cardValue: "mb-1 text-[20px] font-semibold leading-7 text-[#111827]",
            content: "space-y-6 p-6",
            icon: "h-4 w-4",
            tableTypeLayout: "flex items-center gap-2",
            tone: {
                askPersona: {
                    card: "bg-[#DBEAFE] text-[#2563EB]",
                    table: "text-[#3B82F6]",
                },
                coach: {
                    card: "bg-[#F3E8FF] text-[#9333EA]",
                    table: "text-[#A855F7]",
                },
                simulation: {
                    card: "bg-[#E0E7FF] text-[#4F46E5]",
                    table: "text-[#6366F1]",
                },
                total: {
                    card: "bg-[#F3F4F6] text-[#4B5563]",
                },
            },
        },
        card: "overflow-hidden rounded-xl border border-[#E5E7EB] shadow-none",
        header: {
            back:
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#111827] transition hover:bg-white",
            title:
                "text-[26px] font-extrabold tracking-[-0.03em] text-[#171B2A]",
        },
        groupHeader: {
            button:
                "flex w-full items-center gap-2 text-left text-[14px] font-medium text-[#111827] transition-colors hover:text-[#374151]",
            cell: "px-6 py-3",
            icon: "h-4 w-4 text-[#4B5563]",
            row: "bg-[#F9FAFB]",
        },
        group: {
            error:
                "mb-5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] font-semibold text-[#991B1B]",
            icon: "flex h-9 w-9 items-center justify-center rounded-lg bg-[#E0E7FF] text-[#4F46E5]",
            iconGlyph: "h-5 w-5",
            nameLayout: "flex items-center gap-4",
            removeAction:
                "inline-flex items-center gap-2 text-[14px] font-medium text-[#DC2626] transition hover:text-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60",
            removeIcon: "h-4 w-4",
        },
        pill: {
            group:
                "inline-flex h-[28px] items-center rounded-full border border-[#C8D2FF] bg-[#E8ECFF] px-4 text-[13px] font-extrabold text-[#5140F0]",
            persona:
                "inline-flex items-center rounded-md border border-[#C7D2FE] bg-[#EEF2FF] px-2.5 py-1 text-[12px] font-normal text-[#4338CA]",
            quiz:
                "inline-flex items-center rounded-md border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-[12px] font-normal text-[#1D4ED8]",
            score: "inline-flex items-center justify-center rounded-md px-2.5 py-1 text-[12px] font-semibold",
            scoreEmpty: "text-[14px] font-normal italic text-[#9CA3AF]",
            scoreSuccess: "bg-[#D1FAE5] text-[#047857]",
            scoreWarning: "bg-[#FEF3C7] text-[#B45309]",
        },
        profile: {
            avatar:
                "flex h-[92px] w-[92px] items-center justify-center rounded-full bg-[#E4E6EB] text-[#344054]",
            divider: "mt-8 border-t border-[#DDE1E8] pt-7",
            empty: "text-[14px] font-semibold text-[#8C94A4]",
            fieldLabel: "text-[14px] font-extrabold text-[#171B2A]",
            infoLabel: "text-[15px] font-extrabold leading-6 text-[#171B2A]",
            infoValue:
                "mt-1.5 text-[15px] font-semibold leading-6 text-[#4F5868]",
            input:
                "h-10 rounded-[8px] border border-[#D6DAE3] bg-white text-[14px] font-semibold text-[#4F5868] shadow-none",
            role:
                "inline-flex h-[28px] items-center rounded-[8px] border border-[#CBD2DC] bg-white px-3 text-[13px] font-semibold text-[#344054]",
            sectionTitle:
                "text-[20px] font-extrabold tracking-[-0.02em] text-[#171B2A]",
            selectChevron:
                "pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8C94A4]",
            status: {
                active: "bg-[#DDF8E6] text-[#17A34A]",
                base:
                    "inline-flex h-[28px] items-center rounded-[9px] px-3 text-[13px] font-bold",
                inactive: "bg-[#F1F2F5] text-[#697184]",
                pending: "bg-[#FFF3D6] text-[#B77900]",
            },
        },
        section: {
            content: "p-6",
            heading: "text-[16px] font-semibold text-[#111827]",
            headingRow:
                "mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
        },
        skill: {
            acquired:
                "inline-flex items-center rounded bg-[#DCFCE7] px-2 py-0.5 text-[12px] font-semibold text-[#166534]",
            delta: "whitespace-nowrap text-[14px] font-bold text-[#0D9488]",
            detailCell: "px-6 py-4",
            detailRow: "border-b border-[#E5E7EB] bg-[#F9FAFB]",
            detailSummary:
                "flex min-w-0 flex-wrap gap-2 rounded-xl border border-[#E6E9F0] bg-white p-4",
            initialLabel: "text-[12px] font-normal text-[#6B7280]",
            initialValue: "font-semibold",
            nameHeader: "w-1/4",
            name: "max-w-[250px] text-[14px] font-medium text-[#111827]",
            nameCell: "px-6 py-4",
            nameLayout: "flex items-center gap-3",
            progressCell: "px-6 py-4",
            progressLayout: "flex items-center gap-4",
            progressMeta: "flex items-center gap-3 whitespace-nowrap",
            progressMiddle: "flex min-w-0 flex-1 items-center gap-3",
            progressTrack: "relative h-2 flex-1 overflow-hidden rounded-full bg-[#E5E7EB]",
            progressInitial: "absolute left-0 top-0 h-full bg-[#D1D5DB]",
            progressValue: "absolute left-0 top-0 h-full",
            row:
                "cursor-pointer border-b border-[#E5E7EB] transition-colors hover:bg-[#F9FAFB]",
            score:
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-[14px] font-bold",
            scoreNeutral: "bg-[#F3F4F6] text-[#6B7280]",
            scoreSuccess: "bg-[#D1FAE5] text-[#047857]",
            scoreWarning: "bg-[#FEF3C7] text-[#B45309]",
            statusDot: "h-2 w-2 shrink-0 rounded-full",
            tableFrame: "rounded-lg",
            chevron: "h-4 w-4 shrink-0 text-[#9CA3AF]",
        },
        tabs: {
            active: "border-[#4F46E5] text-[#4F46E5]",
            idle:
                "border-transparent text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#374151]",
            item: "border-b-2 py-4 text-[14px] font-medium transition-colors",
            list: "flex min-w-max gap-8 px-6",
            scroll: "overflow-x-auto border-b border-[#E5E7EB]",
        },
    },
    organizationInvitation: {
        confirmation: {
            actions: "grid gap-3 sm:grid-cols-2",
            body: "space-y-5",
            callout: "flex gap-3 rounded-xl border p-4",
            calloutIcon: "mt-0.5 h-5 w-5 shrink-0",
            calloutText: "text-[13px] font-semibold leading-6",
            confirmButton:
                "flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-[14px] font-bold text-white transition disabled:opacity-70",
            confirmIcon: "h-4 w-4",
            panel: "max-w-[500px]",
        },
        detailAction:
            "flex h-[42px] items-center justify-center gap-2.5 rounded-[10px] border border-[#C9C2FB] bg-white px-5 text-[14px] font-extrabold text-[#5140F0] transition hover:bg-[#F4F3FE]",
        detailActionIcon: "h-5 w-5",
    },
    action: {
        addButton:
            "flex h-9 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]",
        cardMenuOpen: "z-30",
        backButton:
            "flex h-10 w-fit items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 text-[14px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]",
        backLink:
            "inline-flex items-center gap-2 text-[14px] font-semibold text-[#4B5563] transition hover:text-[#111827]",
        addDashed:
            "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#D5D7DE] bg-white px-3 text-[13px] font-semibold text-[#6B7280] transition hover:border-[#5140F0] hover:bg-[#F4F3FE] hover:text-[#5140F0]",
        dangerIconButton:
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#FEF2F2] hover:text-[#DC2626]",
        dangerButton:
            "flex h-11 items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-6 text-[14px] font-bold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-70",
        iconButton:
            "flex h-7 w-7 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#374151] transition hover:border-[#D5D7DE] hover:text-[#5140F0]",
        iconButtonGhost:
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-white hover:text-[#111827]",
        listRemoveButton:
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#F3F4F8] hover:text-[#111827]",
        menuItem:
            "flex h-9 w-full min-w-0 items-center justify-start gap-2 rounded-md px-3 text-left text-[13px] font-semibold transition hover:bg-[#F6F7FB]",
        menuPanel: "rounded-lg border border-[#E5E7EB] bg-white shadow-[0_18px_40px_rgba(17,24,39,0.16)]",
        menuPopover: "z-40",
        primaryButton:
            "bg-[#5140F0] shadow-[0_10px_20px_rgba(81,64,240,0.18)] hover:bg-[#4635E7]",
        primaryButtonDisabled: "cursor-not-allowed bg-[#B9B2F8]",
        primaryFullButton:
            "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#5140F0] text-[15px] font-bold text-white shadow-[0_16px_30px_rgba(81,64,240,0.22)] transition hover:bg-[#4735EA] disabled:cursor-not-allowed disabled:opacity-70",
        secondaryButton:
            "flex h-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-6 text-[14px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]",
        accentSecondaryButton:
            "flex h-9 items-center justify-center gap-2 rounded-lg border border-[#C9C2FB] bg-white px-3 text-[13px] font-bold text-[#5140F0] transition hover:border-[#5140F0] hover:bg-[#F4F3FE]",
        successButton:
            "bg-[#16A34A] text-white shadow-[0_12px_24px_rgba(22,163,74,0.22)] hover:bg-[#15803D]",
        stepRemoveButton:
            "flex h-7 w-7 items-center justify-center rounded-lg text-[#9CA3AF] transition hover:bg-[#F3F4F8] hover:text-[#111827]",
    },
    resourceDetailHeader: {
        actions: "flex flex-wrap items-center gap-2",
        archiveButton:
            "flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#DC2626] px-3 text-[13px] font-semibold text-white transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-70",
        backLink:
            "inline-flex items-center gap-2 text-[14px] font-semibold text-[#4B5563] transition hover:text-[#111827]",
        editButton:
            "flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]",
        icon: "h-4 w-4",
        root:
            "mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
    },
    form: {
        control:
            "h-9 w-full rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 text-[14px] font-normal text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5140F0] focus:bg-white focus:ring-4 focus:ring-[#5140F0]/10",
        controlError:
            "border-[#DC2626] bg-[#FEF2F2] focus:border-[#DC2626] focus:ring-[#DC2626]/10",
        controlWhite:
            "h-9 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-[14px] font-normal text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5140F0] focus:ring-4 focus:ring-[#5140F0]/10",
        controlReadonly:
            "h-9 w-full cursor-default rounded-lg border border-[#E9E7FB] bg-[#F4F3FE] px-3 text-[14px] font-medium text-[#374151] outline-none",
        readonlySelection:
            "flex min-h-12 w-full cursor-default items-center gap-3 rounded-lg border border-[#E9E7FB] bg-[#F4F3FE] px-3.5 py-2 text-[14px] font-medium text-[#374151]",
        label: "mb-2 block text-[14px] font-bold text-[#111827]",
        helpText: "text-[13px] font-medium leading-5 text-[#6B7280]",
        errorMessage: "mt-1.5 text-[12px] font-semibold leading-4 text-[#DC2626]",
        fieldErrorPanel: "rounded-xl border border-[#FECACA] bg-[#FEF2F2]/40 p-3",
        subLabel: "mb-1.5 block text-[13px] font-bold text-[#374151]",
        textArea:
            "w-full resize-none rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 py-3 text-[14px] font-normal text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5140F0] focus:bg-white focus:ring-4 focus:ring-[#5140F0]/10",
        textAreaEditor: "min-h-0 flex-1 resize-none bg-white leading-6",
        textAreaLarge: "min-h-[220px] leading-6",
        textAreaMedium: "min-h-[96px]",
        textAreaWhite:
            "min-h-[72px] w-full resize-none rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[14px] font-normal text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#5140F0] focus:ring-4 focus:ring-[#5140F0]/10",
    },
    dateRangeFilter: {
        container: "grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2",
        field: "flex h-11 min-w-0 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 transition focus-within:border-[#5140F0] focus-within:ring-4 focus-within:ring-[#5140F0]/10 hover:border-[#D5D7DE]",
        input: "min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#374151] outline-none [color-scheme:light]",
        prefix: "shrink-0 text-[11px] font-bold uppercase text-[#9CA3AF]",
    },
    filterSelect: {
        check: "h-4 w-4 shrink-0 text-[#5140F0]",
        chevron: "ml-auto h-4 w-4 shrink-0 text-[#9CA3AF] transition-transform",
        container: "relative min-w-0",
        menu: "absolute left-0 right-0 z-30 max-h-[260px] overflow-y-auto rounded-xl border border-[#E5E7EB] p-1.5 shadow-[0_18px_40px_rgba(17,24,39,0.16)]",
        menuOffset: {
            default: "top-[48px]",
            library: "top-[44px]",
        },
        option: "flex min-h-10 w-full min-w-0 items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[14px] font-medium transition hover:bg-[#F6F7FB]",
        optionActive: "text-[#5140F0]",
        optionIdle: "text-[#111827]",
        optionLabel: "min-w-0 flex-1 whitespace-normal break-words leading-5",
        trigger:
            "flex w-full min-w-0 items-center justify-between gap-2 border border-[#E5E7EB] text-[14px] text-[#111827] transition hover:border-[#D5D7DE]",
        triggerAppearance: {
            default: "h-11 rounded-lg bg-white px-3.5 font-medium",
            library: "h-9 rounded-lg bg-[#F9FAFB] px-3 py-2 font-normal",
        },
        triggerLabel: "min-w-0 flex-1 truncate text-left",
    },
    filterBar: {
        activeCount: "inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#5140F0] px-1.5 text-[11px] font-bold text-white",
        controls: "grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4",
        header: "mb-3 flex flex-wrap items-center justify-between gap-3",
        libraryControls: "flex min-w-0 flex-wrap items-center gap-3",
        librarySearch: "min-w-[200px] flex-1",
        librarySearchInput:
            "!h-10 !bg-[#F9FAFB] !py-1 !pl-9 text-[14px] font-normal focus:!bg-[#F9FAFB] focus:!ring-0",
        librarySelectCategory: "w-[188px]",
        librarySelectDomain: "w-[180px]",
        librarySelectLevel: "w-[156px]",
        librarySelectQuizLevel: "w-[160px]",
        librarySelectScorecardDomain: "w-[192px]",
        librarySelectStatus: "w-[160px]",
        librarySelectType: "w-[180px]",
        librarySurface:
            "mb-7 rounded-[14px] border border-[#E5E7EB] bg-white p-4 shadow-none",
        resetButton: "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-[#6B7280] transition hover:bg-[#F4F3FE] hover:text-[#5140F0]",
        resetIcon: "h-3.5 w-3.5",
        surface: "mb-7 rounded-[16px] border border-[#E9E7FB] p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]",
        title: "flex items-center gap-2 text-[13px] font-bold text-[#374151]",
        titleIcon: "h-4 w-4 text-[#5140F0]",
    },
    inputIcon: {
        default:
            "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400",
        library:
            "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]",
    },
    radio: {
        dot: "h-2.5 w-2.5 rounded-full bg-[#5140F0]",
        option: "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition",
        optionIdle: "border-[#E5E7EB] bg-white hover:border-[#D5D7DE]",
        optionSelected: "border-[#5140F0] bg-[#F4F3FE]",
        ring: "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition",
        ringIdle: "border-[#9CA3AF]",
        ringSelected: "border-[#5140F0]",
    },
    reviewAnswer: {
        card: "flex w-full items-start gap-3 rounded-[14px] border px-4 py-3.5 text-left transition",
        correct: "border-[#16A34A] bg-[#F0FDF4] shadow-[inset_0_0_0_1px_#16A34A]",
        explanationCard: "mt-5 rounded-[14px] border border-[#FDE68A] bg-[#FFFBEA] p-4",
        explanationHeader: "flex items-center gap-2 text-[13px] font-extrabold text-[#BB4D00]",
        explanationIcon: "h-4 w-4 shrink-0 text-[#BB4D00]",
        explanationText: "mt-1 text-[14px] font-medium leading-6 text-[#BB4D00]",
        idle: "border-[#E5E7EB] bg-white hover:border-[#D5D7DE]",
        indicator: "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 transition",
        indicatorCorrect: "border-[#16A34A] bg-white",
        indicatorIdle: "border-[#9CA3AF]",
        indicatorIncorrect: "border-[#EF4444] bg-white",
        indicatorSelected: "border-[#5140F0]",
        incorrect: "border-[#DC2626] bg-[#FEF2F2] shadow-[inset_0_0_0_1px_#DC2626]",
        selected: "border-[#5140F0] bg-[#F4F3FE]",
    },
    roleplayDetail: {
        infoCardTitle: "text-[18px] font-medium text-[#5140F0]",
        preparationCardTitle: "text-[16px] font-medium text-[#5140F0]",
        quickLink:
            "inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold text-[#4B5563] transition hover:border-[#C9C2FB] hover:text-[#5140F0]",
        quickLinkIcon: "h-4 w-4 text-[#9CA3AF]",
        title: "mt-6 text-center text-[18px] font-extrabold leading-6 text-[#5140F0]",
        trainingDisabled:
            "flex h-12 items-center justify-center gap-2 rounded-xl bg-[#B9B2F8] px-6 text-[15px] font-bold text-white disabled:cursor-not-allowed",
        trainingPrimary:
            "flex h-12 items-center justify-center rounded-xl bg-[#5140F0] px-6 text-[15px] font-bold text-white shadow-[0_12px_24px_rgba(81,64,240,0.24)] transition hover:bg-[#4635E7]",
        trainingSecondary:
            "flex h-12 items-center justify-center rounded-xl border border-[#C9C2FB] bg-white px-6 text-[15px] font-bold text-[#5140F0] transition hover:bg-[#F4F3FE]",
    },
    roleplayEvaluation: {
        aiActionButton:
            "flex h-9 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold text-[#374151] transition hover:border-[#D5D7DE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0] focus-visible:ring-offset-2",
        aiActionIcon: "h-4 w-4 text-[#5140F0]",
        sessionOverview: {
            aiBadge:
                "inline-flex h-5 items-center rounded-md bg-[#EEF0FF] px-1.5 text-[10px] font-bold text-[#5140F0]",
            categoryBadge:
                "inline-flex min-h-9 w-fit shrink-0 items-center rounded-lg px-3.5 text-[13px] font-bold",
            detailCard:
                "rounded-[16px] border border-[#E1E4EA] p-6 shadow-none lg:min-h-[310px]",
            detailHeader: "flex items-center gap-3",
            detailIcon: "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            detailIconGlyph: "h-5 w-5",
            detailTitle: "min-w-0 text-[18px] font-bold text-[#111827]",
            difficultyBadge:
                "inline-flex h-6 items-center rounded-md border px-2 text-[11px] font-bold",
            discBadge: "h-6 rounded-md border-0 px-2 text-[11px] uppercase",
            grid:
                "grid gap-4 lg:grid-cols-[minmax(0,2.4fr)_minmax(270px,1fr)]",
            metadataCard:
                "flex min-h-[88px] flex-col justify-center gap-4 rounded-[14px] border border-[#E1E4EA] bg-[#F7F8FB] px-5 py-4 shadow-none md:flex-row md:items-center md:justify-between",
            metadataIcon: "h-[18px] w-[18px] text-[#7A8494]",
            metadataItem: "flex items-center gap-2",
            metadataList:
                "flex flex-wrap items-center gap-x-6 gap-y-3 text-[14px] font-semibold text-[#4B5563]",
            personaAvatar:
                "mx-auto mt-5 h-[104px] w-[104px] overflow-hidden rounded-full border-2 border-[#E7EAFF] shadow-[0_4px_10px_rgba(17,24,39,0.12)]",
            personaAvatarImage: "h-full w-full bg-cover bg-center",
            personaBadges: "mt-3 flex items-center justify-center gap-2",
            personaCard: "text-center",
            personaIcon: "bg-[#EEF0FF] text-[#5140F0]",
            personaMeta:
                "mt-1 text-[14px] font-semibold leading-6 text-[#6B7280]",
            personaName: "text-[16px] font-extrabold text-[#111827]",
            personaNameRow: "mt-4 flex items-center justify-center gap-2",
            scoreCard:
                "flex min-h-[88px] items-center justify-between gap-4 rounded-[14px] border px-5 py-4 shadow-none",
            scoreDetailButton:
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition hover:bg-white/70",
            scoreDetailIcon: "h-4 w-4",
            scoreIdentity: "flex min-w-0 items-center gap-3",
            scoreIcon: "h-6 w-6 shrink-0",
            scoreTitle: "text-[16px] font-extrabold",
            scoreTone: {
                green: "border-[#BBF7D0] !bg-[#F0FDF4] text-[#16A34A]",
                orange: "border-[#FED7AA] !bg-[#FFF7ED] text-[#C2410C]",
                red: "border-[#FECACA] !bg-[#FEF2F2] text-[#DC2626]",
                yellow: "border-[#FDE68A] !bg-[#FFFBEB] text-[#B45309]",
            },
            scoreValue:
                "shrink-0 text-[28px] font-extrabold leading-none",
            situationContent: "mt-8 space-y-5",
            situationIcon: "bg-[#E7EDFD] text-[#3B6FD0]",
            situationLabel: "text-[14px] font-semibold text-[#7A8494]",
            situationRow:
                "grid gap-2 sm:grid-cols-[100px_1fr] sm:gap-4",
            situationText:
                "text-[15px] font-medium leading-7 text-[#252B38]",
            statusDot: "h-2.5 w-2.5 rounded-full bg-[#22C55E]",
            statusLabel: "text-[14px] font-bold text-[#16A34A]",
            statusRow: "mb-4 flex items-center justify-end gap-2",
        },
        transcriptCorrection: {
            divider: "border-[#FDE68A]",
            highlight: "bg-[#FDE68A]",
            panel: "border-[#FCD34D] bg-[#FFFBEB]",
            reasonLabel: "text-[#92400E]",
            reasonText: "text-[#4B5563]",
            suggestionLabel: "text-[#166534]",
            suggestionText: "text-[#166534]",
            title: "text-[#92400E]",
            titleIcon: "text-[#B45309]",
            toggleActive:
                "border-[#FCD34D] bg-[#FDE68A]/40 text-[#B45309] hover:bg-[#FDE68A]/55",
            toggleIdle:
                "border-[#FDE68A] bg-[#FDE68A]/15 text-[#92400E] hover:bg-[#FDE68A]/30",
        },
        strategicPriorityTitle:
            "text-[12px] font-extrabold uppercase tracking-wide text-[#B45309]",
    },
    roleplayEditor: {
        aiInstructionsCounter: "text-right text-[12px] font-medium tabular-nums text-[#6B7280]",
        aiInstructionsCounterRow: "mt-1.5 flex justify-end",
        aiInstructionsDrawerContent: "flex min-h-0 flex-1 flex-col gap-3",
        aiInstructionsFooter: "flex flex-wrap items-center justify-between gap-2",
        aiInstructionsHeader: "mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        aiInstructionsHeading: "min-w-0 flex-1",
    },
    evaluationKeyMoments: {
        card: "overflow-hidden rounded-xl border border-[#E5E7EB] bg-white",
        chevron: "h-4 w-4 shrink-0 text-[#9CA3AF] transition-transform",
        count: "text-[12px] font-semibold text-[#9CA3AF]",
        detail: "space-y-5 border-t border-[#ECEEF3] px-4 py-5 md:px-5",
        detailLabel: "text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#9CA3AF]",
        detailText: "mt-2 text-[13px] font-medium leading-6 text-[#4B5563]",
        header: "flex w-full flex-col gap-2.5 px-4 py-3.5 text-left md:px-5",
        headerIdentity: "flex min-w-0 flex-col gap-1",
        headerMeta: "flex w-full min-w-0 flex-wrap items-center gap-2",
        icon: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FEF3C7] text-[#D97706]",
        impact: "inline-flex min-h-6 max-w-full items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-4",
        impactTone: {
            moment_cle_negatif: "bg-[#FEE2E2] text-[#B91C1C]",
            moment_cle_positif: "bg-[#DCFCE7] text-[#15803D]",
            moment_sensible: "bg-[#FEF3C7] text-[#B45309]",
            opportunite_manquee: "bg-[#FFEDD5] text-[#C2410C]",
        },
        list: "mt-5 space-y-3",
        number: "shrink-0 text-[13px] font-bold text-[#6B7280]",
        recommendation: "rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4",
        recommendationLabel: "flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.04em] text-[#15803D]",
        recommendationText: "mt-2 text-[13px] font-medium italic leading-6 text-[#166534]",
        section: "rounded-[16px] border border-[#E5E7EB] p-6 shadow-none",
        sectionHeading: "text-[16px] font-bold text-[#111827]",
        sectionHeader: "flex flex-wrap items-center justify-between gap-3",
        sectionTitle: "flex items-center gap-3",
        speaker: "shrink-0 text-[12px] font-bold text-[#374151]",
        step: "border-t border-[#F1F2F5] px-4 py-2 text-[12px] font-semibold text-[#5140F0] md:px-5",
        time: "inline-flex items-center gap-1 text-[11px] font-semibold text-[#9CA3AF]",
        title: "min-w-0 text-[14px] font-bold leading-5 text-[#111827]",
        transcript: "mt-2 flex flex-col gap-2 rounded-xl bg-[#F7F8FB] px-3 py-3 md:flex-row",
        transcriptText: "text-[13px] font-medium italic leading-6 text-[#374151]",
    },
    roleplayIndex: {
        card: "flex flex-col rounded-[14px] border border-[#C9C2FB] p-5 text-center shadow-none",
        chartBarOther: "absolute bottom-0 w-7 rounded-t-lg bg-[#C9CED8]",
        chartBarTop: "absolute bottom-0 w-7 rounded-t-lg bg-[#5140F0]",
        chartBarValue:
            "absolute left-1/2 z-20 -translate-x-1/2 translate-y-[-6px] whitespace-nowrap text-[11px] font-extrabold text-[#111827]",
        chartCard: "rounded-[14px] border border-[#C9C2FB] bg-white p-5 shadow-[0_10px_30px_rgba(81,64,240,0.08)]",
        chartColumn: "relative flex h-full items-end justify-center",
        chartColumns: "absolute inset-0 z-10 grid items-end gap-2 px-1",
        chartDate: "min-w-0 text-center text-[10px] font-semibold leading-4 text-[#6B7280]",
        chartDates: "mt-2 grid gap-2 px-1",
        chartEmpty: "mt-4 rounded-xl bg-[#F7F8FB] px-4 py-8 text-center text-[13px] font-medium text-[#6B7280]",
        chartHeader: "flex items-end justify-between gap-4 border-b border-[#ECEEF3] pb-4",
        chartIndexCurve: "pointer-events-none absolute inset-y-0 left-1 z-20 h-full w-[calc(100%_-_0.5rem)] overflow-visible text-[#16A34A]",
        chartIndexPoint:
            "group/index-point pointer-events-auto absolute left-1/2 z-30 h-3 w-3 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white bg-[#16A34A] shadow-[0_1px_4px_rgba(22,163,74,0.35)] transition-transform duration-150 hover:scale-125 focus-visible:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/30",
        chartIndexPointValue:
            "pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-md border border-[#BBF7D0] bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-[#16A34A] opacity-0 shadow-[0_4px_12px_rgba(22,163,74,0.14)] transition duration-150 group-hover/index-point:translate-y-0 group-hover/index-point:opacity-100 group-focus-visible/index-point:translate-y-0 group-focus-visible/index-point:opacity-100",
        chartIndexPointValueVisible: "translate-y-0 opacity-100",
        chartIndexPoints: "pointer-events-none absolute inset-0 z-30 grid gap-2 px-1",
        chartIndexScore: "mt-1 text-[42px] font-extrabold leading-none text-[#5140F0]",
        chartLegend: "mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold text-[#6B7280]",
        chartLegendIndexCurve: "h-0.5 w-4 rounded-full bg-[#16A34A]",
        chartLegendOtherDot: "h-2 w-2 rounded-full bg-[#C9CED8]",
        chartLegendTopDot: "h-2 w-2 rounded-full bg-[#5140F0]",
        chartPlot: "relative mt-4 h-[190px] border-b border-[#D5D7DE] bg-[linear-gradient(to_top,#ECEEF3_1px,transparent_1px)] bg-[length:100%_25%]",
        definitionCard: "rounded-xl border border-[#C9C2FB] bg-[#F8F7FE] p-4",
        definitionText: "mt-1 text-[13px] font-medium leading-5 text-[#4B5563]",
        definitionTitle: "text-[13px] font-extrabold text-[#5140F0]",
        drawerLabel: "text-[12px] font-bold uppercase tracking-[0.04em] text-[#6B7280]",
        drawerTrend: "mt-2 inline-flex items-center justify-center gap-1 text-[13px] font-bold",
        infoButton:
            "flex h-6 w-6 items-center justify-center rounded-full text-[#9CA3AF] transition hover:bg-[#F4F3FE] hover:text-[#5140F0]",
        score: "mt-2 text-[30px] font-extrabold text-[#5140F0]",
        title: "text-[13px] font-bold text-[#4B5563]",
        titleIcon: "h-4 w-4 text-[#5140F0]",
        trend: "mt-1 inline-flex items-center justify-center gap-1 text-[12px] font-semibold",
    },
    roleplayCard: {
        action:
            "mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-lg border-2 border-[#4F46E5] bg-white px-4 text-[14px] font-medium text-[#4F46E5] transition hover:bg-[#EEF2FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:ring-offset-2",
        attemptBadge:
            "inline-flex h-7 min-w-10 items-center justify-center gap-1 rounded-lg border border-white/25 bg-white/15 px-2 text-[12px] font-bold text-white backdrop-blur-sm",
        avatar:
            "relative z-10 h-20 w-20 overflow-hidden rounded-full border-[3px] border-white bg-[#F1F2F6] shadow-[0_8px_20px_rgba(17,24,39,0.14)]",
        badges: "mt-2.5 flex items-center gap-2",
        body: "-mt-6 flex flex-1 flex-col items-center px-6 pb-6",
        content: "flex-1 text-center",
        description: "mt-1 text-[13px] font-medium leading-5 text-[#4B5563]",
        divider: "my-3 h-px w-full bg-[#ECEEF3]",
        header:
            "relative h-16 rounded-t-[16px] bg-gradient-to-r from-indigo-600 to-indigo-700",
        personaMeta:
            "mt-1 text-center text-[13px] font-semibold leading-5 text-[#737B8E]",
        personaName: "mt-2 text-[17px] font-extrabold leading-6 text-[#111827]",
        stat: "min-w-0 text-center",
        statInfo:
            "flex h-4 w-4 items-center justify-center rounded-full text-[#9CA3AF]",
        statInfoIcon: "h-3 w-3",
        statLabel:
            "text-[10px] font-bold uppercase leading-4 text-[#7A8494]",
        statLabelRow: "flex items-center justify-center gap-1",
        stats: "mt-4 grid w-full grid-cols-2 gap-4",
        statValue: "mt-1 text-[15px] font-bold leading-5 text-[#111827]",
        title: "text-[14px] font-extrabold leading-5 text-[#111827]",
    },
    routeStatus: {
        card: "w-full max-w-[560px] rounded-[20px] border border-[#E9E7FB] px-7 py-8 text-center shadow-[0_18px_50px_rgba(17,24,39,0.08)] md:px-10 md:py-10",
        iconBox: "mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#F4F3FE] text-[#5140F0]",
    },
    select: {
        chevron: "h-4 w-4 shrink-0 transition-transform",
        menu: "absolute left-0 right-0 top-[44px] z-30 max-h-[240px] overflow-y-auto rounded-xl border border-[#E5E7EB] p-1.5 shadow-[0_18px_40px_rgba(17,24,39,0.16)]",
        option: "flex min-h-11 w-full min-w-0 items-start justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium transition hover:bg-[#F6F7FB]",
        optionActive: "text-[#5140F0]",
        optionIcon: "mt-0.5 h-4 w-4 shrink-0 text-[#6B7280]",
        optionDisabled: "cursor-not-allowed text-[#9CA3AF] opacity-70 hover:bg-transparent",
        optionIdle: "text-[#111827]",
        optionLabel: "block whitespace-normal break-words leading-5",
        optionLabelWrapper: "min-w-0 flex-1",
        trigger:
            "flex h-9 w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-3.5 text-[14px] transition",
        triggerDisabled: "cursor-not-allowed opacity-70",
        triggerEnabled: "hover:border-[#D5D7DE]",
        triggerIcon: "h-4 w-4 shrink-0 text-[#6B7280]",
        triggerLabel: "block truncate text-left",
        triggerLabelWrapper: "min-w-0 flex-1",
        triggerPlaceholder: "text-[#9CA3AF]",
        triggerValue: "font-medium text-[#111827]",
    },
    searchableSelect: {
        chip: "inline-flex h-8 items-center gap-1.5 rounded-full border border-[#C9C2FB] bg-[#F4F3FE] pl-3 pr-1.5 text-[12px] font-bold text-[#5140F0]",
        chipRemoveButton:
            "flex h-5 w-5 items-center justify-center rounded-full text-[#5140F0] transition hover:bg-white",
        closeButton:
            "mt-2 flex h-9 w-full items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[13px] font-semibold text-[#374151] transition hover:border-[#D5D7DE]",
        option:
            "flex w-full flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg px-3 py-2 text-left transition hover:bg-[#F6F7FB]",
        panel: "rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-[0_1px_2px_rgba(17,24,39,0.04)]",
    },
    segmentedControl: {
        icon: "h-4 w-4 shrink-0",
        label: "min-w-0 truncate",
        option: "flex min-h-9 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold transition",
        optionActive: "bg-white text-[#5140F0] shadow-[0_1px_3px_rgba(17,24,39,0.12)]",
        optionDisabled: "cursor-not-allowed opacity-60",
        optionIdle: "text-[#6B7280] hover:text-[#374151]",
        root: "flex w-full min-w-0 gap-1 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] p-1",
    },
    /** Cartes sémantiques colorées d'une étape de méthode (objectifs, bonnes pratiques, erreurs…). */
    stepBlock: {
        card: "rounded-[14px] border p-5",
        dot: "mt-2 h-1.5 w-1.5 shrink-0 rounded-full",
        empty: "text-[14px] font-medium leading-6 text-[#9CA3AF]",
        header: "flex items-center gap-2",
        icon: "h-4 w-4 shrink-0",
        item: "flex gap-2.5",
        list: "mt-3 space-y-2.5",
        text: "text-[14px] font-medium leading-6 text-[#4B5563]",
        title: "text-[15px] font-extrabold text-[#111827]",
        tone: {
            blue: { accent: "text-[#2563EB]", dot: "bg-[#2563EB]", solid: "bg-[#2563EB] text-white", surface: "border-[#C2D8FD] bg-[#EFF4FF]" },
            green: { accent: "text-[#16A34A]", dot: "bg-[#16A34A]", solid: "bg-[#16A34A] text-white", surface: "border-[#BBF7D0] bg-[#F0FDF4]" },
            indigo: { accent: "text-[#5140F0]", dot: "bg-[#5140F0]", solid: "bg-[#5140F0] text-white", surface: "border-[#C9C2FB] bg-[#F1F0FE]" },
            orange: { accent: "text-[#EA580C]", dot: "bg-[#EA580C]", solid: "bg-[#EA580C] text-white", surface: "border-[#FED7AA] bg-[#FFF7ED]" },
            red: { accent: "text-[#DC2626]", dot: "bg-[#DC2626]", solid: "bg-[#DC2626] text-white", surface: "border-[#FECACA] bg-[#FEF2F2]" },
            rose: { accent: "text-[#E11D48]", dot: "bg-[#E11D48]", solid: "bg-[#E11D48] text-white", surface: "border-[#FECDD3] bg-[#FFF1F2]" },
            violet: { accent: "text-[#8B2FD6]", dot: "bg-[#8B2FD6]", solid: "bg-[#8B2FD6] text-white", surface: "border-[#E6D9FB] bg-[#F8F5FE]" },
        },
    },
    stepTabs: {
        button: "flex min-h-9 items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-bold transition",
        buttonIdle: "border border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#D5D7DE]",
        empty: "py-3 text-[13px] font-semibold text-[#9CA3AF]",
        item: "flex gap-2.5",
        itemText: "text-[14px] font-medium leading-6 text-[#4B5563]",
        list: "space-y-2.5",
        listDot: "mt-2 h-1.5 w-1.5 shrink-0 rounded-full",
        panel: "rounded-[20px] border border-[#E9E7FB] p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]",
        tabList: "flex flex-wrap gap-2 border-b border-[#EDEEF3] pb-3",
    },
    /** Page de détail d'une scorecard : en-tête statistique, accordéon d'étape et tableau de critères. */
    scorecard: {
        criterionEvidence: "text-[13px] font-medium leading-5 text-[#4B5563]",
        criterionKey: "text-[14px] font-bold leading-5 text-[#111827]",
        criterionMeta: "text-[13px] font-medium leading-5 text-[#4B5563]",
        criteriaGrid:
            "grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.85fr)_44px_minmax(0,1.9fr)_minmax(0,1.7fr)]",
        metaChip:
            "inline-flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3.5 text-[13px] font-semibold text-[#4B5563]",
        metaChipIcon: "h-4 w-4 shrink-0 text-[#9CA3AF]",
        ptsBadge:
            "inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-[#EEF0FE] px-2 text-[13px] font-extrabold text-[#5140F0]",
        statDivider: "text-[#D1D5DB]",
        statLabel: "font-medium text-[#6B7280]",
        statValue: "font-extrabold text-[#111827]",
        statsBox:
            "inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-xl border border-[#E5E7EB] bg-[#F7F8FB] px-4 py-3 text-[13px]",
        stepCard: "overflow-hidden rounded-[14px] border border-[#E5E7EB] shadow-none",
        stepChevron: "h-5 w-5 shrink-0 text-[#9CA3AF] transition-transform",
        stepHeader: "flex w-full items-center gap-4 px-5 py-4 text-left",
        stepIcon: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
        stepMeta: "shrink-0 text-[13px] font-semibold text-[#6B7280]",
        stepTitle: "min-w-0 flex-1 text-[16px] font-bold text-[#111827]",
        /** Teintes d'icône d'étape, attribuées par ordre (cyclées). */
        stepTones: [
            "bg-[#E7EDFD] text-[#3B6FD0]",
            "bg-[#F3E8FD] text-[#8B2FD6]",
            "bg-[#FFF1E8] text-[#EA580C]",
            "bg-[#E7F9ED] text-[#16A34A]",
        ],
        tableHeader:
            "grid items-center gap-4 border-t border-[#ECEEF3] px-5 pb-2 pt-3 text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#9CA3AF]",
        tableRow: "grid items-start gap-4 border-t border-[#F1F2F5] px-5 py-4",
        verbatimBox:
            "rounded-[10px] bg-[#F0FDF4] px-3 py-2.5 text-[13px] font-medium italic leading-5 text-[#15803D]",
    },
    /** Notes prises pendant une préparation avec le coach IA. */
    coachNotes: {
        actionIcon: "h-4 w-4 shrink-0",
        addButton:
            "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#5140F0] px-3 text-[13px] font-bold text-white transition hover:bg-[#4433D8] disabled:cursor-not-allowed disabled:bg-[#D7D5F7]",
        composer: "space-y-3 border-b border-[#ECEEF3] px-4 py-4",
        composerActions: "flex items-center gap-2",
        deleteButton:
            "flex h-7 w-7 items-center justify-center rounded-md text-[#9CA3AF] opacity-0 transition hover:bg-white/70 hover:text-[#DC2626] group-hover/note:opacity-100 focus:opacity-100",
        deleteIcon: "h-3.5 w-3.5",
        deleteTooltip: "ml-auto shrink-0",
        empty: "px-4 py-8 text-center text-[13px] font-semibold text-[#9CA3AF]",
        feedback: "min-h-5 text-center text-[12px] font-semibold text-[#6B7280]",
        footer: "space-y-2 border-t border-[#ECEEF3] px-4 pb-4 pt-3",
        header: "flex items-center justify-between border-b border-[#ECEEF3] px-4 py-4",
        list: "max-h-[520px] min-h-[160px] space-y-3 overflow-y-auto px-4 py-4",
        note: "group/note rounded-[10px] border p-3",
        noteHeader: "flex min-w-0 items-center gap-2",
        noteText: "mt-2 whitespace-pre-wrap text-[13px] font-medium leading-5 text-[#374151]",
        panel:
            "flex min-h-[520px] flex-col overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)]",
        saveButton:
            "flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#5140F0] px-3 text-[13px] font-bold text-white transition hover:bg-[#4433D8] disabled:cursor-not-allowed disabled:bg-[#D7D5F7]",
        select: "min-w-0 flex-1 text-[13px]",
        subtitle: "mt-0.5 text-[12px] font-semibold text-[#9CA3AF]",
        textarea: "min-h-[88px] resize-none text-[13px]",
        time: "shrink-0 text-[11px] font-semibold text-[#9CA3AF]",
        title: "text-[15px] font-extrabold text-[#111827]",
        typeBadge: "inline-flex min-w-0 items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-bold",
        typeIcon: "h-3 w-3 shrink-0",
        typeTone: {
            example: {
                badge: "bg-[#DCFCE7] text-[#15803D]",
                surface: "border-[#BBF7D0] bg-[#F0FDF4]",
            },
            key_point: {
                badge: "bg-[#DBEAFE] text-[#1D4ED8]",
                surface: "border-[#BFDBFE] bg-[#EFF6FF]",
            },
            suggestion: {
                badge: "bg-[#EDE9FE] text-[#6D28D9]",
                surface: "border-[#DDD6FE] bg-[#F5F3FF]",
            },
        },
        viewer: {
            cancelEditButton:
                "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#D5D7DE] bg-white px-3 text-[12px] font-bold text-[#4B5563] transition hover:bg-[#F8F9FC] disabled:cursor-not-allowed disabled:opacity-60",
            editActions: "flex shrink-0 items-center justify-end gap-2",
            editButton:
                "ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent text-[#9CA3AF] transition hover:border-[#D5D7DE] hover:bg-white hover:text-[#5140F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0] disabled:cursor-not-allowed disabled:opacity-50",
            editFooter: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
            editForm: "space-y-3",
            editIcon: "h-3.5 w-3.5",
            editSelect: "w-full bg-white sm:max-w-[180px]",
            editTextarea:
                "min-h-[112px] resize-y border-[#C9C2FB] bg-white text-[13px] font-medium leading-5 text-[#374151] focus:ring-[#5140F0]",
            empty: "rounded-xl border border-[#E5E7EB] bg-[#F8F9FC] px-5 py-8 text-center text-[13px] font-semibold text-[#9CA3AF]",
            feedback: "min-h-5 text-center text-[12px] font-semibold text-[#6B7280]",
            group: "rounded-[14px] border border-[#E5E7EB] bg-white p-4",
            groupHeader: "flex min-w-0 items-start gap-3 border-b border-[#ECEEF3] pb-3",
            groupIcon: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF0FE] text-[#5140F0]",
            groupIconSvg: "h-5 w-5",
            groupMeta: "mt-1 text-[12px] font-semibold text-[#6B7280]",
            groupTitle: "text-[14px] font-extrabold leading-5 text-[#111827]",
            list: "max-h-[min(64vh,620px)] space-y-3 overflow-y-auto pr-1",
            note: "rounded-[10px] border p-3",
            noteHeader: "flex min-w-0 items-center gap-2",
            noteText: "mt-2 whitespace-pre-wrap text-[13px] font-medium leading-5 text-[#374151]",
            notes: "space-y-2.5 pt-3",
            saveEditButton:
                "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#5140F0] px-3 text-[12px] font-bold text-white transition hover:bg-[#4433D8] disabled:cursor-not-allowed disabled:bg-[#B9B2F8]",
        },
    },
    transcript: {
        action:
            "mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#5140F0] opacity-100 transition hover:text-[#4433D8] focus:opacity-100 disabled:text-[#16A34A] disabled:opacity-100 md:opacity-0 md:group-hover/message:opacity-100",
        actionIcon: "h-3.5 w-3.5",
        avatarAi: "bg-[#5140F0] text-white",
        avatarUser: "bg-[#EEF0F5] text-[#6B7280]",
        bubbleAi: "bg-[#EEF0FF] text-[#1F2433]",
        bubbleUser: "bg-[#F3F4F6] text-[#1F2433]",
        card: "rounded-[16px] border border-[#E9E7FB] p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)]",
        empty: "py-6 text-center text-[14px] font-semibold text-[#9CA3AF]",
        grid: "grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]",
        meta: "flex items-center gap-2 text-[12px] font-semibold text-[#9CA3AF]",
    },
    /** Page de session roleplay : cadre de l'iframe runtime + panneau d'infos persona à droite. */
    session: {
        avatar: {
            container:
                "h-48 w-48 overflow-hidden rounded-full border-4 transition-all duration-300 md:h-64 md:w-64",
            idle: "border-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25)]",
            idleRing: "absolute -inset-3 rounded-full border-4 border-[#C8D4FF]/50",
            speaking:
                "border-[#7C8FFF] shadow-[0_0_40px_rgba(124,143,255,0.4),0_20px_40px_-12px_rgba(0,0,0,0.25)]",
            speakingRing: "absolute -inset-6 rounded-full border-[3px] border-[#7C8FFF]",
        },
        countBadge:
            "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#EEF0FE] px-1.5 text-[12px] font-bold text-[#5140F0]",
        documentsButton:
            "flex w-full items-center justify-between gap-2 text-[14px] font-bold text-[#374151] transition hover:text-[#5140F0]",
        factIcon: "h-4 w-4 shrink-0 text-[#9CA3AF]",
        factRow: "flex items-center gap-2.5 text-[14px] font-semibold text-[#374151]",
        frame: "h-full w-full border-0",
        frameCard:
            "h-[680px] self-start overflow-hidden rounded-[20px] border border-[#E9E7FB] shadow-[0_1px_2px_rgba(17,24,39,0.04)]",
        frameFallback:
            "flex h-full flex-col items-center justify-center gap-3 bg-[#F8F9FC] p-6 text-center",
        panel:
            "flex flex-col rounded-[20px] border border-[#E9E7FB] bg-white p-6 shadow-[0_1px_2px_rgba(17,24,39,0.04)] lg:h-[680px] lg:min-h-0 lg:overflow-hidden",
        panelHeader: "flex shrink-0 items-center gap-2 border-b border-[#EDEEF3] pb-4",
        panelHeaderIcon: "h-5 w-5 shrink-0 text-[#5140F0]",
        panelHeaderTitle: "text-[15px] font-extrabold text-[#111827]",
        panelScrollArea:
            "min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2 [scrollbar-gutter:stable]",
        resourceList: "mt-1 shrink-0 divide-y divide-[#EDEEF3] border-t border-[#EDEEF3] bg-white",
        resourceRow: "py-4",
        resourceRowLast: "pt-4",
        result: {
            action:
                "mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#5140F0] px-4 text-[14px] font-bold text-white transition hover:bg-[#4433D8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0] focus-visible:ring-offset-2",
            card:
                "relative mb-5 overflow-hidden rounded-[20px] border p-0 shadow-[0_8px_28px_rgba(17,24,39,0.06)]",
            description: "mt-1.5 max-w-[680px] text-[14px] font-medium leading-6 text-[#596273]",
            inner: "grid gap-5 p-5 sm:grid-cols-[132px_minmax(0,1fr)] sm:items-center sm:p-6",
            scoreLabel: "mt-1 text-[11px] font-extrabold uppercase tracking-[0.14em]",
            scorePanel:
                "flex min-h-[118px] flex-col items-center justify-center rounded-[16px] border text-center",
            scoreValue: "text-[38px] font-black leading-none tracking-[-0.05em]",
            status: "inline-flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-[0.1em]",
            statusIcon: "h-4 w-4",
            title: "mt-2 text-[20px] font-extrabold leading-tight text-[#111827]",
            tone: {
                green: {
                    card: "border-[#B8E2C7] bg-[#F7FCF9]",
                    scorePanel: "border-[#A8DDBB] bg-[#E8F7ED] text-[#137A45]",
                    status: "text-[#137A45]",
                },
                neutral: {
                    card: "border-[#DDE1EA] bg-[#FAFBFC]",
                    scorePanel: "border-[#D8DCE5] bg-[#F1F3F6] text-[#596273]",
                    status: "text-[#596273]",
                },
                orange: {
                    card: "border-[#F5D0AA] bg-[#FFF9F3]",
                    scorePanel: "border-[#F3C491] bg-[#FFF0DE] text-[#B45309]",
                    status: "text-[#B45309]",
                },
                red: {
                    card: "border-[#F1C2C2] bg-[#FFF8F8]",
                    scorePanel: "border-[#EFB5B5] bg-[#FDEAEA] text-[#B42318]",
                    status: "text-[#B42318]",
                },
                yellow: {
                    card: "border-[#EEDB9B] bg-[#FFFDF5]",
                    scorePanel: "border-[#E9D27D] bg-[#FFF6D8] text-[#946200]",
                    status: "text-[#946200]",
                },
            },
        },
        sectionIcon: "mt-0.5 h-4 w-4 shrink-0 text-[#5140F0]",
        sectionRow: "flex gap-2.5",
        sectionText: "text-[14px] font-medium leading-6 text-[#4B5563]",
    },
    /** Loader plein écran « Analyse en cours » : badge animé + checklist d'étapes (3 états). */
    analysisLoader: {
        badge: "relative flex h-24 w-24 items-center justify-center",
        badgeCore:
            "flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#5140F0] text-white shadow-[0_12px_30px_rgba(81,64,240,0.35)]",
        badgeRing: "absolute inset-0 animate-spin rounded-full border-4 border-[#EDE9FE] border-t-[#5140F0]",
        description: "mt-2 text-[14px] font-medium leading-6 text-[#6B7280]",
        iconActive: "h-5 w-5 shrink-0 text-[#5140F0]",
        iconDone: "h-5 w-5 shrink-0 text-[#16A34A]",
        iconPending: "h-5 w-5 shrink-0 text-[#D1D5DB]",
        list: "mt-6 space-y-2.5",
        row: "flex items-center gap-3 rounded-xl px-4 py-3 text-left text-[14px] font-semibold transition",
        rowActive: "border border-[#C9C2FB] bg-[#F4F3FE] text-[#5140F0]",
        rowDone: "bg-[#F7F8FB] text-[#374151]",
        rowPending: "bg-[#F7F8FB] text-[#9CA3AF]",
        title: "mt-5 text-[26px] font-extrabold text-[#111827]",
    },
    /** Page « État de mes compétences » : score de maîtrise, dimensions, étapes et compétences. */
    progression: {
        /** Palette par niveau de score — pilote pastilles, barres et pastilles rondes. */
        level: {
            green: { pill: "bg-[#DCFCE7] text-[#16A34A]", fill: "#16A34A", dot: "bg-[#16A34A]" },
            yellow: { pill: "bg-[#FEF3C7] text-[#B45309]", fill: "#F59E0B", dot: "bg-[#F59E0B]" },
            orange: { pill: "bg-[#FFEDD5] text-[#C2410C]", fill: "#F97316", dot: "bg-[#F97316]" },
            red: { pill: "bg-[#FEE2E2] text-[#DC2626]", fill: "#EF4444", dot: "bg-[#EF4444]" },
            neutral: { pill: "bg-[#F3F4F6] text-[#6B7280]", fill: "#D1D5DB", dot: "bg-[#D1D5DB]" },
        },
        /** Teintes d'icône des 3 dimensions (résumé + tableau détaillé). */
        dimensionTone: {
            savoir: "bg-[#E7EDFD] text-[#3B6FD0]",
            "savoir-faire": "bg-[#F3E8FD] text-[#8B2FD6]",
            "savoir-etre": "bg-[#E4EDFF] text-[#2563EB]",
        },
        /** Bandeau « Score de maîtrise ». */
        masteryCard:
            "flex flex-col gap-4 rounded-[16px] border border-[#E9E7FB] bg-gradient-to-r from-[#F8F9FE] via-[#F6F5FE] to-[#F4F3FE] p-5 md:flex-row md:items-center md:gap-5",
        masteryIcon: "flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-[#E7E5FB] text-[#5140F0]",
        masteryLabel: "text-[13px] font-medium text-[#9CA3AF]",
        masteryTitle: "text-[15px] font-bold text-[#111827]",
        /** Pastille de score colorée par niveau (grande, ex. en-têtes d'accordéon). */
        scorePill: "inline-flex items-center justify-center rounded-[10px] px-3 py-1.5 text-[14px] font-extrabold",
        /** Pastille discrète « Initial : xx% » (texte toujours sur une ligne). */
        ghostPill:
            "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#6B7280]",
        /** Pastille ambre « Après training : xx% » (texte toujours sur une ligne). */
        afterPill:
            "inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[12px] font-semibold text-[#B45309]",
        /** Base du badge d'évolution ; la couleur dépend du sens calculé dans le domaine. */
        delta: "inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[13px] font-bold",
        /** Carte accordéon (étape, compétence, dimensions). */
        accordion: "overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white",
        accordionHeader: "flex w-full items-center gap-3 px-5 py-4 text-left",
        chevron: "h-5 w-5 shrink-0 text-[#9CA3AF] transition-transform",
        iconSquare: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
        /** Segmented control « Par étapes / Par compétences ». */
        tabs: "inline-flex items-center gap-1 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] p-1",
        tabActive: "rounded-lg bg-white px-4 py-1.5 text-[13px] font-semibold text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.1)]",
        tabIdle: "rounded-lg px-4 py-1.5 text-[13px] font-semibold text-[#6B7280] transition hover:text-[#374151]",
        /** Encart « Diagnostic principal IA ». */
        diagnosticBox: "rounded-[14px] border border-[#E7E5FB] bg-[#F5F4FE] p-5",
        diagnosticTitle: "text-[14px] font-bold text-[#5140F0]",
        diagnosticText: "mt-2 text-[14px] font-medium leading-6 text-[#4B5563]",
        /** En-têtes de tableaux (MODALITÉ / DIMENSION / COMPÉTENCE …). */
        tableHead: "text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#9CA3AF]",
        /** Étiquette d'axe du radar. */
        radarAxisLabel:
            "rounded-full border border-[#E9E7FB] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#5140F0]",
        footnote: "text-center text-[12px] font-medium leading-5 text-[#9CA3AF]",
    },
    /** Panneau latéral coulissant (slide-over) ancré à droite. */
    drawer: {
        body: "min-h-0 flex-1 overflow-y-auto px-6 py-5",
        bodyEditor: "flex flex-col overflow-hidden",
        description: "mt-1 text-[13px] font-medium leading-5 text-[#6B7280]",
        header:
            "sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#ECEEF3] bg-white px-6 py-5",
        overlay: "fixed inset-0 z-50 flex justify-end bg-[#111827]/45 backdrop-blur-[1px]",
        panel:
            "flex h-full w-full max-w-[440px] flex-col overflow-hidden bg-white shadow-[-20px_0_50px_rgba(17,24,39,0.18)]",
        panelEditor: "max-w-[720px]",
        title: "text-[18px] font-extrabold text-[#111827]",
    },
    modal: {
        closeButton:
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6B7280] transition hover:bg-[#F3F4F7] hover:text-[#111827]",
        contentFixed: "min-h-0 flex-1",
        header: "mb-5 flex shrink-0 items-start justify-between gap-4",
        headerFixed: "border-b border-[#ECEEF3] pb-5",
        overlay:
            "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#111827]/55 px-4 py-8 backdrop-blur-[1px]",
        panel: "w-full max-h-[85vh] rounded-2xl bg-white p-6 shadow-[0_22px_60px_rgba(17,24,39,0.26)] md:p-7",
        panelFixed: "flex h-[min(85vh,720px)] flex-col overflow-hidden",
        panelScrollable: "overflow-y-auto",
        title: "text-[20px] font-extrabold leading-tight",
        titleRow: "flex flex-wrap items-center gap-2.5",
    },
    /** Parcours partagé de création manuelle ou de préremplissage depuis un JSON local. */
    jsonPrefill: {
        actionGrid: "grid gap-3 sm:grid-cols-2",
        cancelButton:
            "flex h-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-5 text-[14px] font-semibold text-[#374151] transition hover:border-[#C9C2FB] hover:text-[#5140F0] disabled:cursor-not-allowed disabled:opacity-60",
        dialogPanel: "max-w-[620px]",
        documentShell:
            "rounded-[16px] border border-[#E5E7EB] bg-[#FAFAFC] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
        eyebrow:
            "mb-2 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#5140F0]",
        footer: "grid gap-3 border-t border-[#ECEEF3] pt-5 sm:grid-cols-2",
        formHeader: "mb-6 flex flex-wrap items-center justify-between gap-4",
        formNotice: "mb-5",
        hero:
            "relative overflow-hidden rounded-[16px] border border-[#E4E1FB] bg-[#F8F7FE] px-5 py-4",
        heroAccent:
            "absolute -right-8 -top-10 h-28 w-28 rounded-full border-[18px] border-[#EAE7FD] opacity-80",
        heroDescription: "mt-1 max-w-[480px] text-[13px] font-medium leading-5 text-[#5F6472]",
        heroIcon:
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#DAD4FB] bg-white text-[#5140F0] shadow-[0_6px_16px_rgba(81,64,240,0.10)]",
        heroTitle: "text-[14px] font-extrabold text-[#252834]",
        modeCard:
            "group flex min-h-[180px] w-full flex-col items-start rounded-[18px] border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0] focus-visible:ring-offset-2",
        modeCardImport:
            "border-[#C9C2FB] bg-[#F8F7FE] hover:-translate-y-0.5 hover:border-[#8E81F6] hover:shadow-[0_14px_30px_rgba(81,64,240,0.12)]",
        modeCardManual:
            "border-[#E5E7EB] bg-white hover:-translate-y-0.5 hover:border-[#C9CED8] hover:shadow-[0_14px_30px_rgba(17,24,39,0.08)]",
        modeDescription: "mt-2 text-[13px] font-medium leading-5 text-[#6B7280]",
        modeIconImport:
            "flex h-11 w-11 items-center justify-center rounded-xl bg-[#5140F0] text-white shadow-[0_10px_20px_rgba(81,64,240,0.22)]",
        modeIconManual:
            "flex h-11 w-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F7F8FB] text-[#374151]",
        modeLink:
            "mt-auto flex items-center gap-1.5 pt-5 text-[12px] font-extrabold text-[#5140F0]",
        modeTitle: "mt-4 text-[15px] font-extrabold text-[#111827]",
        primaryButton:
            "flex h-11 items-center justify-center gap-2 rounded-xl bg-[#5140F0] px-5 text-[14px] font-bold text-white shadow-[0_10px_22px_rgba(81,64,240,0.22)] transition hover:bg-[#4635E7] disabled:cursor-not-allowed disabled:bg-[#B9B2F8] disabled:shadow-none",
        promptButton:
            "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#C9C2FB] bg-white px-4 text-[13px] font-bold text-[#5140F0] transition hover:border-[#8E81F6] hover:bg-[#F8F7FE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5140F0] focus-visible:ring-offset-2",
        promptCard:
            "relative rounded-[16px] border border-[#E4E1FB] bg-white p-4 shadow-[0_8px_24px_rgba(81,64,240,0.07)] sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4",
        promptContent: "flex min-w-0 flex-1 items-start gap-3",
        promptDescription: "mt-1 max-w-[390px] text-[12px] font-medium leading-5 text-[#6B7280]",
        promptIcon:
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0EEFF] text-[#5140F0]",
        promptStatus: "mt-2 min-h-4 text-[11px] font-semibold text-[#32704A] sm:w-full",
        promptTitle: "text-[13px] font-extrabold text-[#252834]",
        privacy:
            "mt-3 flex items-start gap-2 rounded-xl border border-[#D7E9DE] bg-[#F5FBF7] px-3.5 py-3 text-[12px] font-semibold leading-5 text-[#32704A]",
        sectionLabel: "mb-2 text-[13px] font-extrabold text-[#252834]",
        shell: "space-y-5",
    },
    profile: {
        security: {
            action: "h-9 shrink-0 px-4",
            description: "text-[12px] font-medium leading-5 text-[#7A7F8B]",
            icon: "h-4 w-4",
            iconShell:
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F4F3FE] text-[#5140F0]",
            label: "text-[14px] font-bold leading-5 text-[#171B2A]",
            mask: "font-mono text-[15px] font-semibold tracking-[0.14em] text-[#4B5563]",
            row:
                "flex min-h-[64px] items-center justify-between gap-4 rounded-xl border border-[#E8EAF0] bg-[#FCFCFD] px-4 py-3",
            summary: "flex min-w-0 items-center gap-3",
        },
        passwordModal: {
            actions: "grid gap-3 pt-1 sm:grid-cols-2",
            body: "space-y-5",
            field: "space-y-2",
            forgotLink: "inline-flex w-fit text-[13px]",
            loaderIcon: "h-4 w-4 animate-spin",
            panel: "max-w-[520px]",
            submitButton:
                "flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-[14px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-70",
        },
    },
    videoPlayer: {
        action:
            "flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#EA580C] px-4 text-[13px] font-bold text-white transition hover:bg-[#DC4F08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:ring-offset-2",
        actionDisabled: "cursor-not-allowed opacity-60",
        media: "aspect-video max-h-[70vh] w-full border-0 bg-[#111827]",
        modalPanel: "max-w-[960px]",
        shell: "overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#111827]",
    },
    /** Palettes de tons sémantiques (badges, pastilles d'icônes, textes de statut). */
    tone: {
        danger: {
            soft: "border-[var(--feedback-danger-border)] bg-[var(--feedback-danger-surface)] text-[var(--feedback-danger-foreground)]",
            text: "text-[var(--feedback-danger-foreground)]",
        },
        info: {
            soft: "border-[var(--feedback-info-border)] bg-[var(--feedback-info-surface)] text-[var(--feedback-info-foreground)]",
            text: "text-[var(--feedback-info-foreground)]",
        },
        neutral: { soft: "border-[#E5E7EB] bg-[#F3F4F6] text-[#4B5563]", text: "text-[#4B5563]" },
        primary: { soft: "border-[#DDD6FE] bg-[#F5F3FF] text-[#6D28D9]", text: "text-[#6D28D9]" },
        success: {
            soft: "border-[var(--feedback-success-border)] bg-[var(--feedback-success-surface)] text-[var(--feedback-success-foreground)]",
            text: "text-[var(--feedback-success-foreground)]",
        },
        warning: {
            soft: "border-[var(--feedback-warning-border)] bg-[var(--feedback-warning-surface)] text-[var(--feedback-warning-foreground)]",
            text: "text-[var(--feedback-warning-foreground)]",
        },
    },
    tooltip: {
        bubble:
            "pointer-events-none fixed z-[100] w-max max-w-[min(320px,calc(100vw-16px))] whitespace-pre-line rounded-lg border border-[#E5E7EB] bg-[#111827] px-2.5 py-1.5 text-left text-[12px] font-semibold leading-4 text-white shadow-[0_14px_30px_rgba(17,24,39,0.18)]",
        root: "relative inline-flex min-w-0",
    },
    peopleCountTooltip: {
        base: "rounded-sm font-normal text-[#4B5563] outline-none",
        detail: "mt-1 text-[14px] leading-5",
        interactive:
            "cursor-help underline decoration-dotted underline-offset-4 focus-visible:ring-2 focus-visible:ring-[#5140F0] focus-visible:ring-offset-2",
        table: "text-[13px] leading-5",
    },
    upload: {
        dropButton: "border border-dashed",
        dropButtonDisabled: "cursor-not-allowed border-[#D5D7DE] bg-[#F3F4F6] text-[#9CA3AF]",
        dropButtonEnabled: "border-[#C9C2FB] bg-white text-[#5140F0] hover:bg-[#F4F3FE]",
        fileRow: "rounded-lg border border-[#C9C2FB] bg-white px-3 py-2",
    },
    surface: {
        bullet: "h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9CED8]",
        divider: "my-8 h-px bg-[#ECEEF3]",
        emptyState: "rounded-[16px] border border-dashed border-[#E5E7EB] px-8 py-16 text-center",
        formCard:
            "rounded-[24px] border border-[#E9E7FB] p-7 shadow-[0_1px_2px_rgba(17,24,39,0.04)] md:p-9",
        dimensionCard: "rounded-[14px] border border-[#E5E7EB] bg-white p-5",
        learningCard: "space-y-3 rounded-[12px] border border-[#FED7AA] bg-[#FFF7ED] p-4",
        listToolbar: "rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-none",
        mutedPanel: "rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4",
        nestedCard: "rounded-[14px] border border-[#E5E7EB] bg-[#F7F8FB] p-4 shadow-none",
        pageBanner:
            "flex flex-col gap-4 rounded-2xl border border-[#E9E7FB] bg-gradient-to-r from-[#F5F3FF] to-[#FBF5FF] px-7 py-6 md:flex-row md:items-center md:justify-between",
        quickTakeCard: "space-y-3 rounded-[12px] border border-[#FDE68A] bg-[#FFFBEB] p-4",
        rowCard: "rounded-xl border border-[#E5E7EB] bg-white p-4",
        rowCardActive: "rounded-xl border border-[#C9C2FB] bg-[#F8F7FE] p-4",
        stepCard: "rounded-[16px] border border-[#E5E7EB] bg-[#FBFBFD] p-5 shadow-none",
    },
    text: {
        body: "text-[#4B5563]",
        danger: "text-[#DC2626]",
        heading: "text-[#111827]",
        learning: "text-[#C2410C]",
        muted: "text-[#6B7280]",
        primary: "text-[#5140F0]",
        quickTake: "text-[#B7791F]",
        required: "text-[#EF4444]",
        success: "text-[#16A34A]",
        subtle: "text-[#374151]",
    },
} as const;
