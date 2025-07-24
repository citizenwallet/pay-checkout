import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import {
  BundlerService,
  formatProfileImageLinks,
  getAccountAddress,
  getCardAddress,
  getProfileFromAddress,
  getProfileUriFromId,
  Profile,
  verifyAndSuggestUsername,
  verifyConnectedHeaders,
} from "@citizenwallet/sdk";
import { CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { getCardBySerial } from "@/db/cards";
import { id, Wallet } from "ethers";
import { pinJSONToIPFS, unpin } from "@/services/pinata/pinata";

interface CardProfileRequest {
  name: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ serial: string }> }
) {
  try {
    // Extract the accountOrUsername from the params object
    const { serial } = await params;

    const body = await request.json();
    const { name } = body as CardProfileRequest;

    const community = new CommunityConfig(Config);

    let verifiedAccount: string | null = null;
    try {
      verifiedAccount = await verifyConnectedHeaders(
        community,
        request.headers
      );

      if (!verifiedAccount) {
        throw new Error("Invalid signature");
      }
    } catch (error) {
      console.error("Account verification error:", error);
      return NextResponse.json(
        { error: "Account verification failed" },
        { status: 401 }
      );
    }

    if (verifiedAccount === null) {
      return NextResponse.json(
        { error: "Account verification failed" },
        { status: 401 }
      );
    }

    if (!isValidRequestData(serial, name)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const client = getServiceRoleClient();

    const { data: card, error: cardError } = await getCardBySerial(
      client,
      serial
    );

    if (cardError) {
      return NextResponse.json({ error: cardError.message }, { status: 500 });
    }

    if (card === null || card.owner === null) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    if (
      card !== null &&
      card.owner !== null &&
      card.owner.toLowerCase() !== verifiedAccount.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Card already claimed" },
        { status: 400 }
      );
    }

    const cardAddress = await getCardAddress(community, id(serial));
    if (!cardAddress) {
      return NextResponse.json(
        { error: "Failed to get card address" },
        { status: 500 }
      );
    }

    const ipfsDomain = process.env.IPFS_DOMAIN;
    if (!ipfsDomain) {
      return NextResponse.json(
        { error: "IPFS domain not found" },
        { status: 500 }
      );
    }

    const existingProfile = await getProfileFromAddress(
      ipfsDomain,
      community,
      cardAddress
    );

    const defaultCardProfileImage =
      process.env.DEFAULT_CARD_PROFILE_IMAGE_IPFS_HASH;
    if (!defaultCardProfileImage) {
      return NextResponse.json(
        { error: "Default card profile image not found" },
        { status: 500 }
      );
    }

    const profileManagerPrivateKey = process.env.PROFILE_MANAGER_PRIVATE_KEY;
    if (!profileManagerPrivateKey) {
      return NextResponse.json(
        { error: "Profile manager private key not found" },
        { status: 500 }
      );
    }

    const signer = new Wallet(profileManagerPrivateKey);

    const profileManagerAddress = await getAccountAddress(
      community,
      signer.address
    );
    if (!profileManagerAddress) {
      return NextResponse.json(
        { error: "Failed to get profile manager address" },
        { status: 500 }
      );
    }

    const username = await verifyAndSuggestUsername(
      community,
      `card-${name}`.toLowerCase()
    );
    if (!username) {
      return NextResponse.json(
        { error: "Failed to suggest username" },
        { status: 500 }
      );
    }

    const profile: Profile = {
      username: username.toLowerCase(),
      name,
      account: cardAddress,
      description: "Ceci n'est pas une carte",
      image_small: defaultCardProfileImage,
      image_medium: defaultCardProfileImage,
      image: defaultCardProfileImage,
    };

    const formattedProfile = formatProfileImageLinks(
      `https://${ipfsDomain}`,
      profile
    );

    const response = await pinJSONToIPFS(formattedProfile);

    if (!response) {
      return NextResponse.json(
        { error: "Failed to pin profile" },
        { status: 500 }
      );
    }

    // Unpin the existing profile if it exists
    if (existingProfile) {
      const uri = await getProfileUriFromId(
        community,
        BigInt(existingProfile.token_id)
      );

      if (!uri) {
        return NextResponse.json(
          { error: "Failed to get profile URI" },
          { status: 500 }
        );
      }

      const response = await unpin(uri);

      if (!response?.ok) {
        return NextResponse.json(
          { error: "Failed to unpin profile" },
          { status: 500 }
        );
      }
    }

    const bundler = new BundlerService(community);

    const tx = await bundler.setProfile(
      signer,
      profileManagerAddress,
      profile.account,
      profile.username,
      response
    );

    await bundler.awaitSuccess(tx);

    return NextResponse.json(formattedProfile, { status: 200 });
  } catch (err) {
    console.error("Error in generate-order API:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * Validates the request data types and format
 */
function isValidRequestData(serial: string, name: string): boolean {
  return (
    typeof serial === "string" &&
    serial.length > 0 &&
    typeof name === "string" &&
    name.length > 0
  );
}
