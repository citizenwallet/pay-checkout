"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStripe } from "@stripe/react-stripe-js";
import { getClientSecretAction } from "@/app/actions/paymentProcess";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelOrderAction } from "@/app/actions/cancelOrder";

export default function Bancontact({
    total,
    orderId,
    accountOrUsername
}: {
    total: number,
    orderId: number,
    accountOrUsername: string
}) {

    const stripe = useStripe();
    const router = useRouter();
    const [message, setMessage] = useState<string>("");
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [name, setName] = useState<string>("");
    const [cancelled, setCancelled] = useState(false);

    useEffect(() => {
        const fetchClientSecret = async () => {
            try {
                const clientSecret = await getClientSecretAction(100);
                setClientSecret(clientSecret);
            } catch (error: unknown) {
                if (error instanceof Error) {
                    setMessage(error.message);
                } else {
                    setMessage("An unknown error occurred.");
                }
            }
        };

        fetchClientSecret();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !clientSecret) return;

        const { error, paymentIntent } = await stripe.confirmBancontactPayment(clientSecret, {
            payment_method: {
                billing_details: {
                    name: name || "Anonymous",
                },
            },
            return_url: `${window.location.origin}/${accountOrUsername}/pay/${orderId}/success`,
        });


        if (error) {
            setMessage(error.message || "Payment failed.");
        } else if (paymentIntent?.status === "succeeded") {
            setMessage("Payment Successful!");
            router.push(`/${accountOrUsername}/pay/${orderId}/success`);
        }
    };

    const handleBack = async () => {
        router.back();
    }

    const handleCancelOrder = async () => {
        if (!total) {
            return;
        }
        await cancelOrderAction(orderId);
        setCancelled(true);
    };

    if (cancelled) {
        return <div>Order cancelled</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">


            <Card className="mx-auto max-w-lg">
                <CardHeader className="flex flex-row items-center justify-start gap-4">

                    <ArrowLeft onClick={handleBack} className="cursor-pointer mt-1.5" />

                    <CardTitle className="text-2xl font-bold">Pay with Bancontact</CardTitle>
                </CardHeader>
                <CardContent>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50"
                                placeholder="Enter your name"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full h-14 text-lg mb-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded  transition-all disabled:bg-gray-400"
                            disabled={!stripe || !clientSecret}
                        >
                            Pay with Bancontact
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleCancelOrder}
                            className="w-full h-14 text-lg mb-4"
                        >
                            Cancel Order
                        </Button>

                    </form>

                </CardContent>
                <CardFooter className="flex flex-col items-stretch">
                    {message && <p className="text-red-500 mt-4 text-center">{message}</p>}
                </CardFooter>
            </Card>
        </div>


    );
}
