import "server-only";

import { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";

export type SyncProvider = "stripe" | "viva" | "ponto";
export interface StripeProviderCredentials {
  secret_key: string;
  webhook_secret: string;
  price_id: string;
  publishable_key: string;
}

export interface VivaProviderCredentials {
  api_key: string;
  merchant_id: string;
  client_id: string;
  client_secret: string;
}

export interface PontoProviderCredentials {
  client_id: string;
  client_secret: string;
  account_id: string;
  iban: string;
  sync_expiry: string;
  sync_message_type: "structured" | "unstructured";
}

export type SyncStrategy = "payg" | "periodic";

export type PaygSyncStrategyConfig = null;

export type PeriodicSyncStrategyConfig = {
  target: number;
  reward: number;
  interval: number;
  interval_unit: "day" | "week" | "month" | "year";
  day_of_month?: number; // 1-31, only used when interval_unit is "month"
  day_of_week?: number; // 0-6 (Sunday-Saturday), only used when interval_unit is "week"
  hour?: number; // 0-23, hour of day to trigger
  minute?: number; // 0-59, minute of hour to trigger
};

export interface Treasury<
  S extends SyncProvider,
  SS extends SyncStrategy = "payg"
> {
  id: number;
  business_id: number;
  business: {
    legal_name: string | null;
    address_legal: string | null;
    image: string | null;
  };
  created_at: string;
  token: string;
  sync_provider: S;
  sync_provider_credentials: S extends "stripe"
    ? StripeProviderCredentials
    : S extends "viva"
    ? VivaProviderCredentials
    : S extends "ponto"
    ? PontoProviderCredentials
    : never;
  sync_strategy: SyncStrategy;
  sync_strategy_config: SS extends "payg"
    ? PaygSyncStrategyConfig
    : SS extends "periodic"
    ? PeriodicSyncStrategyConfig
    : PaygSyncStrategyConfig;
  sync_currency_symbol: string;
}

export interface PublicStripeTreasury {
  id: number;
  business_id: number;
  created_at: string;
  token: string;
  sync_provider: "stripe";
  price_id: string;
  publishable_key: string;
  business: {
    legal_name: string;
  };
}

export interface PublicPontoTreasury {
  id: number;
  business_id: number;
  created_at: string;
  token: string;
  sync_provider: "ponto";
  iban: string;
  target: number | null;
  business: {
    legal_name: string;
  };
}

export const getTreasury = async <S extends SyncProvider>(
  client: SupabaseClient,
  id: number,
  syncProvider: S
): Promise<PostgrestSingleResponse<Treasury<S> | null>> => {
  return client
    .from("treasury")
    .select("*, business:businesses(legal_name, address_legal, image)")
    .eq("id", id)
    .eq("sync_provider", syncProvider)
    .maybeSingle();
};

export const getTreasuryByToken = async <S extends SyncProvider>(
  client: SupabaseClient,
  syncProvider: S,
  token: string
): Promise<PostgrestSingleResponse<Treasury<S> | null>> => {
  return client
    .from("treasury")
    .select("*, business:businesses(legal_name, address_legal, image)")
    .eq("token", token)
    .eq("sync_provider", syncProvider)
    .limit(1)
    .maybeSingle();
};

/**
 * Returns the treasury that matches the businessId and token.
 * If there are multiple treasuries for the same token, it returns the first one based on the businessId.
 * If there are no treasuries for the token, it returns null.
 */
export const getTreasuryByBusinessId = async <S extends SyncProvider>(
  client: SupabaseClient,
  syncProvider: S,
  businessId: number,
  token: string
): Promise<PostgrestSingleResponse<Treasury<S> | null>> => {
  const result = await client
    .from("treasury")
    .select("*, business:businesses(legal_name, address_legal, image)")
    .eq("token", token)
    .eq("sync_provider", syncProvider);
  if (result.error) {
    throw result.error;
  }
  if (result.data.length === 0) {
    return { data: null, error: null, count: 0, status: 200, statusText: "OK" };
  }

  const preferredTreasury = result.data.find(
    (treasury) => treasury.business_id === businessId
  );

  // if this business id has no treasury for this token, return the first one
  if (!preferredTreasury) {
    return {
      data: result.data[0],
      error: null,
      count: 0,
      status: 200,
      statusText: "OK",
    };
  }

  // if this business id has a treasury for this token, return it
  return {
    data: preferredTreasury,
    error: null,
    count: result.data.length,
    status: 200,
    statusText: "OK",
  };
};

export const getPublicStripeTreasuryByBusinessId = async (
  client: SupabaseClient,
  businessId: number,
  token: string
): Promise<PostgrestSingleResponse<PublicStripeTreasury | null>> => {
  const result = await client
    .from("treasury")
    .select(
      "id, business_id, created_at, token, sync_provider, sync_provider_credentials->>price_id, sync_provider_credentials->>publishable_key, business:businesses(legal_name, address_legal, image)"
    )
    .eq("token", token)
    .eq("sync_provider", "stripe");
  if (result.error) {
    throw result.error;
  }
  if (result.data.length === 0) {
    return { data: null, error: null, count: 0, status: 200, statusText: "OK" };
  }

  const preferredTreasury = result.data.find(
    (treasury) => treasury.business_id === businessId
  );

  // if this business id has no treasury for this token, return the first one
  if (!preferredTreasury) {
    return {
      // @ts-expect-error wrong type inference
      data: result.data[0],
      error: null,
      count: 0,
      status: 200,
      statusText: "OK",
    };
  }

  // if this business id has a treasury for this token, return it
  return {
    // @ts-expect-error wrong type inference
    data: preferredTreasury,
    error: null,
    count: result.data.length,
    status: 200,
    statusText: "OK",
  };
};

export const getPublicPontoTreasuryByBusinessId = async (
  client: SupabaseClient,
  businessId: number,
  token: string
): Promise<PostgrestSingleResponse<PublicPontoTreasury | null>> => {
  const result = await client
    .from("treasury")
    .select(
      "id, business_id, created_at, token, sync_provider, sync_provider_credentials->>iban, sync_strategy_config->>target, business:businesses(legal_name, address_legal, image)"
    )
    .eq("token", token)
    .eq("sync_provider", "ponto");
  if (result.error) {
    throw result.error;
  }
  if (result.data.length === 0) {
    return { data: null, error: null, count: 0, status: 200, statusText: "OK" };
  }

  const preferredTreasury = result.data.find(
    (treasury) => treasury.business_id === businessId
  );

  const treasuryToReturn = preferredTreasury || result.data[0];

  if (!treasuryToReturn) {
    return { data: null, error: null, count: 0, status: 200, statusText: "OK" };
  }

  // Convert the target from string to number since PostgreSQL JSON extraction returns strings
  // @ts-expect-error wrong type inference
  const convertedTreasury: PublicPontoTreasury = {
    ...treasuryToReturn,
    target: treasuryToReturn.target ? Number(treasuryToReturn.target) : null,
  };

  return {
    data: convertedTreasury,
    error: null,
    count: result.data.length,
    status: 200,
    statusText: "OK",
  };
};

export const getPontoTreasuries = async (
  client: SupabaseClient
): Promise<PostgrestSingleResponse<Treasury<"ponto">[]>> => {
  return client
    .from("treasury")
    .select("*, business:businesses(legal_name, address_legal, image)")
    .eq("sync_provider", "ponto");
};
