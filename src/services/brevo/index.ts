import "server-only";

export const sendRegistationEmail = async (
  email: string,
  link: string,
  placeName: string
) => {
  const params = {
    LINK: link,
    PLACE_NAME: placeName,
  };

  const payload = {
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME,
    },
    templateId: 4,
    subject: "Brussels Pay - Complete Registration",
    params,
    messageVersions: [
      {
        to: [{ email }],
      },
    ],
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to email");
  }
};

export const sendTransferConfirmationEmail = async (
  email: string,
  accountId: string,
  date: string,
  amount: string,
  treasuryName: string | null,
  treasuryAddress: string | null,
  treasuryImage: string | null,
  treasuryLink: string | null,
  image: string | null
) => {
  const params = {
    ACCOUNT_ID: accountId,
    DATE: date,
    AMOUNT: amount,
    TREASURY_IMAGE: treasuryImage,
    TREASURY_NAME: treasuryName,
    TREASURY_ADDRESS: treasuryAddress,
    TREASURY_LINK: treasuryLink,
    IMAGE: image,
  };

  const payload = {
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME,
    },
    templateId: 5,
    subject: `Transfer for card #${accountId} Received`,
    params,
    messageVersions: [
      {
        to: [{ email }],
      },
    ],
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to email");
  }
};

export const sendTransferToppedUpEmail = async (
  email: string,
  accountId: string,
  date: string,
  amount: string,
  treasuryName: string | null,
  treasuryAddress: string | null,
  treasuryImage: string | null,
  treasuryLink: string | null,
  image: string | null
) => {
  const params = {
    ACCOUNT_ID: accountId,
    DATE: date,
    AMOUNT: amount,
    TREASURY_IMAGE: treasuryImage,
    TREASURY_NAME: treasuryName,
    TREASURY_ADDRESS: treasuryAddress,
    TREASURY_LINK: treasuryLink,
    IMAGE: image,
  };

  const payload = {
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME,
    },
    templateId: 7,
    subject: `You have received tokens on your card.`,
    params,
    messageVersions: [
      {
        to: [{ email }],
      },
    ],
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to email");
  }
};

export const sendTransferFailedEmail = async (
  email: string,
  accountId: string,
  date: string,
  amount: string,
  target: string,
  treasuryName: string | null,
  treasuryAddress: string | null,
  treasuryImage: string | null,
  treasuryLink: string | null,
  image: string | null
) => {
  const params = {
    ACCOUNT_ID: accountId,
    DATE: date,
    AMOUNT: amount,
    TARGET: target,
    TREASURY_IMAGE: treasuryImage,
    TREASURY_NAME: treasuryName,
    TREASURY_ADDRESS: treasuryAddress,
    TREASURY_LINK: treasuryLink,
    IMAGE: image,
  };

  const payload = {
    sender: {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME,
    },
    templateId: 6,
    subject: `Insufficient amount sent ${amount} of ${target}`,
    params,
    messageVersions: [
      {
        to: [{ email }],
      },
    ],
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY!,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to email");
  }
};
