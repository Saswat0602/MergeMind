import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MergeMind | AI-Powered Pull Request Reviews & Security Audits",
  description: "MergeMind is an autonomous AI-powered code reviewer and security auditor. It integrates with GitHub to provide deep insights, threat heatmaps, and automatic feedback on every Pull Request.",
  keywords: [
    "MergeMind",
    "AI Code Review",
    "Pull Request Reviewer",
    "GitHub PR Security Audit",
    "Autonomous Code Reviewer",
    "Developer Security Tools"
  ],
  authors: [{ name: "MergeMind" }],
  openGraph: {
    title: "MergeMind | AI-Powered Pull Request Reviews & Security Audits",
    description: "MergeMind is an autonomous AI-powered code reviewer and security auditor. It integrates with GitHub to provide deep insights, threat heatmaps, and automatic feedback on every Pull Request.",
    type: "website",
    locale: "en_US",
    siteName: "MergeMind",
  },
  twitter: {
    card: "summary_large_image",
    title: "MergeMind | AI-Powered Pull Request Reviews & Security Audits",
    description: "MergeMind is an autonomous AI-powered code reviewer and security auditor. It integrates with GitHub to provide deep insights, threat heatmaps, and automatic feedback on every Pull Request.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
