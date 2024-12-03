import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import localFont from "next/font/local";
import "./globals.css";
import CurrencyLogo from "@/components/currency-logo";
import { CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Brussels Pay - Self Checkout",
  description: "Self Checkout for Brussels Pay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const community = new CommunityConfig(Config);

  return (
    <html lang="en">
      <meta name="theme-color" content="#3431c4" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="#3431c4" />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex justify-center items-center gap-2 bg-primary text-primary-foreground p-4">
          <CurrencyLogo
            className="animate-fade-in-slow"
            logo={community.community.logo}
            size={16}
          />
          <p className="animate-fade-in-slow text-lg font-bold">Brussels Pay</p>
        </div>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
