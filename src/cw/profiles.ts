import "server-only";

import {
  BundlerService,
  CommunityConfig,
  formatProfileImageLinks,
  getAccountAddress,
  getProfileFromAddress,
  getProfileUriFromId,
  Profile,
} from "@citizenwallet/sdk";
import { Wallet } from "ethers";
import { pinFileToIPFS, pinJSONToIPFS, unpin } from "@/services/pinata/pinata";
import { resizeImageFromUrl } from "@/services/images";
import { getCidFromUri } from "@/utils/ipfs";

export const upsertProfile = async (
  community: CommunityConfig,
  username: string,
  name: string,
  account: string,
  description: string,
  image?: string | null
) => {
  const ipfsDomain = process.env.IPFS_DOMAIN;
  if (!ipfsDomain) {
    throw new Error("IPFS domain not found");
  }

  const existingProfile = await getProfileFromAddress(
    ipfsDomain,
    community,
    account
  );

  const defaultCardProfileImage =
    process.env.DEFAULT_SHOP_PROFILE_IMAGE_IPFS_HASH;
  if (!defaultCardProfileImage) {
    throw new Error("Default shop profile image not found");
  }

  const profileManagerPrivateKey = process.env.PROFILE_MANAGER_PRIVATE_KEY;
  if (!profileManagerPrivateKey) {
    throw new Error("Profile manager private key not found");
  }

  const signer = new Wallet(profileManagerPrivateKey);

  const profileManagerAddress = await getAccountAddress(
    community,
    signer.address
  );
  if (!profileManagerAddress) {
    throw new Error("Failed to get profile manager address");
  }

  let image_small = `ipfs://${defaultCardProfileImage}`;
  if (image) {
    // process image down to 128x128
    const imageFile = await resizeImageFromUrl(image, 256);

    const cid = await pinFileToIPFS(imageFile);

    if (!cid) {
      throw new Error("Failed to pin image to IPFS");
    }

    image_small = `ipfs://${cid}`;
  }

  let image_medium = `ipfs://${defaultCardProfileImage}`;
  if (image) {
    const imageFile = await resizeImageFromUrl(image, 512);

    const cid = await pinFileToIPFS(imageFile);
    if (!cid) {
      throw new Error("Failed to pin image to IPFS");
    }

    image_medium = `ipfs://${cid}`;
  }

  let image_large = `ipfs://${defaultCardProfileImage}`;
  if (image) {
    const imageFile = await resizeImageFromUrl(image, 1024);

    const cid = await pinFileToIPFS(imageFile);
    if (!cid) {
      throw new Error("Failed to pin image to IPFS");
    }

    image_large = `ipfs://${cid}`;
  }

  const profile: Profile = {
    username: username.toLowerCase(),
    name,
    account,
    description,
    image_small,
    image_medium,
    image: image_large,
  };

  const formattedProfile = formatProfileImageLinks(
    `https://${ipfsDomain}`,
    profile
  );

  const response = await pinJSONToIPFS(formattedProfile);

  if (!response) {
    throw new Error("Failed to pin profile");
  }

  // Unpin the existing profile if it exists
  if (existingProfile) {
    const uri = await getProfileUriFromId(
      community,
      BigInt(existingProfile.token_id)
    );

    if (uri) {
      const response = await unpin(uri);

      if (!response?.ok) {
        console.error("Failed to unpin profile", response);
      }
    }

    const smallCid = getCidFromUri(existingProfile.image_small);
    const mediumCid = getCidFromUri(existingProfile.image_medium);
    const largeCid = getCidFromUri(existingProfile.image);

    const toUnpin = [];
    if (smallCid !== defaultCardProfileImage) {
      toUnpin.push(smallCid);
    }
    if (mediumCid !== defaultCardProfileImage) {
      toUnpin.push(mediumCid);
    }
    if (largeCid !== defaultCardProfileImage) {
      toUnpin.push(largeCid);
    }

    await Promise.all(toUnpin.map(unpin));
  }

  const bundler = new BundlerService(community);

  await bundler.setProfile(
    signer,
    profileManagerAddress,
    profile.account,
    profile.username,
    response
  );
};
