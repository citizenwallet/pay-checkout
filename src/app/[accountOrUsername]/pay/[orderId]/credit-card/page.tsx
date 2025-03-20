"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStripe, useElements, CardNumberElement, CardCvcElement, CardExpiryElement } from "@stripe/react-stripe-js";
import { getClientSecretAction } from "@/app/actions/paymentProcess";

export default function CreditCardPayment() {
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();
    const [message, setMessage] = useState<string>("");
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    useEffect(() => {

        const fetchClientSecret = async () => {
            try {
                const clientSecret = await getClientSecretAction(100);
                console.log("runing..")
                console.log(clientSecret);
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
        if (!stripe || !elements || !clientSecret) return;

        // Get the individual card elements
        const cardNumber = elements.getElement(CardNumberElement);
        const cardExpiry = elements.getElement(CardExpiryElement);
        const cardCvc = elements.getElement(CardCvcElement);

        if (!cardNumber || !cardExpiry || !cardCvc) {
            console.log("One or more card elements are missing");
            return;
        }

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardNumber,
            },
        });

        console.log(paymentIntent);

        if (error) {
            setMessage(error.message || "Payment failed.");
        } else {
            setMessage("Payment Successful!");
            router.push("/success"); // Redirect to a success page if needed
        }
    };


    return (
        <div className="p-6 max-w-md mx-auto bg-white shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold mb-4 text-center">Enter Credit Card Details</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Card Number
                            </label>
                            <CardNumberElement
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Expiration Date
                                </label>
                                <CardExpiryElement
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    CVC
                                </label>
                                <CardCvcElement
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 bg-gray-50"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded w-full transition-all disabled:bg-gray-400"
                    disabled={!stripe || !clientSecret}
                >
                    Pay Now
                </button>
            </form>
            {message && <p className="text-red-500 mt-4 text-center">{message}</p>}
        </div>
    );
}
