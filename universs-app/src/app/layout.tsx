import type { Metadata, Viewport } from "next";
import { Lato, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegister from "./ServiceWorkerRegister";

// Lato is the primary UI typeface used by Slack — a warm, highly legible
// humanist sans-serif. We load the weights the UI actually uses.
const lato = Lato({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://universs-xi.vercel.app"),
  title: {
    default: "Universs — Tech Blog Feed Tracker with Hacker News Popularity",
    template: "%s — Universs",
  },
  description:
    "A minimalist RSS reader that aggregates 92 popular tech blogs and surfaces their Hacker News popularity. Search, bookmarks, dark/light themes, OPML, and offline PWA support.",
  keywords: [
    "RSS reader",
    "feed aggregator",
    "tech blogs",
    "Hacker News",
    "blog tracker",
    "news aggregator",
    "OPML",
    "PWA",
  ],
  authors: [{ name: "Ashutosh Sanzgiri" }],
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "Universs", statusBarStyle: "black-translucent" },
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/api/feed.xml" },
  },
  openGraph: {
    type: "website",
    siteName: "Universs",
    url: "https://universs-xi.vercel.app",
    title: "Universs — Tech Blog Feed Tracker with Hacker News Popularity",
    description:
      "Aggregates 92 popular tech blogs and shows their Hacker News popularity. Search, bookmarks, dark/light themes, OPML, and offline PWA support.",
    images: [{ url: "/icon.svg", alt: "Universs" }],
  },
  twitter: {
    card: "summary",
    title: "Universs — Tech Blog Feed Tracker",
    description:
      "Aggregates 92 popular tech blogs and surfaces their Hacker News popularity.",
    images: ["/icon.svg"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e0e13" },
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
  ],
};

// Runs before React hydrates to apply the saved theme immediately, preventing
// a flash of the wrong theme (FOUC) on first paint.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('universs-theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${lato.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
