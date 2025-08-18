import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/db";
import { getAllPlaces } from "@/db/places";

/**
 * GET /api/v1/places
 *
 * Returns all places.
 *
 * @returns {Object} Response
 * @returns {Object} Response.places - The places data if found
 * @returns {string} Response.error - Error message if request fails
 * @returns {number} Response.status - HTTP status code if request fails
 *
 * @example
 * // Request
 * GET /api/v1/places
 *
 * // Success Response
 * {
 *   places: [
 *     {
 *         "id": 29,
 *         "name": "VIDYA. Kanal",
 *         "slug": "vidya-kanal-tcen",
 *         "image": null,
 *         "accounts": "0xbB3676bc08fdD281D7b922A7676e0ee9f2667C8A",
 *         "description": null
 *     }
 *   ]
 * }
 *
 * // Error Response
 * {
 *   error: "Failed to get places",
 *   status: 400
 * }
 */

export interface PlaceResponse {
  id: number;
  name: string;
  slug: string;
  account: string;
  description: string | null;
  image: string | null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const tokens = searchParams.getAll("token");

  try {
    const client = getServiceRoleClient();
    const places = await getAllPlaces(client, tokens);

    return NextResponse.json({ places }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to get places" },
      { status: 500 }
    );
  }
}
