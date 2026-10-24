import { Suspense } from "react";
import { headers } from "next/headers";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Providers from "./providers";
import BusyLinks from "@/components/dawat/BusyLinks";
import ErrorReporter from "@/components/dawat/ErrorReporter";
import "./globals.css";
import "./card.css";

const interDisplay = localFont({
    src: [
        {
            path: "../../public/fonts/InterDisplay-Light.woff2",
            weight: "300",
        },
        {
            path: "../../public/fonts/InterDisplay-Regular.woff2",
            weight: "400",
        },
        {
            path: "../../public/fonts/InterDisplay-Medium.woff2",
            weight: "500",
        },
        {
            path: "../../public/fonts/InterDisplay-SemiBold.woff2",
            weight: "600",
        },
        {
            path: "../../public/fonts/InterDisplay-Bold.woff2",
            weight: "700",
        },
    ],
    variable: "--font-inter-display",
});

/** The site's address for link previews. A wrong NEXT_PUBLIC_SITE_URL (e.g. no https://) must not break the build. */
function siteBase(): URL {
    const tries = [
        process.env.NEXT_PUBLIC_SITE_URL,
        process.env.VERCEL_PROJECT_PRODUCTION_URL &&
            `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
        "http://localhost:3000",
    ];
    for (const t of tries) {
        if (!t) continue;
        try {
            const u = new URL(/^https?:\/\//.test(t) ? t : `https://${t}`);
            if (u.hostname.includes(".") || u.hostname === "localhost") return u;
        } catch {
            /* try the next one */
        }
    }
    return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
    metadataBase: siteBase(),
    title: "Dawatnama — Digital invitations for Pakistan",
    description:
        "Animated shadi cards and event invitations with RSVP. Pick a template, make it yours, share your link on WhatsApp.",
    openGraph: {
        title: "Dawatnama — Digital invitations for Pakistan",
        description: "Animated shadi cards and event invitations with RSVP.",
        type: "website",
        locale: "en_PK",
    },
};

// Fonts used on the invitation cards themselves (the dashboard uses Inter Display).
const CARD_FONTS =
    "https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Great+Vibes&family=Italianno&family=Marcellus&family=Monsieur+La+Doulaise&family=Parisienne&family=Petit+Formal+Script&family=Pinyon+Script&family=Playfair+Display:wght@400;600;700&family=Poppins:wght@300;400;500;600&family=Rouge+Script&family=Tangerine:wght@400;700&display=swap";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link rel="stylesheet" href={CARD_FONTS} />
            </head>
            <body
                className={`${interDisplay.variable} bg-b-surface1 font-inter text-body-1 text-t-primary antialiased`}
            >
                <Providers>
                    <Suspense fallback={null}>
                        <BusyLinks />
                    </Suspense>
                    {children}
                    <ErrorReporter />
                </Providers>
            </body>
        </html>
    );
}

export async function generateViewport(): Promise<Viewport> {
    const userAgent = (await headers()).get("user-agent");
    const isiPhone = /iphone/i.test(userAgent ?? "");
    return isiPhone
        ? {
              width: "device-width",
              initialScale: 1,
              maximumScale: 1, // disables auto-zoom on ios safari
          }
        : { width: "device-width", initialScale: 1 };
}
