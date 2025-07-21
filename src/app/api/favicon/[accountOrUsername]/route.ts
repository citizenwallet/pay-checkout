import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/db";
import { CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { getPlaceWithProfile } from "@/lib/place";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountOrUsername: string }> }
) {
  try {
    const { accountOrUsername } = await params;

    // Add a test query parameter to check if this is a test request
    const url = new URL(request.url);
    if (url.searchParams.get("test") === "true") {
      return new NextResponse("Favicon API route is working!", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    const client = getServiceRoleClient();
    const community = new CommunityConfig(Config);

    const { place, profile } = await getPlaceWithProfile(
      client,
      community,
      accountOrUsername
    );

    // Determine the favicon URL based on place and profile
    let faviconUrl = "/favicon.ico"; // Default fallback

    if (place?.image) {
      faviconUrl = place.image;
    } else if (profile?.image) {
      faviconUrl = profile.image;
    }

    // If the favicon URL is external, fetch and serve the image
    if (faviconUrl.startsWith("http")) {
      try {
        const response = await fetch(faviconUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; FaviconBot/1.0)",
          },
        });

        if (response.ok) {
          const imageBuffer = await response.arrayBuffer();
          const contentType =
            response.headers.get("content-type") || "image/png";

          return new NextResponse(imageBuffer, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=3600", // Cache for 1 hour
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } catch (fetchError) {
        console.error("Error fetching external favicon:", fetchError);
      }
    }

    // If it's a local path or external fetch failed, redirect to the local path
    if (faviconUrl !== "/favicon.ico") {
      return NextResponse.redirect(new URL(faviconUrl, request.url));
    }

    // Final fallback to default favicon
    return NextResponse.redirect(new URL("/favicon.ico", request.url));
  } catch (error) {
    console.error("Error generating favicon:", error);
    // Fallback to default favicon
    return NextResponse.redirect(new URL("/favicon.ico", request.url));
  }
}
