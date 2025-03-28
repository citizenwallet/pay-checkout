import { getClientSecretAction } from "@/app/actions/paymentProcess";
import { Elements, ExpressCheckoutElement } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set");
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PayElement({ total, accountOrUsername, orderId }: { total: number, accountOrUsername: string, orderId: number }) {
    const [message, setMessage] = useState<string>("");
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {

        const fetchClientSecret = async () => {
            try {
                const clientSecret = await getClientSecretAction(total);
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
    }, [total]);

    const handleExpressCheckoutConfirm = async () => {
        setMessage("Payment Successful!");
        router.push(`/${accountOrUsername}/pay/${orderId}/success`);
    };

    return (
        clientSecret && (
            <div className="mb-6">
                <Elements
                    stripe={stripePromise}
                    options={{
                        clientSecret,
                        appearance: {
                            theme: 'stripe',
                        },
                        loader: 'auto',
                    }}
                >
                    <ExpressCheckoutElement
                        options={{
                            buttonType: {
                                googlePay: 'buy',
                                applePay: 'buy'
                            },
                            wallets: {
                                applePay: 'always',
                                googlePay: 'always',
                            },
                            buttonHeight: 50,
                            paymentMethodOrder: ['google_pay', 'apple_pay'],
                            paymentMethods: {
                                googlePay: 'always',
                                applePay: 'always'
                            }
                        }}
                        onConfirm={handleExpressCheckoutConfirm}
                    />
                </Elements>
                {message && <p className="text-red-500 mt-4 text-center">{message}</p>}
            </div>
        )
    )
}
