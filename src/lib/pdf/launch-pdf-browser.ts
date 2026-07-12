import type { Browser } from "puppeteer-core";

let cachedVercelExecutablePath: string | null = null;
let vercelExecutablePathPromise: Promise<string> | null = null;

function getChromiumPackUrl() {
    if (process.env.CHROMIUM_PACK_URL) return process.env.CHROMIUM_PACK_URL;

    const deploymentHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
    if (!deploymentHost) {
        throw new Error("URL du pack Chromium introuvable dans l'environnement Vercel.");
    }

    return `https://${deploymentHost}/chromium-pack.tar`;
}

async function getVercelExecutablePath() {
    if (cachedVercelExecutablePath) return cachedVercelExecutablePath;

    if (!vercelExecutablePathPromise) {
        const { default: chromium } = await import("@sparticuz/chromium-min");
        vercelExecutablePathPromise = chromium.executablePath(getChromiumPackUrl())
            .then((executablePath) => {
                cachedVercelExecutablePath = executablePath;
                return executablePath;
            })
            .catch((error) => {
                vercelExecutablePathPromise = null;
                throw error;
            });
    }

    return vercelExecutablePathPromise;
}

async function launchVercelBrowser(): Promise<Browser> {
    const [{ default: chromium }, puppeteer] = await Promise.all([
        import("@sparticuz/chromium-min"),
        import("puppeteer-core"),
    ]);

    return puppeteer.launch({
        args: await puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
        executablePath: await getVercelExecutablePath(),
        headless: "shell",
    });
}

async function launchLocalBrowser(): Promise<Browser> {
    const puppeteer = await import("puppeteer");
    return puppeteer.launch({ headless: true });
}

export function launchPdfBrowser() {
    return process.env.VERCEL_ENV ? launchVercelBrowser() : launchLocalBrowser();
}
