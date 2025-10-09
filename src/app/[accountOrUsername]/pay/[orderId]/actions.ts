"use server";

import { track } from "@vercel/analytics/server";

export const tryOpenAppAction = async () => {
  await track("try_open_app");
};

export const retryOpenAppAction = async () => {
  await track("retry_open_app");
};

export const errorOpenAppAction = async () => {
  await track("error_open_app");
};

export const installAppAction = async (
  storeName: "play-store" | "app-store"
) => {
  await track("install_app", {
    storeName,
  });
};
