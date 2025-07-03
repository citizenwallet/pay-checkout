import { getServiceRoleClient } from "@/db";
import { getPosByPlaceId } from "@/db/pos";

export const verifyPosAuth = async (
  placeId: number,
  account: string
): Promise<string> => {
  const client = getServiceRoleClient();

  const { data: pos, error: posError } = await getPosByPlaceId(
    client,
    placeId,
    account
  );

  if (posError) {
    console.error("Error fetching pos:", posError);
    throw new Error("Error fetching pos");
  }

  if (!pos) {
    throw new Error("Pos not found");
  }

  if (pos.type !== "app") {
    throw new Error("Pos is not an app");
  }

  if (pos.id.toLowerCase() !== account.toLowerCase()) {
    throw new Error("Invalid account");
  }

  if (pos.is_active === false) {
    throw new Error("Pos is not active");
  }

  return pos.id;
};
