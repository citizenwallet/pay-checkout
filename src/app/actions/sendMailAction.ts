"use server";

import { getServiceRoleClient } from "@/db";
import { createOtp } from "@/db/otp";
import { sendRegistationEmail } from "@/services/brevo";
import { generateOtp } from "@/utils/otp";
import jwt from "jsonwebtoken";

export async function sendMailAction(
  email: string,
  placeName: string,
  inviteCode: string
) {
  try {
    const client = getServiceRoleClient();
    const otp = await generateOtp(6);
    const link = await createLinkAction(otp, inviteCode, email);
    await sendRegistationEmail(email, link, placeName);
    await createOtp(client, email, otp.toString());
    return true;
  } catch (error) {
    return error;
  }
}

export async function createLinkAction(
  otp: number,
  inviteCode: string,
  email: string
) {
  const secretKey = process.env.JWT_KEY as string;

  if (!secretKey) {
    throw new Error("JWT_KEY is not defined in environment variables.");
  }
  // Create JWT token with email & OTP
  const token = jwt.sign({ email, otp: otp }, secretKey, { expiresIn: "10m" });

  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/vat?invite_code=${inviteCode}&otpToken=${token}`;

  return link;
}
