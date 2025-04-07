
import { getServiceRoleClient } from "@/db";
import { deleteOrder } from "@/db/orders";
import { NextRequest, NextResponse } from "next/server";


export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json(
                { error: "Missing orderId parameter" },
                { status: 400 }
            );
        }

        const sigAuthAccount = request.headers.get("x-sigauth-account");
        const sigAuthExpiry = request.headers.get("x-sigauth-expiry");
        const sigAuthSignature = request.headers.get("x-sigauth-signature");
        
        if (!sigAuthAccount || !sigAuthExpiry || !sigAuthSignature) {
            return NextResponse.json(
                { error: "Missing signature headers" },
                { status: 401 }
            );
        }

        const expiryTime = new Date(sigAuthExpiry).getTime();
        const currentTime = new Date().getTime();
        if (currentTime > expiryTime) {
            return NextResponse.json(
                { error: "Signature expired" },
                { status: 401 }
            );
        }

        const client = getServiceRoleClient();

        const { error } = await deleteOrder(client, parseInt(orderId));

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { message: `Order ${orderId} deleted successfully` },
            { status: 200 }
        );
    } catch (err) {
        console.error("Error in Delete Order API:", err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

