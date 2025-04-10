import { NextResponse, NextRequest } from "next/server";
import { getServiceRoleClient } from "@/db";
import { createOrder } from "@/db/orders";
import { getItemsForPlace } from "@/db/items";
import { verifyConnectedHeaders } from "../../../pos/[account]/orders/route";
import { CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";

/**
 * POST /api/v1/accounts/[account]/orders/createOrder
 *
 * Creates a new order for a specific place with the given items and details.
 *
 * @param {Object} request - The Next.js request object containing the order details
 * @param {Object} request.body - The request body containing order information
 * @param {number} request.body.placeId - The ID of the place where the order is being created
 * @param {Array} request.body.items - Array of items in the order
 * @param {string} request.body.description - Description of the order
 * @param {number} request.body.total - Total amount of the order
 * @param {string|null} request.body.account - The account address associated with the order
 * @param {string|null} request.body.type - The type of order (web, app, terminal, or pos)
 *
 * @returns {Object} Response object containing either:
 *   - Success: { data: { id: number } } with status 200
 *   - Error: { error: string, status: number } with appropriate error status
 *
 * @example
 * // Request body
 * {
 *   "placeId": 123,
 *   "items": [
 *     { "id": 456, "quantity": 2 }
 *   ],
 *   "description": "Coffee and pastry",
 *   "total": 25.50,
 *   "account": "0x...",
 *   "type": "web"
 * }
 *
 * // Success Response
 * {
 *   "data": { "id": 789 }
 * }
 *
 * // Error Response
 * {
 *   "error": "Invalid request data",
 *   "status": 400
 * }
 */

export async function POST(request: NextRequest) {
  let verifiedAccount: string | null = null;
  let config: CommunityConfig;

  try {
    config = await new CommunityConfig(Config);

    verifiedAccount = await verifyConnectedHeaders(config, request.headers);

  } catch (error: any) {
    console.error("Signature verification error:", error);

    let status = 401;
    let message = "Authentication failed.";

    if (error.message.includes("missing")) {
      status = 400;
      message = `Missing required signature headers: ${error.message}`;
    } else if (error.message.includes("expired")) {
      status = 401;
      message = "Signature expired.";
    } else if (error.message.includes("Invalid signature")) {
      status = 401;
      message = "Invalid signature or account ownership verification failed.";
    } else {
      message = error.message || "An unknown authentication error occurred.";
    }

    return NextResponse.json({ error: message }, { status });
  }

  if (!verifiedAccount) {
    return NextResponse.json(
      { error: "Account verification failed." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { placeId, items, description, total, account, type } = body;

    if (!account || account.toLowerCase() !== verifiedAccount.toLowerCase()) {
      console.warn(
        `Account mismatch: Header=${verifiedAccount}, Body=${account}`
      );
      return NextResponse.json(
        { error: "Account mismatch between signature and request body." },
        { status: 401 }
      );
    }

    if (
      !isValidRequestData(placeId, items, description, total, account, type)
    ) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    if (!isValidItemsFormat(items)) {
      return NextResponse.json(
        { error: "Invalid item format" },
        { status: 400 }
      );
    }

    const client = getServiceRoleClient();

    const { data: availableItems, error: fetchError } = await getItemsForPlace(
      client,
      placeId
    );
    if (fetchError) {
      console.error("Error fetching items:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const availableItemIds = new Set(availableItems.map((item) => item.id));
    const invalidItem = items.find(
      (item: { id: number }) => !availableItemIds.has(item.id)
    );
    if (invalidItem) {
      return NextResponse.json(
        { error: `Invalid item ID: ${invalidItem.id}` },
        { status: 400 }
      );
    }

    const { data: orderData, error: orderError } = await createOrder(
      client,
      placeId,
      total,
      items,
      description,
      account,
      type
    );

    if (orderError) {
      console.error("Error creating order:", orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    console.log("Order created successfully:", orderData);

    return NextResponse.json({ orderId: orderData.id }, { status: 200 });
  } catch (err: any) {
    console.error("Error in POST /generate-order:", err);
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { placeId, items, description, total, account, type } = body;

//     const sigAuthAccount = request.headers.get("x-sigauth-account");
//     const sigAuthExpiry = request.headers.get("x-sigauth-expiry");
//     const sigAuthSignature = request.headers.get("x-sigauth-signature");

//     try {
//       if (!sigAuthAccount || !sigAuthExpiry || !sigAuthSignature) {
//         return NextResponse.json(
//           { error: "Missing signature headers" },
//           { status: 401 }
//         );
//       }

//       const expiryTime = new Date(sigAuthExpiry).getTime();
//       const currentTime = new Date().getTime();

//       if (currentTime > expiryTime) {
//         return NextResponse.json(
//           { error: "Signature expired" },
//           { status: 401 }
//         );
//       }

//       if (account && account.toLowerCase() !== sigAuthAccount.toLowerCase()) {
//         return NextResponse.json(
//           { error: "Account mismatch" },
//           { status: 401 }
//         );
//       }
//     } catch (error) {
//       console.error("Account verification error:", error);
//       return NextResponse.json(
//         { error: "Account verification failed" },
//         { status: 401 }
//       );
//     }

//     if (
//       !isValidRequestData(placeId, items, description, total, account, type)
//     ) {
//       return NextResponse.json(
//         { error: "Invalid request data" },
//         { status: 400 }
//       );
//     }

//     if (!isValidItemsFormat(items)) {
//       return NextResponse.json(
//         { error: "Invalid item format" },
//         { status: 400 }
//       );
//     }

//     const client = getServiceRoleClient();

//     const { data: availableItems, error } = await getItemsForPlace(
//       client,
//       placeId
//     );
//     if (error) {
//       return NextResponse.json({ error: error.message }, { status: 500 });
//     }

//     const availableItemIds = new Set(availableItems.map((item) => item.id));
//     const invalidItem = items.find(
//       (item: { id: number }) => !availableItemIds.has(item.id)
//     );
//     if (invalidItem) {
//       return NextResponse.json(
//         { error: "Invalid item ID: ${invalidItem.id}" },
//         { status: 400 }
//       );
//     }

//     const { data: orderData, error: orderError } = await createOrder(
//       client,
//       placeId,
//       total,
//       items,
//       description,
//       account,
//       type
//     );

//     if (orderError) {
//       return NextResponse.json({ error: orderError.message }, { status: 500 });
//     }

//     console.log("orderData", orderData);

//     return NextResponse.json({ orderId: orderData.id }, { status: 200 });
//   } catch (err) {
//     console.error("Error in generate-order API:", err);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: NextRequest) {
//     try {
//       const body = await request.json();
//       const { placeId, items, description, total, account, type } = body;

//       const headers = new Headers({
//         "x-sigauth-account": request.headers.get("x-sigauth-account") || "",
//         "x-sigauth-expiry": request.headers.get("x-sigauth-expiry") || "",
//         "x-sigauth-signature": request.headers.get("x-sigauth-signature") || "",
//         "x-sigauth-redirect": request.headers.get("x-sigauth-redirect") || "",
//       });
//   console.log("BE 1");
//       console.log(headers);

//       let verifiedAccount: string | null = null;
//       try {
//         console.log("BE 1.1");
//         const communityConfig = new CommunityConfig(Config);
//         console.log("BE 1.2");
//         verifiedAccount = await verifyConnectedHeaders(
//           communityConfig,
//           headers as any
//         );
//         console.log("BE 2");
//         console.log("verifiedAccount", verifiedAccount);
//         if (!verifiedAccount) {
//           console.log("BE 3");
//           console.log("ERROR");
//           throw new Error("Signature verification failed.");
//         }

//         if (!account || account.toLowerCase() !== verifiedAccount.toLowerCase()) {
//           console.warn(
//             `Account mismatch: Body account '${account}' != Verified header account '${verifiedAccount}'`
//           );
//           return NextResponse.json(
//             { error: "Account mismatch between body and signature" },
//             { status: 401 }
//           );
//         }

//         console.log(`Signature verified for account: ${verifiedAccount}`);

//       } catch (error: any) {

//         console.error("Signature verification error:", error.message);

//         return NextResponse.json(
//           { error: `Authentication failed: ${error.message}` },
//           { status: 401 }
//         );
//       }

//       if (
//         !isValidRequestData(
//           placeId,
//           items,
//           description,
//           total,
//           verifiedAccount,
//           type
//         )
//       ) {
//         return NextResponse.json(
//           { error: "Invalid request data" },
//           { status: 400 }
//         );
//       }

//       if (!isValidItemsFormat(items)) {
//         return NextResponse.json(
//           { error: "Invalid item format" },
//           { status: 400 }
//         );
//       }

//       const client = getServiceRoleClient();

//       const { data: availableItems, error } = await getItemsForPlace(
//         client,
//         placeId
//       );
//       if (error) {
//         return NextResponse.json({ error: error.message }, { status: 500 });
//       }

//       const availableItemIds = new Set(availableItems.map((item) => item.id));
//       const invalidItem = items.find(
//         (item: { id: number }) => !availableItemIds.has(item.id)
//       );
//       if (invalidItem) {
//         return NextResponse.json(
//           { error: `Invalid item ID: ${invalidItem.id}` },
//           { status: 400 }
//         );
//       }

//       const { data: orderData, error: orderError } = await createOrder(
//         client,
//         placeId,
//         total,
//         items,
//         description,
//         verifiedAccount,
//         type
//       );

//       if (orderError) {
//         return NextResponse.json({ error: orderError.message }, { status: 500 });
//       }

//       console.log("orderData", orderData);

//       return NextResponse.json({ orderId: orderData.id }, { status: 200 });
//     } catch (err: any) {
//       console.error("Error in generate-order API:", err);
//       return NextResponse.json(
//         { error: "Internal Server Error" },
//         { status: 500 }
//       );
//     }
//   }

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.json();
//     const { placeId, items, description, total, account, type } = body;

//     const sigAuthAccount = request.headers.get("x-sigauth-account");
//     const sigAuthExpiry = request.headers.get("x-sigauth-expiry");
//     const sigAuthSignature = request.headers.get("x-sigauth-signature");

//     try {
//       if (!sigAuthAccount || !sigAuthExpiry || !sigAuthSignature) {
//         return NextResponse.json(
//           { error: "Missing signature headers" },
//           { status: 401 }
//         );
//       }

//       const expiryTime = new Date(sigAuthExpiry).getTime();
//       const currentTime = new Date().getTime();

//       if (currentTime > expiryTime) {
//         return NextResponse.json(
//           { error: "Signature expired" },
//           { status: 401 }
//         );
//       }

//       if (account && account.toLowerCase() !== sigAuthAccount.toLowerCase()) {
//         return NextResponse.json(
//           { error: "Account mismatch" },
//           { status: 401 }
//         );
//       }
//     } catch (error) {
//       console.error("Account verification error:", error);
//       return NextResponse.json(
//         { error: "Account verification failed" },
//         { status: 401 }
//       );
//     }

//     if (
//       !isValidRequestData(placeId, items, description, total, account, type)
//     ) {
//       return NextResponse.json(
//         { error: "Invalid request data" },
//         { status: 400 }
//       );
//     }

//     if (!isValidItemsFormat(items)) {
//       return NextResponse.json(
//         { error: "Invalid item format" },
//         { status: 400 }
//       );
//     }

//     const client = getServiceRoleClient();

//     const { data: availableItems, error } = await getItemsForPlace(
//       client,
//       placeId
//     );
//     if (error) {
//       return NextResponse.json({ error: error.message }, { status: 500 });
//     }

//     const availableItemIds = new Set(availableItems.map((item) => item.id));
//     const invalidItem = items.find(
//       (item: { id: number }) => !availableItemIds.has(item.id)
//     );
//     if (invalidItem) {
//       return NextResponse.json(
//         { error: "Invalid item ID: ${invalidItem.id}" },
//         { status: 400 }
//       );
//     }

//     const { data: orderData, error: orderError } = await createOrder(
//       client,
//       placeId,
//       total,
//       items,
//       description,
//       account,
//       type
//     );

//     if (orderError) {
//       return NextResponse.json({ error: orderError.message }, { status: 500 });
//     }

//     console.log("orderData", orderData);

//     return NextResponse.json({ orderId: orderData.id }, { status: 200 });
//   } catch (err) {
//     console.error("Error in generate-order API:", err);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

/**
 * Validates the request data types and format
 */
function isValidRequestData(
  placeId: number,
  items: { id: number; quantity: number }[],
  description: string,
  total: number,
  account: string | null,
  type: string | null
): boolean {
  return (
    typeof placeId === "number" &&
    Array.isArray(items) &&
    typeof description === "string" &&
    typeof total === "number" &&
    (account === null || typeof account === "string") &&
    (type === null || ["web", "app", "terminal", "pos"].includes(type))
  );
}

/**
 * Validates the format of items in the request
 */
function isValidItemsFormat(
  items: { id: number; quantity: number }[]
): boolean {
  return items.every(
    (item) =>
      typeof item === "object" &&
      typeof item.id === "number" &&
      typeof item.quantity === "number"
  );
}
