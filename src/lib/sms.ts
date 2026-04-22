type SendSmsInput = {
  to: string;
  body: string;
};

type SendSmsResult =
  | { ok: true; sid: string }
  | { ok: false; skipped?: boolean; error: string };

export async function sendSms({
  to,
  body,
}: SendSmsInput): Promise<SendSmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    return {
      ok: false,
      skipped: true,
      error: "Twilio env vars are not configured.",
    };
  }

  try {
    const twilioModule = await import("twilio");
    const twilio = twilioModule.default;
    const client = twilio(sid, token);

    const message = await client.messages.create({
      to,
      from,
      body,
    });

    return { ok: true, sid: message.sid };
  } catch (error) {
    console.error("sendSms failed", error);
    return {
      ok: false,
      error: "SMS send failed.",
    };
  }
}
