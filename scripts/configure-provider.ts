import {
  CommunityConfig,
  createInstanceCallData,
  instanceOwner,
  updateInstanceContractsCallData,
} from "@citizenwallet/sdk";
import { Wallet, ZeroAddress } from "ethers";
import { BundlerService, getAccountAddress } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";

interface CommunityWithContracts {
  community: CommunityConfig;
  contracts: string[];
}

/**
 * This script is used to configure the card manager for the community.
 * It will create or update the card manager for the community.
 * It will also add the primary token and profile to the card manager.
 * It will also add the primary token and profile to the card manager.
 */
const main = async () => {
  const community = new CommunityConfig(Config);

  console.log("community", community);

  const privateKey = process.env.CARD_MANAGER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Private key is not set");
  }

  const signer = new Wallet(privateKey);

  const cardConfig = community.primarySafeCardConfig;

  const cardManagerMap: Record<string, CommunityWithContracts> = {};

  const instance = `${cardConfig.chain_id}:${cardConfig.address}:${cardConfig.instance_id}`;

  if (!cardManagerMap[instance]) {
    const contracts: string[] = [];

    contracts.push(community.primaryToken.address);
    contracts.push(community.community.profile.address);

    cardManagerMap[instance] = {
      community,
      contracts,
    };
  }

  cardManagerMap[instance].contracts.push(community.primaryToken.address);
  cardManagerMap[instance].contracts.push(community.community.profile.address);

  console.log("creating,", Object.values(cardManagerMap).length, "instances");
  for (const communityMap of Object.values(cardManagerMap)) {
    const signerAccountAddress = await getAccountAddress(
      communityMap.community,
      signer.address
    );
    if (!signerAccountAddress) {
      throw new Error("Could not find an account for you!");
    }

    const bundler = new BundlerService(communityMap.community);
    const cardConfig = communityMap.community.primarySafeCardConfig;

    console.log("contracts", communityMap.contracts);

    const owner = await instanceOwner(communityMap.community);
    if (owner === ZeroAddress) {
      const ccalldata = createInstanceCallData(
        communityMap.community,
        communityMap.contracts
      );

      const hash = await bundler.call(
        signer,
        cardConfig.address,
        signerAccountAddress,
        ccalldata
      );

      console.log("submitted:", hash);

      await bundler.awaitSuccess(hash);

      console.log("Instance created");

      continue;
    }

    const calldata = updateInstanceContractsCallData(
      communityMap.community,
      communityMap.contracts
    );

    const hash = await bundler.call(
      signer,
      cardConfig.address,
      signerAccountAddress,
      calldata
    );

    console.log("submitted:", hash);

    await bundler.awaitSuccess(hash);

    console.log("Instance updated");
  }
};

main();
