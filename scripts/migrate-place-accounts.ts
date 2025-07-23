import {
  BundlerService,
  CommunityConfig,
  getAccountBalance,
  getCardAddress,
} from "@citizenwallet/sdk";
import { formatUnits, id, Wallet } from "ethers";
import { getAccountAddress } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { updatePlaceAccounts } from "@/db/places";

const getServiceRoleClient = (): SupabaseClient => {
  return createClient(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

/**
 * This script is used to configure the card manager for the community.
 * It will create or update the card manager for the community.
 * It will also add the primary token and profile to the card manager.
 * It will also add the primary token and profile to the card manager.
 */
const main = async () => {
  console.log("Starting balance migration");

  const community = new CommunityConfig(Config);

  const privateKey = process.env.FAUCET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Private key is not set");
  }

  const signer = new Wallet(privateKey);

  // const cardConfig = community.primarySafeCardConfig;

  const signerAccountAddress = await getAccountAddress(
    community,
    signer.address
  );

  if (!signerAccountAddress) {
    throw new Error("Signer account address is not set");
  }

  console.log(
    "account address that will be used to mint/burn: ",
    signerAccountAddress
  );

  const client = getServiceRoleClient();

  const { data: places, error: placesError } = await client
    .from("places")
    .select("id, business_id, name, accounts")
    .eq("hidden", false)
    .neq("id", 2)
    .order("name", { ascending: true });

  if (placesError) {
    throw new Error("Error getting places", placesError);
  }

  for (const place of places) {
    console.log("migrating place", place.name);

    const [account] = place.accounts;

    if (!account) {
      console.log("no account found for place, skipping");
      continue;
    }

    const tokens = Object.values(community.tokens);

    for (const token of tokens) {
      console.log("token: ", token.symbol);

      const balance = await getAccountBalance(community, account, {
        tokenAddress: token.address,
      });

      if (!balance || balance === BigInt(0)) {
        console.log("no balance found for token, skipping");
        continue;
      }

      const formattedBalance = formatUnits(balance, token.decimals);

      console.log("balance: ", formattedBalance);

      const hashedSerial = id(`${place.business_id}:${place.id}`);

      const cardAddress = await getCardAddress(community, hashedSerial);

      if (!cardAddress) {
        console.log("no card address found for place, skipping");
        continue;
      }

      console.log(account, "->", cardAddress);

      const bundler = new BundlerService(community);

      console.log("burning tokens");

      try {
        const burnTx = await bundler.burnFromERC20Token(
          signer,
          token.address,
          signerAccountAddress,
          account,
          formattedBalance,
          `Migrating ${formattedBalance} ${token.symbol} from ${place.name} old account ${account} to ${cardAddress}`
        );

        await bundler.awaitSuccess(burnTx);
      } catch (error) {
        console.error("Error burning tokens", error);
      }

      console.log("minting tokens");

      try {
        const mintTx = await bundler.mintERC20Token(
          signer,
          token.address,
          signerAccountAddress,
          cardAddress,
          formattedBalance,
          `Migrating ${formattedBalance} ${token.symbol} from ${place.name} old account ${account} to ${cardAddress}`
        );

        await bundler.awaitSuccess(mintTx);
      } catch (error) {
        console.error("Error minting tokens", error);
      }

      console.log("updating place accounts");

      const { error: updateError } = await client
        .from("places")
        .update({ accounts: [cardAddress] })
        .eq("id", place.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating place accounts", updateError);
        continue;
      }

      console.log(
        "migrated",
        formattedBalance,
        token.symbol,
        "to",
        cardAddress
      );
    }
  }
};

main();
