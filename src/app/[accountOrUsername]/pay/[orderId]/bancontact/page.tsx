"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStripe } from "@stripe/react-stripe-js";
import { getClientSecretAction } from "@/app/actions/paymentProcess";

export default function BancontactPayment() {
    const stripe = useStripe();
    const router = useRouter();
    const [message, setMessage] = useState<string>("");
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [name, setName] = useState<string>("");

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
            return_url: `${window.location.origin}/success`,
        });


        if (error) {
            setMessage(error.message || "Payment failed.");
        } else if (paymentIntent?.status === "succeeded") {
            setMessage("Payment Successful!");
            router.push("/success");
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto bg-white shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold mb-4 text-center">Pay with Bancontact</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name (Optional)
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50"
                        placeholder="Enter your name"
                    />
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded w-full transition-all disabled:bg-gray-400"
                    disabled={!stripe || !clientSecret}
                >
                    Pay with Bancontact
                </button>
            </form>
            {message && <p className="text-red-500 mt-4 text-center">{message}</p>}
        </div>
    );
}