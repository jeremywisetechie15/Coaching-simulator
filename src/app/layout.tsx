import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/lib/tanstack-query/QueryProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Coaching Simulator | AI Voice Training",
  description: "Entraînez-vous à des conversations difficiles avec une IA vocale ultra-réaliste.",
  keywords: ["coaching", "AI", "voice", "training", "simulation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    return (
        <html lang="fr">
            <body className={`${inter.variable} font-sans antialiased`}>
                <QueryProvider>{children}</QueryProvider>
            </body>
        </html>
    );
}
