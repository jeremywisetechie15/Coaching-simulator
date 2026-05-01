import { FormHeader, FormSkeleton } from "@/lib/ui/molecules";
import { CenteredCardFrame } from "@/lib/ui/organisms";

const frameClasses = {
    surface: "bg-[#F7F8FB] px-5 py-8 text-slate-950",
    container: "min-h-[calc(100vh-4rem)] max-w-5xl",
    card: "max-w-[400px] rounded-[18px] border border-white px-6 py-7 shadow-[0_20px_45px_rgba(15,23,42,0.11)] sm:px-7 sm:py-8",
};

const headerClasses = {
    root: "mb-6 text-center",
    eyebrow: "text-[24px] font-black tracking-normal text-[#5140F0] sm:text-[26px]",
    title: "mt-6 text-[20px] font-extrabold tracking-normal text-slate-950 sm:text-[22px]",
    description: "mt-2 text-[13px] font-semibold tracking-normal text-slate-500 sm:text-[14px]",
};

export function SignInCardFallback() {
    return (
        <CenteredCardFrame
            surfaceClassName={frameClasses.surface}
            containerClassName={frameClasses.container}
            cardClassName={frameClasses.card}
        >
            <FormHeader
                eyebrow="MaiaCoach"
                title="Welcome Back"
                description="Sign in to continue your training"
                className={headerClasses.root}
                eyebrowClassName={headerClasses.eyebrow}
                titleClassName={headerClasses.title}
                descriptionClassName={headerClasses.description}
            />
            <FormSkeleton />
        </CenteredCardFrame>
    );
}
