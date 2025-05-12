"use server";

import { track } from "@vercel/analytics/server";

export const openAppAction = async (isInstalled: boolean) => {
  await track("open_app", {
    isInstalled,
  });
};

export const installAppAction = async (
  storeName: "play-store" | "app-store"
) => {
  await track("install_app", {
    storeName,
  });
};
