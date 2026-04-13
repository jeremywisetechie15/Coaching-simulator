export const dynamic = "force-dynamic";

const EMBED_URL = "https://embed.liveavatar.com/v1/2f7b33e2-cd03-4763-a2b6-b27846611915";

export default function LiveAvatarEmbedTestPage() {
    return (
        <main className="min-h-screen bg-[#0F172A] px-6 py-10 text-white">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7DD3FC]">
                        Test isolé
                    </p>
                    <h1 className="text-3xl font-semibold text-white">LiveAvatar Embed</h1>
                    <p className="max-w-3xl text-sm text-slate-300">
                        Page de test indépendante pour vérifier le comportement de l&apos;embed LiveAvatar,
                        sans passer par le flux coach custom.
                    </p>
                </div>

                <div className="overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
                    <iframe
                        src={EMBED_URL}
                        allow="microphone"
                        title="LiveAvatar Embed"
                        className="block w-full border-0"
                        style={{ aspectRatio: "16 / 9" }}
                    />
                </div>
            </div>
        </main>
    );
}
