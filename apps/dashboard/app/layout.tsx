import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "../components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
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
    <html lang="en" className={inter.className}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
