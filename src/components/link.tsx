"use client";

import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface LinkProps extends ComponentProps<typeof NextLink> {
  activeClassName?: string;
}

export function Link({ className, children, href, ...props }: LinkProps) {
  const router = useRouter();

  return (
    <NextLink
      className={cn("transition-opacity active:opacity-40", className)}
      href={href}
      onClick={(e) => {
        e.preventDefault();
        // Add a very slight delay to allow the active state to show
        requestAnimationFrame(() => {
          router.push(href.toString());
        });
      }}
      {...props}
    >
      {children}
    </NextLink>
  );
}
