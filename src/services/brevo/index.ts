import "server-only";

export const sendRegistationEmail = async (email: string, link: string,placeName:string) => {
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
