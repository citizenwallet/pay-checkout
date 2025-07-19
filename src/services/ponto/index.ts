export const PONTO_API_URL = "https://api.myponto.com";

import { Treasury } from "@/db/treasury";
import { PontoTransaction } from "./transaction";

export interface PontoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface PontoErrorResponse {
  error: string;
  error_description?: string;
}

export interface PontoTransactionsResponse {
  data: PontoTransaction[];
  meta: {
    paging: {
      after: string | null;
      before: string | null;
      limit: number;
    };
  };
  synchronizedAt: string;
}

/**
 * Fetches an access token from Ponto using client credentials flow
 */
export async function fetchPontoAccessToken(
  clientId: string,
  clientSecret: string
): Promise<PontoTokenResponse> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );

  const response = await fetch(`${PONTO_API_URL}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const errorData: PontoErrorResponse = await response.json();
    throw new Error(
      `Ponto token request failed: ${errorData.error} - ${
        errorData.error_description || ""
      }`
    );
  }

  const tokenData: PontoTokenResponse = await response.json();
  return tokenData;
}

/**
 * Fetches an access token using treasury credentials
 */
export async function fetchPontoAccessTokenFromTreasury(
  treasury: Treasury<"ponto">
): Promise<PontoTokenResponse> {
  const { client_id, client_secret } = treasury.sync_provider_credentials;
  return fetchPontoAccessToken(client_id, client_secret);
}

/**
 * Creates a Ponto API client with automatic token management
 */
export class PontoClient {
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private clientId: string;
  private clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Gets a valid access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string> {
    const now = Date.now();

    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiresAt && now < this.tokenExpiresAt) {
      return this.accessToken;
    }

    // Fetch new token
    const tokenData = await fetchPontoAccessToken(
      this.clientId,
      this.clientSecret
    );
    this.accessToken = tokenData.access_token;
    this.tokenExpiresAt = now + tokenData.expires_in * 1000;

    return this.accessToken;
  }

  /**
   * Makes an authenticated request to the Ponto API
   */
  async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAccessToken();

    const response = await fetch(`${PONTO_API_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Ponto API request failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async getTransactions(
    accountId: string,
    options: {
      after?: string;
      before?: string;
    } = {}
  ): Promise<PontoTransactionsResponse> {
    const query = new URLSearchParams();
    if (options.after) {
      query.set("after", options.after);
    }
    if (options.before) {
      query.set("before", options.before);
    }

    const response = await this.makeRequest<PontoTransactionsResponse>(
      `/accounts/${accountId}/transactions${
        query.size > 0 ? `?${query.toString()}` : ""
      }`,
      {
        method: "GET",
      }
    );

    return response;
  }
}

/**
 * Creates a Ponto client from treasury credentials
 */
export function createPontoClientFromTreasury(
  treasury: Treasury<"ponto">
): PontoClient {
  const { client_id, client_secret } = treasury.sync_provider_credentials;
  return new PontoClient(client_id, client_secret);
}
