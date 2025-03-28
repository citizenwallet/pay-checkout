import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getServiceRoleClient } from "@/db";
import { getOrder } from "@/db/orders";
import dynamic from "next/dynamic";
import { Suspense } from "react";
const CreditCard = dynamic(() => import("./credit-card"));

export default async function CreditCardPayment({ params }: { params: Promise<{ accountOrUsername: string, orderId: number }> }) {

    const { orderId, accountOrUsername } = await params;

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
                <Card className="mx-auto max-w-lg">
                    <CardHeader className="flex flex-row items-center justify-start gap-4">
                        <CardTitle className="text-2xl font-bold">
                            Enter Credit Card Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="divide-y divide-gray-200 space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-40 w-full" />
                        </ul>
                    </CardContent>
                </Card>
            </div>

        }>
            <AsyncPage orderId={orderId} accountOrUsername={accountOrUsername} />
        </Suspense>
    )
}

async function AsyncPage({ orderId, accountOrUsername }: { orderId: number, accountOrUsername: string }) {

    const client = getServiceRoleClient();
    const { data, error } = await getOrder(client, orderId);
    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <CreditCard total={data?.total ?? 0} orderId={orderId} accountOrUsername={accountOrUsername} />
    )
}