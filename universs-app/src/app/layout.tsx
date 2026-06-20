import type { Metadata } from "next";
import { Lato, JetBrains_Mono } from "next/font/google";
import "./globals.css";

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
  title: "Universs - Blog Feed Tracker",
  description: "Track the latest updates from popular tech blogs",
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
      </body>
    </html>
  );
}
