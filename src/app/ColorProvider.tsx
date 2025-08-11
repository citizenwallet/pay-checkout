"use client";

import { CommunityConfig } from "@citizenwallet/sdk";
import CurrencyLogo from "@/components/currency-logo";
import { getColors, getHSLColors } from "@/utils/colors";
import Config from "@/cw/community.json";
import {
  ColorMappingOverrides,
  TokenColorMappingOverrides,
} from "@/cw/colorMappingOverrides";
import { useEffect } from "react";

interface ColorProviderProps {
  children: React.ReactNode;
}

export function ColorProvider({ children }: ColorProviderProps) {
  const community = new CommunityConfig(Config);

  // Get project from URL search parameters (middleware approach)
  const urlParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const tokenParam = urlParams.get("token");

  const token = community.getToken(tokenParam ?? undefined);

  const cardColor =
    TokenColorMappingOverrides[token.address] || ColorMappingOverrides.default;
  const colors = getColors(cardColor);
  const hslColors = getHSLColors(cardColor);

  // Apply dynamic colors to CSS custom properties
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;

      // Set primary colors
      root.style.setProperty("--primary", hslColors.primary);
      root.style.setProperty("--primary-foreground", "0 0% 98%");

      // Set accent colors based on primary
      root.style.setProperty("--accent", hslColors.light);
      root.style.setProperty("--accent-foreground", hslColors.text);

      // Set secondary colors
      root.style.setProperty("--secondary", hslColors.lighter);
      root.style.setProperty("--secondary-foreground", hslColors.text);

      // Set muted colors
      root.style.setProperty("--muted", hslColors.lighter);
      root.style.setProperty("--muted-foreground", hslColors.textLight);

      // Set ring color
      root.style.setProperty("--ring", hslColors.primary);
    }
  }, [hslColors]);

  return (
    <>
      <head>
        <meta name="theme-color" content={colors.primary} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content={colors.primary}
        />
      </head>
      <div
        className="flex justify-center items-center gap-2 text-primary-foreground p-4 animate-fade-in-slow"
        style={{ backgroundColor: colors.primary }}
      >
        <CurrencyLogo
          className="animate-fade-in-slow"
          logo={token.logo ?? community.community.logo}
          size={16}
        />
        <p className="animate-fade-in-slow text-lg font-bold">{token.name}</p>
      </div>
      {children}
    </>
  );
}
