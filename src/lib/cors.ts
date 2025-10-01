import { NextResponse } from "next/server";

/**
 * CORS headers to allow requests from any origin
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
  "Access-Control-Max-Age": "86400", // 24 hours
};

/**
 * Creates a CORS-enabled response
 */
export function createCorsResponse(data: unknown, status: number = 200) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders,
  });
}

/**
 * Creates a CORS-enabled OPTIONS response for preflight requests
 */
export function createCorsOptionsResponse() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
