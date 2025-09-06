import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DotPattern } from "../components/magicui/dot-pattern";
import { cn } from "../lib/utils";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://handwritten-digit-recogniser.vercel.app"),
  title: {
    default: "Handwritten Digit Recogniser",
    template: "%s • Handwritten Digit Recogniser",
  },
  description: "Draw a digit (0–9) and an on-device neural net will guess it.",
  keywords: [
    "MNIST",
    "handwritten digit",
    "neural network",
    "inference",
    "browser AI",
    "Next.js",
    "TypeScript",
  ],
  authors: [{ name: "Zdravko" }],
  creator: "Zdravko",
  applicationName: "Handwritten Digit Recogniser",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  icons: {
    icon: [
      { url: "/favicon.ico" },
    ],
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Handwritten Digit Recogniser",
    description:
      "Draw a digit (0–9) and an on-device neural net will guess it.",
    siteName: "Handwritten Digit Recogniser",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Handwritten Digit Recogniser",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Handwritten Digit Recogniser",
    description:
      "Draw a digit (0–9) and an on-device neural net will guess it.",
    images: ["/og.png"],
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}
      >
        <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden">
          <DotPattern
            className={cn(
              "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
            )}
          />
            <div className="relative z-10">
            {children}
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
