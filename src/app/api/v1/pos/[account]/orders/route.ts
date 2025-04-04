import { CommunityConfig, verifyAccountOwnership } from "@citizenwallet/sdk";
import { hashMessage, Signer } from "ethers";

export const generateConnectionMessage = (
  accountAddress: string,
  expiryTimeStamp: string,
  redirectUrl?: string
): string => {
  const message = `Signature auth for ${accountAddress} with expiry ${expiryTimeStamp}${redirectUrl ? ` and redirect ${encodeURIComponent(redirectUrl)}` : ''}`;
  return hashMessage(message);
};

export const createConnectedUrl = async (
  url: string,
  signer: Signer,
  accountAddress: string,
  expiryTimeStamp: string,
  redirectUrl?: string
): Promise<string> => {
  const message = generateConnectionMessage(
    accountAddress,
    expiryTimeStamp,
    redirectUrl
  );
  const signature = await signer.signMessage(message);

  const params = new URLSearchParams({
    sigAuthAccount: accountAddress,
    sigAuthExpiry: expiryTimeStamp,
    sigAuthSignature: signature,
    sigAuthRedirect: redirectUrl || '',
  });

  return url.includes("?")
    ? `${url}&${params.toString()}`
    : `${url}?${params.toString()}`;
};

export const verifyConnectedHeaders = async (
  config: CommunityConfig,
  headers: {
    "x-sigauth-account": string;
    "x-sigauth-expiry": string;
    "x-sigauth-signature": string;
    "x-sigauth-redirect"?: string;
  }
): Promise<string | null> => {
  const { "x-sigauth-account": account, "x-sigauth-expiry": expiry, "x-sigauth-signature": signature, "x-sigauth-redirect": redirect } = headers;

  if (!account || !expiry || !signature) {
    const missingHeaders = [
      !account && "x-sigauth-account",
      !expiry && "x-sigauth-expiry",
      !signature && "x-sigauth-signature",
    ].filter(Boolean);

    throw new Error(`Invalid connection request: missing ${missingHeaders.join(", ")}`);
  }

  if (new Date(expiry).getTime() < Date.now()) {
    throw new Error("Connection request expired");
  }

  const message = generateConnectionMessage(account, expiry, redirect);

  const verified = await verifyAccountOwnership(
    config,
    account,
    message,
    signature
  );

  if (!verified) {
    throw new Error("Invalid signature or account ownership verification failed");
  }

  return verified ? account : null;
};


// import { hashMessage, Signer } from "ethers";
// import { CommunityConfig } from "../config";
// import { verifyAccountOwnership } from "../accounts";

// export const generateConnectionMessage = (
//   accountAddress: string,
//   expiryTimeStamp: string,
//   redirectUrl: string
// ): string => {
//   const message = `Signature auth for ${accountAddress} with expiry ${expiryTimeStamp} and redirect ${encodeURIComponent(
//     redirectUrl
//   )}`;

//   return hashMessage(message);
// };

// export const createConnectedUrl = async (
//   url: string,
//   signer: Signer,
//   accountAddress: string,
//   expiryTimeStamp: string,
//   redirectUrl: string
// ): Promise<string> => {
//   const message = generateConnectionMessage(
//     accountAddress,
//     expiryTimeStamp,
//     redirectUrl
//   );
//   const signature = await signer.signMessage(message);

//   const params = new URLSearchParams({
//     sigAuthAccount: accountAddress,
//     sigAuthExpiry: expiryTimeStamp,
//     sigAuthSignature: signature,
//     sigAuthRedirect: redirectUrl,
//   });

//   return url.includes("?")
//     ? `${url}&${params.toString()}`
//     : `${url}?${params.toString()}`;
// };

// export const verifyConnectedUrl = async (
//   config: CommunityConfig,
//   options: {
//     url?: string;
//     params?: URLSearchParams;
//   }
// ): Promise<string | null> => {
//   if (!options.url && !options.params) {
//     throw new Error("Either url or params must be provided");
//   }

//   const params =
//     options.params || new URLSearchParams(options.url?.split("?")[1]);
//   const sigAuthAccount = params.get("sigAuthAccount");
//   const sigAuthExpiry = params.get("sigAuthExpiry");
//   const sigAuthSignature = params.get("sigAuthSignature");
//   const sigAuthRedirect = params.get("sigAuthRedirect");

//   if (
//     !sigAuthAccount ||
//     !sigAuthExpiry ||
//     !sigAuthSignature ||
//     !sigAuthRedirect
//   ) {
//     const missingParams = [
//       !sigAuthAccount && "sigAuthAccount",
//       !sigAuthExpiry && "sigAuthExpiry",
//       !sigAuthSignature && "sigAuthSignature",
//       !sigAuthRedirect && "sigAuthRedirect",
//     ].filter(Boolean);

//     throw new Error(
//       `Invalid connection request: missing ${missingParams.join(", ")}`
//     );
//   }

//   // check the expiry time
//   if (new Date(sigAuthExpiry).getTime() < Date.now()) {
//     throw new Error("Connection request expired");
//   }

//   const message = generateConnectionMessage(
//     sigAuthAccount,
//     sigAuthExpiry,
//     sigAuthRedirect
//   );

//   const verified = await verifyAccountOwnership(
//     config,
//     sigAuthAccount,
//     message,
//     sigAuthSignature
//   );

//   return verified ? sigAuthAccount : null;
// };