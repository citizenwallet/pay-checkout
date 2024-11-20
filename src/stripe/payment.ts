import "server-only";

import Stripe from "stripe";

// export async function createPaymentIntent(amount: number) {
//   try {
//     const secretKey = process.env.STRIPE_SECRET_KEY;
//     if (!secretKey) {
//       throw new Error("STRIPE_SECRET_KEY is not set");
//     }

//     const baseDomain = process.env.BASE_DOMAIN;
//     if (!baseDomain) {
//       throw new Error("BASE_DOMAIN is not set");
//     }

//     const stripe = new Stripe(secretKey);

//     const metadata: Stripe.MetadataParam = {
//       account,
//       placeName: place.name,
//       placeId: place.id,
//       orderId,
//       amount,
//       forward_url: `https://${baseDomain}/api/v1/webhooks/stripe`,
//     };

//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: amount * 100, // Convert to cents
//       currency: "EUR",
//       metadata: {
//         // Add any additional metadata you need
//         timestamp: new Date().toISOString(),
//       },
//     });

//     return { clientSecret: paymentIntent.client_secret };
//   } catch (error) {
//     console.error("Error creating payment intent:", error);
//     throw new Error("Failed to create payment intent");
//   }
// }
