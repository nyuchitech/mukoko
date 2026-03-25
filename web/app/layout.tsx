import type { Metadata } from "next";
import { Noto_Serif, Noto_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "mukoko — I am because we are",
  description:
    "mukoko is a digital twin social ecosystem for Africa. Six apps, one identity, your sovereignty.",
  metadataBase: new URL("https://mukoko.com"),
  openGraph: {
    title: "mukoko — I am because we are",
    description:
      "A digital twin social ecosystem for Africa. Six apps, one identity, your sovereignty.",
    type: "website",
    url: "https://mukoko.com",
    siteName: "mukoko",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "mukoko — I am because we are",
    description:
      "A digital twin social ecosystem for Africa. Six apps, one identity, your sovereignty.",
  },
  icons: { icon: "/favicon.svg" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${notoSerif.variable} ${notoSans.variable} ${jetbrainsMono.variable}`}
      style={{ colorScheme: "dark" }}
    >
      <body>
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
